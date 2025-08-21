import { NextResponse } from 'next/server';

interface UserProfile {
  id: string;
  identifier: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'payee' | 'en_attente' | 'retard';
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

interface HistoryItem {
  id: string;
  action: string;
  date: string;
  description: string;
}

// Données mock pour le profil utilisateur
const mockProfile: UserProfile = {
  id: '1',
  identifier: 'DD001',
  firstName: 'Dominique',
  lastName: 'Durand',
  email: 'rennes@epicu.fr',
  phone: '06 00 00 00 00',
  role: 'Franchisé'
};

// Données mock pour les factures
const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'FAC-2025-001',
    date: '2025-06-15',
    amount: 1457.98,
    status: 'payee'
  },
  {
    id: '2',
    number: 'FAC-2025-002',
    date: '2025-06-20',
    amount: 2340.50,
    status: 'en_attente'
  },
  {
    id: '3',
    number: 'FAC-2025-003',
    date: '2025-06-25',
    amount: 890.25,
    status: 'retard'
  },
  {
    id: '4',
    number: 'FAC-2025-004',
    date: '2025-07-01',
    amount: 3200.00,
    status: 'en_attente'
  }
];

// Données mock pour les documents
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Contrat de franchise.pdf',
    type: 'PDF',
    uploadDate: '2025-01-15',
    size: '2.5 MB'
  },
  {
    id: '2',
    name: 'Guide utilisateur.docx',
    type: 'DOCX',
    uploadDate: '2025-02-20',
    size: '1.8 MB'
  },
  {
    id: '3',
    name: 'Certificat formation.pdf',
    type: 'PDF',
    uploadDate: '2025-03-10',
    size: '3.2 MB'
  },
  {
    id: '4',
    name: 'Manuel procédures.pdf',
    type: 'PDF',
    uploadDate: '2025-04-05',
    size: '4.1 MB'
  }
];

// Données mock pour l'historique
const mockHistory: HistoryItem[] = [
  {
    id: '1',
    action: 'Connexion',
    date: '2025-06-15 14:30',
    description: 'Connexion réussie depuis l\'adresse IP 192.168.1.100'
  },
  {
    id: '2',
    action: 'Modification profil',
    date: '2025-06-10 09:15',
    description: 'Mise à jour des informations personnelles'
  },
  {
    id: '3',
    action: 'Téléchargement document',
    date: '2025-06-05 16:45',
    description: 'Téléchargement du guide utilisateur'
  },
  {
    id: '4',
    action: 'Consultation factures',
    date: '2025-06-01 11:20',
    description: 'Consultation des factures Epicu'
  },
  {
    id: '5',
    action: 'Modification mot de passe',
    date: '2025-05-25 13:10',
    description: 'Changement du mot de passe'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'profile';

    switch (section) {
      case 'profile':
        return NextResponse.json(mockProfile);
      
      case 'invoices':
        return NextResponse.json({
          invoices: mockInvoices,
          total: mockInvoices.length
        });
      
      case 'documents':
        return NextResponse.json({
          documents: mockDocuments,
          total: mockDocuments.length
        });
      
      case 'history':
        return NextResponse.json({
          history: mockHistory,
          total: mockHistory.length
        });
      
      default:
        return NextResponse.json({
          profile: mockProfile,
          invoices: mockInvoices,
          documents: mockDocuments,
          history: mockHistory
        });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données du profil:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validation des données
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.role) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Mettre à jour le profil
    const updatedProfile: UserProfile = {
      ...mockProfile,
      ...body
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    // mockProfile = updatedProfile;

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 