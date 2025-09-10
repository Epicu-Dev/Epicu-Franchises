import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleCalendarEvent } from '@/types/googleCalendar';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function POST(request: NextRequest) {
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

    const eventData: Partial<GoogleCalendarEvent> = await request.json();

    // Validation des données requises
    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json(
        { error: 'Données d\'événement incomplètes' },
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
    
    // Créer l'événement dans le calendrier EPICU
    const event = await calendar.events.insert({
      calendarId: epicuCalendar.id!,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        reminders: eventData.reminders || {
          useDefault: true
        },
        colorId: eventData.colorId,
        status: eventData.status || 'confirmed',
        transparency: eventData.transparency || 'opaque',
        visibility: eventData.visibility || 'default'
      }
    });

    const createdEvent = event.data;

    return NextResponse.json({
      id: createdEvent.id,
      summary: createdEvent.summary,
      description: createdEvent.description,
      location: createdEvent.location,
      start: createdEvent.start,
      end: createdEvent.end,
      attendees: createdEvent.attendees,
      reminders: createdEvent.reminders,
      colorId: createdEvent.colorId,
      status: createdEvent.status,
      transparency: createdEvent.transparency,
      visibility: createdEvent.visibility,
      htmlLink: createdEvent.htmlLink
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    
    // Si l'erreur est liée à un token expiré, essayer de le rafraîchir
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      const refreshToken = request.cookies.get('google_refresh_token')?.value;
      if (refreshToken) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          
          // Réessayer la création de l'événement
          const eventData: Partial<GoogleCalendarEvent> = await request.json();
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
          
          const event = await calendar.events.insert({
            calendarId: epicuCalendar.id!,
            requestBody: {
              summary: eventData.summary,
              description: eventData.description,
              location: eventData.location,
              start: eventData.start,
              end: eventData.end,
              attendees: eventData.attendees,
              reminders: eventData.reminders || {
                useDefault: true
              },
              colorId: eventData.colorId,
              status: eventData.status || 'confirmed',
              transparency: eventData.transparency || 'opaque',
              visibility: eventData.visibility || 'default'
            }
          });

          const createdEvent = event.data;

          return NextResponse.json({
            id: createdEvent.id,
            summary: createdEvent.summary,
            description: createdEvent.description,
            location: createdEvent.location,
            start: createdEvent.start,
            end: createdEvent.end,
            attendees: createdEvent.attendees,
            reminders: createdEvent.reminders,
            colorId: createdEvent.colorId,
            status: createdEvent.status,
            transparency: createdEvent.transparency,
            visibility: createdEvent.visibility,
            htmlLink: createdEvent.htmlLink
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
      { error: 'Erreur lors de la création de l\'événement' },
      { status: 500 }
    );
  }
}
