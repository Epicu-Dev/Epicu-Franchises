import { NextResponse } from 'next/server';
import { Client, getAllClients, addClient } from './data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Filtrer les clients
    const allClients = getAllClients();
    let filteredClients = allClients.filter(client => {
      const matchesSearch = !search || 
        client.raisonSociale.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !category || category === 'tous' || client.categorie === category;
      
      return matchesSearch && matchesCategory;
    });

    // Trier les clients
    if (sortBy) {
      filteredClients.sort((a, b) => {
        const aValue = a[sortBy as keyof Client] || '';
        const bValue = b[sortBy as keyof Client] || '';
        
        if (sortOrder === 'asc') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    return NextResponse.json({
      clients: paginatedClients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredClients.length / limit),
        totalItems: filteredClients.length,
        itemsPerPage: limit
      }
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