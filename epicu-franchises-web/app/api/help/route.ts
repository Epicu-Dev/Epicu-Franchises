import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Connecter à AirTable pour envoyer une demande d'aide
  return NextResponse.json({ message: 'Demande d\'aide envoyée (mock)' });
} 