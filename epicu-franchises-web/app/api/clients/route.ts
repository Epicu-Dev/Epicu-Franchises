import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les clients
  return NextResponse.json({ message: 'Liste des clients (mock)' });
} 