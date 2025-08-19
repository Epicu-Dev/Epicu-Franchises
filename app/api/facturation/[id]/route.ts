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

// Données mock pour les factures (copie de l'autre fichier)
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const invoice = mockInvoices.find(i => i.id === invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
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
    const { id: invoiceId } = await params;
    const body = await request.json();
    
    const invoiceIndex = mockInvoices.findIndex(i => i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la facture
    const updatedInvoice = {
      ...mockInvoices[invoiceIndex],
      ...body,
      id: invoiceId // Garder l'ID original
    };

    // Dans un vrai projet, on mettrait à jour en base de données
    // mockInvoices[invoiceIndex] = updatedInvoice;

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Erreur lors de la modification de la facture:', error);
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
    const { id: invoiceId } = await params;
    const invoiceIndex = mockInvoices.findIndex(i => i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Dans un vrai projet, on supprimerait de la base de données
    // mockInvoices.splice(invoiceIndex, 1);

    return NextResponse.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 