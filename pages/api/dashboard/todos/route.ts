import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Connecter à AirTable pour récupérer les todos
  return NextResponse.json({ message: 'Todos (mock)' });
} 