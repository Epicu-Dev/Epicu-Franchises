import { NextResponse } from 'next/server';
import { mockProspects, type Prospect } from './data';

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
         prospect.categorie.toLowerCase() === category.toLowerCase();
      
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
     // eslint-disable-next-line no-console
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
       siret: body.siret || '',
       nomEtablissement: body.nomEtablissement,
       ville: body.ville || '',
       telephone: body.telephone || '',
       categorie: body.categorie || 'FOOD',
       statut: body.statut || 'a_contacter',
       datePremierRendezVous: body.datePremierRendezVous || '',
       dateRelance: body.dateRelance || new Date().toLocaleDateString('fr-FR'),
       vientDeRencontrer: body.vientDeRencontrer || false,
       commentaire: body.commentaire || '',
       suiviPar: body.suiviPar || '',
       email: body.email,
       adresse: body.adresse
     };

    // Dans un vrai projet, on sauvegarderait en base de données
    mockProspects.push(newProspect);

    return NextResponse.json(newProspect, { status: 201 });
     } catch (error) {
     // eslint-disable-next-line no-console
     console.error('Erreur lors de la création du prospect:', error);

     return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 
