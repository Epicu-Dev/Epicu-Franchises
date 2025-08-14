import { NextResponse } from 'next/server';

interface Client {
  id: string;
  raisonSociale: string;
  dateSignatureContrat: string;
  factureContenu: string;
  facturePublication: string;
  commentaire: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  statut?: 'actif' | 'inactif' | 'prospect';
}

// Données mock pour les clients
const mockClients: Client[] = [
  {
    id: '1',
    raisonSociale: 'La petite gourmandise',
    dateSignatureContrat: '08.06.2025',
    factureContenu: '12.07.2025',
    facturePublication: 'En attente',
    commentaire: 'Client fidèle depuis 2 ans',
    email: 'contact@lapetitegourmandise.fr',
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de la Gastronomie, 75001 Paris',
    statut: 'actif'
  },
  {
    id: '2',
    raisonSociale: 'Boulangerie du Marché',
    dateSignatureContrat: '15.05.2025',
    factureContenu: '20.06.2025',
    facturePublication: 'Payée',
    commentaire: 'Nouveau client, très satisfait',
    email: 'info@boulangeriedumarche.fr',
    telephone: '01 98 76 54 32',
    adresse: '45 Place du Marché, 69001 Lyon',
    statut: 'actif'
  },
  {
    id: '3',
    raisonSociale: 'Pâtisserie Artisanale',
    dateSignatureContrat: '22.04.2025',
    factureContenu: '30.05.2025',
    facturePublication: 'En retard',
    commentaire: 'Paiement en retard, relance nécessaire',
    email: 'contact@patisserieartisanale.fr',
    telephone: '04 56 78 90 12',
    adresse: '78 Avenue des Délices, 13001 Marseille',
    statut: 'actif'
  },
  {
    id: '4',
    raisonSociale: 'Café Central',
    dateSignatureContrat: '10.03.2025',
    factureContenu: '15.04.2025',
    facturePublication: 'Payée',
    commentaire: 'Client régulier, commandes mensuelles',
    email: 'reservation@cafecentral.fr',
    telephone: '02 34 56 78 90',
    adresse: '12 Place Centrale, 44000 Nantes',
    statut: 'actif'
  },
  {
    id: '5',
    raisonSociale: 'Restaurant Le Gourmet',
    dateSignatureContrat: '05.02.2025',
    factureContenu: '10.03.2025',
    facturePublication: 'Payée',
    commentaire: 'Restaurant gastronomique, client premium',
    email: 'contact@legourmet.fr',
    telephone: '03 45 67 89 01',
    adresse: '56 Rue de la Gastronomie, 31000 Toulouse',
    statut: 'actif'
  }
];

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
    let filteredClients = mockClients.filter(client => {
      const matchesSearch = !search || 
        client.raisonSociale.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !category || category === 'tous' || client.statut === category;
      
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
    const newClient: Client = {
      id: (mockClients.length + 1).toString(),
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

    // Dans un vrai projet, on sauvegarderait en base de données
    // mockClients.push(newClient);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 