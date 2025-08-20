import { NextResponse } from 'next/server';
import { mockProspects } from '../../data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await params;

    // Trouver le prospect à convertir
    const prospectIndex = mockProspects.findIndex(p => p.id === prospectId);
    
    if (prospectIndex === -1) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      );
    }

    const prospect = mockProspects[prospectIndex];
    
    // Simulation de la conversion
    const convertedClient = {
      id: `client_${prospectId}`,
      raisonSociale: prospect.nomEtablissement,
      dateSignatureContrat: new Date().toLocaleDateString('fr-FR'),
      factureContenu: '',
      facturePublication: 'En attente',
      commentaire: 'Prospect converti en client',
      email: prospect.email || '',
      telephone: prospect.telephone || '',
      adresse: prospect.adresse || '',
      statut: 'actif'
    };

    // Supprimer le prospect de la liste des prospects
    mockProspects.splice(prospectIndex, 1);

    return NextResponse.json({
      message: 'Prospect converti en client avec succès',
      client: convertedClient
    });
  } catch (error) {
    console.error('Erreur lors de la conversion du prospect:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 
