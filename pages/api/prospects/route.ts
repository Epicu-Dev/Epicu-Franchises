import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les prospects
  return NextResponse.json({ message: 'Liste des prospects (mock)' });
} 