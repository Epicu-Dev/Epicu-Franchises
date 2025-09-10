import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Configurer le client avec le token d'accès
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID d\'événement requis' },
        { status: 400 }
      );
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Récupérer la liste des calendriers pour trouver celui contenant "EPICU"
    const calendarList = await calendar.calendarList.list();
    const epicuCalendar = calendarList.data.items?.find(cal => 
      cal.summary?.toLowerCase().includes('epicu')
    );

    if (!epicuCalendar) {
      return NextResponse.json(
        { error: 'Aucun calendrier contenant "EPICU" trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer l'événement du calendrier EPICU
    await calendar.events.delete({
      calendarId: epicuCalendar.id!,
      eventId: eventId
    });

    return NextResponse.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });

  } catch (error) {
    // Si l'erreur est liée à un token expiré, essayer de le rafraîchir
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      const refreshToken = request.cookies.get('google_refresh_token')?.value;
      if (refreshToken) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();

          oauth2Client.setCredentials(credentials);
          
          // Réessayer la suppression
          const { searchParams } = new URL(request.url);
          const eventId = searchParams.get('eventId');
          
          if (!eventId) {
            return NextResponse.json(
              { error: 'ID d\'événement requis' },
              { status: 400 }
            );
          }

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          
          // Récupérer la liste des calendriers pour trouver celui contenant "EPICU"
          const calendarList = await calendar.calendarList.list();
          const epicuCalendar = calendarList.data.items?.find(cal => 
            cal.summary?.toLowerCase().includes('epicu')
          );

          if (!epicuCalendar) {
            return NextResponse.json(
              { error: 'Aucun calendrier contenant "EPICU" trouvé' },
              { status: 404 }
            );
          }
          
          await calendar.events.delete({
            calendarId: epicuCalendar.id!,
            eventId: eventId
          });

          return NextResponse.json({
            success: true,
            message: 'Événement supprimé avec succès'
          });
        } catch (refreshError) {
          return NextResponse.json(
            { error: 'Token expiré et impossible à rafraîchir' },
            { status: 401 }
          );
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'événement' },
      { status: 500 }
    );
  }
}
