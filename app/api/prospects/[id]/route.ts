import { NextResponse } from 'next/server';

import { mockProspects, type Prospect } from '../data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await params;

    const prospect = mockProspects.find(p => p.id === prospectId);

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error('Erreur lors de la récupération du prospect:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await params;
    const body = await request.json();
    
    const prospectIndex = mockProspects.findIndex(p => p.id === prospectId);
    
    if (prospectIndex === -1) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      );
    }

    // Validation des données requises
    if (!body.nomEtablissement) {
      return NextResponse.json(
        { error: 'Le nom de l\'établissement est requis' },
        { status: 400 }
      );
    }

    // Mettre à jour le prospect
    const updatedProspect: Prospect = {
      ...mockProspects[prospectIndex],
      ...body,
      id: prospectId // Garder l'ID original
    };

    // Dans un vrai projet, on mettrait à jour en base de données
    mockProspects[prospectIndex] = updatedProspect;

    return NextResponse.json(updatedProspect);
  } catch (error) {
    console.error('Erreur lors de la modification du prospect:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await params;
    
    const prospectIndex = mockProspects.findIndex(p => p.id === prospectId);
    
    if (prospectIndex === -1) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      );
    }

    // Dans un vrai projet, on supprimerait de la base de données
    mockProspects.splice(prospectIndex, 1);

    return NextResponse.json({ message: 'Prospect supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du prospect:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
