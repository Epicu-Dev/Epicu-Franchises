import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await params;

    // Dans un vrai projet, on récupérerait le prospect depuis la base de données
    // et on le convertirait en client
    
    // Simulation de la conversion
    const convertedClient = {
      id: `client_${prospectId}`,
      raisonSociale: `Prospect converti ${prospectId}`,
      dateSignatureContrat: new Date().toLocaleDateString('fr-FR'),
      factureContenu: '',
      facturePublication: 'En attente',
      commentaire: 'Prospect converti en client',
      email: '',
      telephone: '',
      adresse: '',
      statut: 'actif'
    };

    // Ici, on supprimerait le prospect de la liste des prospects
    // et on l'ajouterait à la liste des clients

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