import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Connecter à AirTable pour convertir un prospect en client
  return NextResponse.json({ message: 'Prospect converti (mock)' });
} 