import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
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

    // Récupérer les paramètres de date
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 jours

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Récupérer les événements du calendrier principal
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });

    // Transformer les événements au format de notre application
    const transformedEvents = events.data.items?.map(event => ({
      id: event.id,
      summary: event.summary || 'Sans titre',
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
      reminders: event.reminders,
      colorId: event.colorId,
      status: event.status,
      transparency: event.transparency,
      visibility: event.visibility
    })) || [];

    return NextResponse.json({
      events: transformedEvents,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    
    // Si l'erreur est liée à un token expiré, essayer de le rafraîchir
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      const refreshToken = request.cookies.get('google_refresh_token')?.value;
      if (refreshToken) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          
          // Réessayer la synchronisation
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100
          });

          const transformedEvents = events.data.items?.map(event => ({
            id: event.id,
            summary: event.summary || 'Sans titre',
            description: event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            attendees: event.attendees,
            reminders: event.reminders,
            colorId: event.colorId,
            status: event.status,
            transparency: event.transparency,
            visibility: event.visibility
          })) || [];

          return NextResponse.json({
            events: transformedEvents,
            syncTime: new Date().toISOString()
          });
        } catch (refreshError) {
          console.error('Erreur lors du rafraîchissement du token:', refreshError);
          return NextResponse.json(
            { error: 'Token expiré et impossible à rafraîchir' },
            { status: 401 }
          );
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}
