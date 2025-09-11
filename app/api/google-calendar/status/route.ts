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
      return NextResponse.json({
        isConnected: false,
        calendars: []
      });
    }

    // Configurer le client avec le token d'accès
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Vérifier si le token est valide en récupérant la liste des calendriers
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
      const calendarList = await calendar.calendarList.list();
      
      return NextResponse.json({
        isConnected: true,
        lastSync: new Date().toISOString(),
        calendars: calendarList.data.items?.map(cal => ({
          id: cal.id!,
          summary: cal.summary!,
          description: cal.description,
          primary: cal.primary || false,
          accessRole: cal.accessRole!
        })) || []
      });
    } catch (error) {
      // Si l'erreur est liée à un token expiré, essayer de le rafraîchir
      if (refreshToken) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          
          const calendarList = await calendar.calendarList.list();
          
          return NextResponse.json({
            isConnected: true,
            lastSync: new Date().toISOString(),
            calendars: calendarList.data.items?.map(cal => ({
              id: cal.id!,
              summary: cal.summary!,
              description: cal.description,
              primary: cal.primary || false,
              accessRole: cal.accessRole!
            })) || []
          });
        } catch (refreshError) {
          console.error('Erreur lors du rafraîchissement du token:', refreshError);
          return NextResponse.json({
            isConnected: false,
            error: 'Token expiré et impossible à rafraîchir',
            calendars: []
          });
        }
      }
      
      return NextResponse.json({
        isConnected: false,
        error: 'Token invalide',
        calendars: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
