import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Supprimer les cookies de tokens
    const response = NextResponse.json({ success: true });
    
    response.cookies.delete('google_access_token');
    response.cookies.delete('google_refresh_token');
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
