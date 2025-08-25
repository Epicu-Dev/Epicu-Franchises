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

// Données mock partagées pour les factures
export const mockInvoices: Invoice[] = [
  {
    id: '1',
    category: 'Shop',
    establishmentName: 'L\'ambiance',
    date: '2025-06-08',
    amount: 1457.98,
    serviceType: 'creation_contenu',
    status: 'payee',
    comment: 'Facture pour le tournage de la vidéo promotionnelle'
  },
  {
    id: '2',
    category: 'food',
    establishmentName: 'Le Gourmet',
    date: '2025-06-10',
    amount: 2340.50,
    serviceType: 'studio',
    status: 'en_attente',
    comment: 'Séance photo pour le menu du restaurant'
  },
  {
    id: '3',
    category: 'Shop',
    establishmentName: 'Mode & Style',
    date: '2025-06-12',
    amount: 890.25,
    serviceType: 'publication',
    status: 'payee',
    comment: 'Création de l\'identité visuelle'
  },
  {
    id: '4',
    category: 'beauty',
    establishmentName: 'Tech Solutions',
    date: '2025-06-15',
    amount: 3200.00,
    serviceType: 'creation_contenu',
    status: 'retard',
    comment: 'Développement du site web - paiement en retard'
  },
  {
    id: '5',
    category: 'food',
    establishmentName: 'La Terrasse',
    date: '2025-06-18',
    amount: 1567.75,
    serviceType: 'publication',
    status: 'en_attente',
    comment: 'Campagne marketing print et digital'
  },
  {
    id: '6',
    category: 'Shop',
    establishmentName: 'Boutique Chic',
    date: '2025-06-20',
    amount: 2100.00,
    serviceType: 'studio',
    status: 'payee',
    comment: 'Consultation stratégique et conseils'
  },
  {
    id: '7',
    category: 'fun',
    establishmentName: 'Digital Agency',
    date: '2025-06-22',
    amount: 4500.00,
    serviceType: 'creation_contenu',
    status: 'en_attente',
    comment: 'Intégration système de gestion'
  },
  {
    id: '8',
    category: 'travel',
    establishmentName: 'Cuisine du Monde',
    date: '2025-06-25',
    amount: 1789.30,
    serviceType: 'studio',
    status: 'retard',
    comment: 'Formation équipe - paiement en retard'
  },
  {
    id: '9',
    category: 'Shop',
    establishmentName: 'Fashion Forward',
    date: '2025-06-28',
    amount: 3200.00,
    serviceType: 'publication',
    status: 'payee',
    comment: 'Refonte complète de la marque'
  },
  {
    id: '10',
    category: 'food',
    establishmentName: 'Innovation Lab',
    date: '2025-06-30',
    amount: 5600.00,
    serviceType: 'creation_contenu',
    status: 'en_attente',
    comment: 'Étude de marché et analyse concurrentielle'
  },
  {
    id: '11',
    category: 'Shop',
    establishmentName: 'L\'ambiance',
    date: '2025-07-02',
    amount: 1890.45,
    serviceType: 'creation_contenu',
    status: 'payee',
    comment: 'Édition vidéo et post-production'
  },
  {
    id: '12',
    category: 'food',
    establishmentName: 'Le Gourmet',
    date: '2025-07-05',
    amount: 1450.00,
    serviceType: 'studio',
    status: 'en_attente',
    comment: 'Organisation événement de lancement'
  }
];

export type { Invoice };
