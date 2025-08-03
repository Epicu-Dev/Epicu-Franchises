import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les événements du jour
  return NextResponse.json({ message: 'Événements du jour (mock)' });
} 