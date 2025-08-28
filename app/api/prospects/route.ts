import { NextResponse } from 'next/server';

import { mockProspects, type Prospect } from './data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const q = searchParams.get('q') || '';
    const orderBy = searchParams.get('orderBy') || '';
    const order = searchParams.get('order') || 'asc';
    const statut = searchParams.get('statut') || 'a_contacter';
    const categorie = searchParams.get('categorie') || '';
    const suiviPar = searchParams.get('suiviPar') || '';

    // Filtrer les prospects par statut
    let filteredProspects = mockProspects.filter(prospect => {
      return prospect.statut === statut;
    });

    // Filtrer par recherche
    if (q) {
      filteredProspects = filteredProspects.filter(prospect => 
        prospect.nomEtablissement.toLowerCase().includes(q.toLowerCase()) ||
        prospect.ville.toLowerCase().includes(q.toLowerCase()) ||
        prospect.commentaire.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Filtrer par catégorie
    if (categorie) {
      filteredProspects = filteredProspects.filter(prospect => 
        prospect.categorie === categorie
      );
    }

    // Filtrer par suivi par
    if (suiviPar) {
      filteredProspects = filteredProspects.filter(prospect => 
        prospect.suiviPar === suiviPar
      );
    }

    // Trier les prospects
    if (orderBy) {
      filteredProspects.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (orderBy) {
          case 'categorie':
            aValue = a.categorie;
            bValue = b.categorie;
            break;
          case 'dateRelance':
            aValue = new Date(a.dateRelance);
            bValue = new Date(b.dateRelance);
            break;
          case 'suiviPar':
            aValue = a.suiviPar;
            bValue = b.suiviPar;
            break;
          default:
            aValue = a[orderBy as keyof Prospect];
            bValue = b[orderBy as keyof Prospect];
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
    const totalCount = filteredProspects.length;
    const paginatedProspects = filteredProspects.slice(offset, offset + limit);

    // Adapter la réponse selon le statut
    let responseData: any;

    if (statut === 'en_discussion') {
      responseData = {
        discussions: paginatedProspects,
        totalCount,
        viewCount: totalCount
      };
    } else {
      responseData = {
        prospects: paginatedProspects,
        totalCount,
        viewCount: totalCount
      };
    }

    return NextResponse.json(responseData);
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
