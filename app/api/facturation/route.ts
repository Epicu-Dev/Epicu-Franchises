import { NextResponse } from 'next/server';

interface Invoice {
  id: string;
  category: string;
  establishmentName: string;
  date: string;
  amount: number;
  serviceType: string;
  status: 'payee' | 'en_attente' | 'retard';
  comment?: string;
}

// Données mock pour les factures
const mockInvoices: Invoice[] = [
  {
    id: '1',
    category: 'Shop',
    establishmentName: 'L\'ambiance',
    date: '2025-06-08',
    amount: 1457.98,
    serviceType: 'Tournage',
    status: 'payee',
    comment: 'Facture pour le tournage de la vidéo promotionnelle'
  },
  {
    id: '2',
    category: 'Restaurant',
    establishmentName: 'Le Gourmet',
    date: '2025-06-10',
    amount: 2340.50,
    serviceType: 'Photographie',
    status: 'en_attente',
    comment: 'Séance photo pour le menu du restaurant'
  },
  {
    id: '3',
    category: 'Shop',
    establishmentName: 'Mode & Style',
    date: '2025-06-12',
    amount: 890.25,
    serviceType: 'Design',
    status: 'payee',
    comment: 'Création de l\'identité visuelle'
  },
  {
    id: '4',
    category: 'Service',
    establishmentName: 'Tech Solutions',
    date: '2025-06-15',
    amount: 3200.00,
    serviceType: 'Développement',
    status: 'retard',
    comment: 'Développement du site web - paiement en retard'
  },
  {
    id: '5',
    category: 'Restaurant',
    establishmentName: 'La Terrasse',
    date: '2025-06-18',
    amount: 1567.75,
    serviceType: 'Marketing',
    status: 'en_attente',
    comment: 'Campagne marketing print et digital'
  },
  {
    id: '6',
    category: 'Shop',
    establishmentName: 'Boutique Chic',
    date: '2025-06-20',
    amount: 2100.00,
    serviceType: 'Consultation',
    status: 'payee',
    comment: 'Consultation stratégique et conseils'
  },
  {
    id: '7',
    category: 'Service',
    establishmentName: 'Digital Agency',
    date: '2025-06-22',
    amount: 4500.00,
    serviceType: 'Intégration',
    status: 'en_attente',
    comment: 'Intégration système de gestion'
  },
  {
    id: '8',
    category: 'Restaurant',
    establishmentName: 'Cuisine du Monde',
    date: '2025-06-25',
    amount: 1789.30,
    serviceType: 'Formation',
    status: 'retard',
    comment: 'Formation équipe - paiement en retard'
  },
  {
    id: '9',
    category: 'Shop',
    establishmentName: 'Fashion Forward',
    date: '2025-06-28',
    amount: 3200.00,
    serviceType: 'Branding',
    status: 'payee',
    comment: 'Refonte complète de la marque'
  },
  {
    id: '10',
    category: 'Service',
    establishmentName: 'Innovation Lab',
    date: '2025-06-30',
    amount: 5600.00,
    serviceType: 'Recherche',
    status: 'en_attente',
    comment: 'Étude de marché et analyse concurrentielle'
  },
  {
    id: '11',
    category: 'Shop',
    establishmentName: 'L\'ambiance',
    date: '2025-07-02',
    amount: 1890.45,
    serviceType: 'Édition',
    status: 'payee',
    comment: 'Édition vidéo et post-production'
  },
  {
    id: '12',
    category: 'Restaurant',
    establishmentName: 'Le Gourmet',
    date: '2025-07-05',
    amount: 1450.00,
    serviceType: 'Événementiel',
    status: 'en_attente',
    comment: 'Organisation événement de lancement'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'payee';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'establishmentName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Filtrer les factures
    let filteredInvoices = mockInvoices.filter(invoice => {
      const matchesStatus = status === 'tous' || invoice.status === status;
      const matchesSearch = !search || 
        invoice.establishmentName.toLowerCase().includes(search.toLowerCase()) ||
        invoice.serviceType.toLowerCase().includes(search.toLowerCase()) ||
        invoice.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || category === 'tous' || invoice.category === category;
      
      return matchesStatus && matchesSearch && matchesCategory;
    });

    // Trier les factures
    filteredInvoices.sort((a, b) => {
      const aValue = a[sortBy as keyof Invoice];
      const bValue = b[sortBy as keyof Invoice];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    return NextResponse.json({
      invoices: paginatedInvoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredInvoices.length / limit),
        totalItems: filteredInvoices.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
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
    if (!body.establishmentName || !body.date || !body.amount || !body.serviceType) {
      return NextResponse.json(
        { error: 'Nom de l\'établissement, date, montant et type de prestation sont requis' },
        { status: 400 }
      );
    }

    // Créer une nouvelle facture
    const newInvoice: Invoice = {
      id: (mockInvoices.length + 1).toString(),
      category: body.category || 'Shop',
      establishmentName: body.establishmentName,
      date: body.date,
      amount: body.amount,
      serviceType: body.serviceType,
      status: body.status || 'en_attente',
      comment: body.comment || ''
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    // mockInvoices.push(newInvoice);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 