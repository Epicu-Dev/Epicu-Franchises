import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les événements
  return NextResponse.json({ message: 'Événements à venir (mock)' });
} 