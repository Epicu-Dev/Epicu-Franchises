import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/agenda?error=auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/agenda?error=no_code`
      );
    }

    // Échanger le code contre des tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/agenda?error=no_access_token`
      );
    }

    // Stocker les tokens (dans une base de données en production)
    // Pour cet exemple, on les stocke dans des cookies sécurisés
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/agenda?success=connected`
    );

    // Stocker les tokens dans des cookies sécurisés
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 heure
    });

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 jours
      });
    }

    return response;
  } catch (error) {
    console.error('Erreur lors du callback Google:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/agenda?error=callback_failed`
    );
  }
}
