import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { franchiseId: string } }) {
  // TODO: Connecter à AirTable pour récupérer le CA de la franchise
  const { franchiseId } = params;
  return NextResponse.json({ message: `Chiffre d'affaires pour la franchise ${franchiseId} (mock)` });
} 