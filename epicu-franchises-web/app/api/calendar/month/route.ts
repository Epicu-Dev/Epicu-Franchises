import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les événements du mois
  return NextResponse.json({ message: 'Événements du mois (mock)' });
} 