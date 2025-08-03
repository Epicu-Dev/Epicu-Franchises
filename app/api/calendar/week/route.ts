import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les événements de la semaine
  return NextResponse.json({ message: 'Événements de la semaine (mock)' });
} 