import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer le CA global
  return NextResponse.json({ message: 'Chiffre d\'affaires global (mock)' });
} 