import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les paiements
  return NextResponse.json({ message: 'Paiements (mock)' });
} 