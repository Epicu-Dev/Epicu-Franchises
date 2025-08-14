import { NextResponse } from 'next/server';

interface Prospect {
  id: string;
  nomEtablissement: string;
  categorie1: string;
  categorie2: string;
  dateRelance: string;
  suiviPar: string;
  commentaire: string;
  statut: 'a_contacter' | 'en_discussion' | 'glacial';
  email?: string;
  telephone?: string;
  adresse?: string;
}

// Données mock pour les prospects
const mockProspects: Prospect[] = [
  {
    id: '1',
    nomEtablissement: 'L\'ambiance',
    categorie1: 'Food',
    categorie2: 'Shop',
    dateRelance: '10.07.2025',
    suiviPar: 'Nom',
    commentaire: 'Commentaires',
    statut: 'a_contacter',
    email: 'contact@ambiance.fr',
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de l\'ambiance, 75001 Paris'
  },
  {
    id: '2',
    nomEtablissement: 'Le Petit Bistrot',
    categorie1: 'Food',
    categorie2: 'Service',
    dateRelance: '15.07.2025',
    suiviPar: 'Prénom',
    commentaire: 'Intéressé par nos services',
    statut: 'en_discussion',
    email: 'reservation@petitbistrot.fr',
    telephone: '01 98 76 54 32',
    adresse: '45 Avenue du Bistrot, 69001 Lyon'
  },
  {
    id: '3',
    nomEtablissement: 'Boutique Mode',
    categorie1: 'Shop',
    categorie2: 'Food',
    dateRelance: '20.07.2025',
    suiviPar: 'Nom',
    commentaire: 'À relancer dans 2 semaines',
    statut: 'glacial',
    email: 'info@boutiquemode.fr',
    telephone: '04 56 78 90 12',
    adresse: '78 Rue de la Mode, 13001 Marseille'
  },
  {
    id: '4',
    nomEtablissement: 'Café Central',
    categorie1: 'Food',
    categorie2: 'Shop',
    dateRelance: '25.07.2025',
    suiviPar: 'Prénom',
    commentaire: 'Très intéressé, demande de devis',
    statut: 'en_discussion',
    email: 'contact@cafecentral.fr',
    telephone: '02 34 56 78 90',
    adresse: '12 Place Centrale, 44000 Nantes'
  },
  {
    id: '5',
    nomEtablissement: 'Restaurant Gourmet',
    categorie1: 'Food',
    categorie2: 'Service',
    dateRelance: '30.07.2025',
    suiviPar: 'Nom',
    commentaire: 'Prospect chaud, à contacter rapidement',
    statut: 'a_contacter',
    email: 'reservation@gourmet.fr',
    telephone: '03 45 67 89 01',
    adresse: '56 Rue Gourmet, 31000 Toulouse'
  },
  {
    id: '6',
    nomEtablissement: 'Boulangerie Artisanale',
    categorie1: 'Food',
    categorie2: 'Shop',
    dateRelance: '05.08.2025',
    suiviPar: 'Prénom',
    commentaire: 'Nouveau prospect, première prise de contact',
    statut: 'a_contacter',
    email: 'contact@boulangerie.fr',
    telephone: '05 67 89 01 23',
    adresse: '89 Rue de la Boulangerie, 33000 Bordeaux'
  },
  {
    id: '7',
    nomEtablissement: 'Salon de Coiffure',
    categorie1: 'Service',
    categorie2: 'Shop',
    dateRelance: '10.08.2025',
    suiviPar: 'Nom',
    commentaire: 'Prospect froid, pas de réponse',
    statut: 'glacial',
    email: 'info@saloncoiffure.fr',
    telephone: '06 78 90 12 34',
    adresse: '34 Avenue de la Coiffure, 59000 Lille'
  },
  {
    id: '8',
    nomEtablissement: 'Pizzeria Bella',
    categorie1: 'Food',
    categorie2: 'Service',
    dateRelance: '15.08.2025',
    suiviPar: 'Prénom',
    commentaire: 'En négociation, prix à ajuster',
    statut: 'en_discussion',
    email: 'contact@pizzeriabella.fr',
    telephone: '07 89 01 23 45',
    adresse: '67 Rue de la Pizza, 21000 Dijon'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const suiviPar = searchParams.get('suiviPar') || '';
    const statut = searchParams.get('statut') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Filtrer les prospects
    let filteredProspects = mockProspects.filter(prospect => {
      const matchesSearch = !search || 
        prospect.nomEtablissement.toLowerCase().includes(search.toLowerCase()) ||
        prospect.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !category || category === 'tous' || 
        prospect.categorie1.toLowerCase() === category.toLowerCase() ||
        prospect.categorie2.toLowerCase() === category.toLowerCase();
      
      const matchesSuiviPar = !suiviPar || suiviPar === 'tous' || 
        prospect.suiviPar.toLowerCase() === suiviPar.toLowerCase();
      
      const matchesStatut = !statut || prospect.statut === statut;
      
      return matchesSearch && matchesCategory && matchesSuiviPar && matchesStatut;
    });

    // Trier les prospects
    if (sortBy) {
      filteredProspects.sort((a, b) => {
        const aValue = a[sortBy as keyof Prospect] || '';
        const bValue = b[sortBy as keyof Prospect] || '';
        
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
    const paginatedProspects = filteredProspects.slice(startIndex, endIndex);

    return NextResponse.json({
      prospects: paginatedProspects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredProspects.length / limit),
        totalItems: filteredProspects.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des prospects:', error);
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
    if (!body.nomEtablissement) {
      return NextResponse.json(
        { error: 'Le nom de l\'établissement est requis' },
        { status: 400 }
      );
    }

    // Créer un nouveau prospect
    const newProspect: Prospect = {
      id: (mockProspects.length + 1).toString(),
      nomEtablissement: body.nomEtablissement,
      categorie1: body.categorie1 || '',
      categorie2: body.categorie2 || '',
      dateRelance: body.dateRelance || new Date().toLocaleDateString('fr-FR'),
      suiviPar: body.suiviPar || '',
      commentaire: body.commentaire || '',
      statut: body.statut || 'a_contacter',
      email: body.email,
      telephone: body.telephone,
      adresse: body.adresse
    };

    // Dans un vrai projet, on sauvegarderait en base de données
    // mockProspects.push(newProspect);

    return NextResponse.json(newProspect, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du prospect:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 