import { NextRequest, NextResponse } from 'next/server';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  duration?: string;
  features?: string[];
}

interface Pack {
  id: string;
  title: string;
  description: string;
  services: string[];
  price: number;
  duration: string;
}

interface Prestation {
  id: string;
  serviceId: string;
  serviceTitle: string;
  status: 'en_cours' | 'terminee' | 'en_attente';
  startDate: string;
  endDate?: string;
  progress: number;
}

// Données de démonstration
const services: Service[] = [
  {
    id: '1',
    title: 'Graphisme',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'design',
    price: 500,
    duration: '2-3 semaines',
    features: ['Logo design', 'Charte graphique', 'Supports print', 'Packaging']
  },
  {
    id: '2',
    title: 'Motion Design',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'video',
    price: 800,
    duration: '3-4 semaines',
    features: ['Animation logo', 'Vidéo promotionnelle', 'Motion graphics', 'Rendu final']
  },
  {
    id: '3',
    title: 'Photos / Vidéos',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'media',
    price: 600,
    duration: '1-2 semaines',
    features: ['Shooting photo', 'Vidéo produit', 'Retouche', 'Optimisation']
  },
  {
    id: '4',
    title: 'Dev web',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'development',
    price: 1200,
    duration: '4-6 semaines',
    features: ['Site vitrine', 'E-commerce', 'Application web', 'Maintenance']
  },
  {
    id: '5',
    title: 'Référencement SEO',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'seo',
    price: 400,
    duration: '2-3 mois',
    features: ['Audit SEO', 'Optimisation', 'Suivi', 'Rapports']
  },
  {
    id: '6',
    title: 'Community management',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'social',
    price: 300,
    duration: 'Mensuel',
    features: ['Gestion réseaux', 'Création contenu', 'Modération', 'Analytics']
  },
  {
    id: '7',
    title: 'Data Analyse',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'analytics',
    price: 700,
    duration: '2-4 semaines',
    features: ['Audit données', 'Tableaux de bord', 'Rapports', 'Formation']
  },
  {
    id: '8',
    title: 'Sérigraphie & Textiles',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'printing',
    price: 200,
    duration: '1-2 semaines',
    features: ['Impression textile', 'Sérigraphie', 'Broderie', 'Livraison']
  }
];

const packs: Pack[] = [
  {
    id: '1',
    title: 'Pack Startup',
    description: 'Pack complet pour lancer votre entreprise',
    services: ['1', '5', '6'],
    price: 1200,
    duration: '3 mois'
  },
  {
    id: '2',
    title: 'Pack E-commerce',
    description: 'Tout pour vendre en ligne',
    services: ['4', '5', '6'],
    price: 2000,
    duration: '4 mois'
  }
];

const prestations: Prestation[] = [
  {
    id: '1',
    serviceId: '1',
    serviceTitle: 'Graphisme',
    status: 'en_cours',
    startDate: '2024-01-15',
    progress: 75
  },
  {
    id: '2',
    serviceId: '4',
    serviceTitle: 'Dev web',
    status: 'en_attente',
    startDate: '2024-02-01',
    progress: 0
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'services';
    const category = searchParams.get('category');

    let data;

    switch (type) {
      case 'services':
        data = category 
          ? services.filter(service => service.category === category)
          : services;
        break;
      case 'packs':
        data = packs;
        break;
      case 'prestations':
        data = prestations;
        break;
      default:
        data = services;
    }

    return NextResponse.json({
      data,
      total: data.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données studio:', error);

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.type || !body.serviceId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Simulation de l'ajout d'une prestation
    const newPrestation: Prestation = {
      id: `prestation-${Date.now()}`,
      serviceId: body.serviceId,
      serviceTitle: services.find(s => s.id === body.serviceId)?.title || 'Service',
      status: 'en_attente',
      startDate: new Date().toISOString().split('T')[0],
      progress: 0
    };

    return NextResponse.json({
      message: 'Prestation demandée avec succès',
      prestation: newPrestation
    });
  } catch (error) {
    console.error('Erreur lors de la demande de prestation:', error);

    return NextResponse.json(
      { error: 'Erreur lors de la demande de prestation' },
      { status: 500 }
    );
  }
}
