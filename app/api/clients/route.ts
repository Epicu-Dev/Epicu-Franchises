import { NextResponse } from 'next/server';

import { Client, getAllClients, addClient } from './data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const q = searchParams.get('q') || '';
    const orderBy = searchParams.get('orderBy') || '';
    const order = searchParams.get('order') || 'asc';

    // Filtrer les clients
    const allClients = getAllClients();
    let filteredClients = allClients.filter(client => {
      const matchesSearch = !q || 
        client.raisonSociale.toLowerCase().includes(q.toLowerCase()) ||
        client.email?.toLowerCase().includes(q.toLowerCase()) ||
        client.ville?.toLowerCase().includes(q.toLowerCase());
      
      return matchesSearch;
    });

    // Trier les clients
    if (orderBy) {
      filteredClients.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (orderBy) {
          case 'categorie':
            aValue = a.categorie;
            bValue = b.categorie;
            break;
          case 'dateSignatureContrat':
            aValue = new Date(a.dateSignatureContrat || '');
            bValue = new Date(b.dateSignatureContrat || '');
            break;
          case 'statutPaiementContenu':
            aValue = a.statutPaiementContenu;
            bValue = b.statutPaiementContenu;
            break;
          default:
            aValue = a[orderBy as keyof Client];
            bValue = b[orderBy as keyof Client];
        }

        if (order === 'asc') {
          if (aValue instanceof Date && bValue instanceof Date) {
            return aValue.getTime() - bValue.getTime();
          }
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          if (aValue instanceof Date && bValue instanceof Date) {
            return bValue.getTime() - aValue.getTime();
          }
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
    }

    // Pagination
    const totalCount = filteredClients.length;
    const paginatedClients = filteredClients.slice(offset, offset + limit);

    return NextResponse.json({
      clients: paginatedClients,
      totalCount,
      viewCount: totalCount
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.raisonSociale) {
      return NextResponse.json(
        { error: 'La raison sociale est requise' },
        { status: 400 }
      );
    }

    // Créer un nouveau client
    const clientData = {
      raisonSociale: body.raisonSociale,
      dateSignatureContrat: body.dateSignatureContrat || new Date().toLocaleDateString('fr-FR'),
      factureContenu: body.factureContenu || '',
      facturePublication: body.facturePublication || 'En attente',
      commentaire: body.commentaire || '',
      email: body.email,
      telephone: body.telephone,
      adresse: body.adresse,
      statut: body.statut || 'actif'
    };

    // Ajouter le client via la fonction partagée
    const newClient = addClient(clientData);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 