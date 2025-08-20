import { NextResponse } from 'next/server';
import { Client, getClientById, updateClient, deleteClient } from '../data';

// GET - Récupérer un client spécifique
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getClientById(id);
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un client
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validation des données requises
    if (!body.raisonSociale) {
      return NextResponse.json(
        { error: 'La raison sociale est requise' },
        { status: 400 }
      );
    }

    // Mettre à jour le client via la fonction partagée
    const updatedClient = updateClient(id, body);
    
    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Erreur lors de la modification du client:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un client
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Supprimer le client via la fonction partagée
    const deletedClient = deleteClient(id);
    
    if (!deletedClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Client supprimé avec succès',
      client: deletedClient 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
