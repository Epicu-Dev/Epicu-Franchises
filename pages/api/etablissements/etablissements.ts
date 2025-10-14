import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'ÉTABLISSEMENTS';
const VIEW_NAME = '🌍 Tous établissements';

// Helper pour récupérer le Record_ID d'interaction
const getInteractionRecordId = (record: any) => {
  const fieldName = 'Record_ID (from INTERACTIONS)';
  const value = record.get(fieldName);
  
  // Gérer le cas où c'est un tableau (relation Airtable)
  if (Array.isArray(value) && value.length > 0) {
    const recordId = value[0];
    if (recordId && typeof recordId === 'string' && recordId.trim()) {
      return recordId;
    }
  }
  
  // Gérer le cas où c'est une chaîne simple
  if (value && typeof value === 'string' && value.trim()) {
    return value;
  }
  
  return null;
};

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    
    const limitRaw = parseInt((req.query.limit as string) || '50', 10);
    const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw));
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderByReq = (req.query.orderBy as string) || "Nom de l'établissement";
    const q = (req.query.q as string) || (req.query.search as string) || '';
    const category = (req.query.category as string) || '';

    const fields = [
      'Catégorie',
      "Nom de l'établissement",
      'Raison sociale',
      'Email',
      'Téléphone',
      'Adresse',
      'Ville',
      'Code postal',
      'SIRET',
      'Description',
      'Ville EPICU',
      'Commentaires interactions',
      'Date de signature (from HISTORIQUE DE PUBLICATIONS)',
      'HISTORIQUE DE PUBLICATIONS',
      'Record_ID (from INTERACTIONS)',
    ];

    const allowedOrderBy = new Set([
      "Nom de l'établissement",
      'Catégorie',
      'Raison sociale',
    ]);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Nom de l'établissement";

    const escapeForAirtable = (s: string) => s.replace(/'/g, "\\'").replace(/"/g, '\\"');

    // Options de sélection (tri/filtre côté Airtable)
    const selectOptions: any = {
      view: VIEW_NAME,
      fields,
      pageSize: limit,
      sort: [{ field: orderBy, direction: order }],
    };

    // Vérification de l'authentification
    const userId = await requireValidAccessToken(req, res);
    if (!userId) return; // requireValidAccessToken a déjà répondu

    // Auth: ne voir que les établissements qui partagent au moins une Ville EPICU avec l'utilisateur
    try {
      const userRecord = await base('COLLABORATEURS').find(userId);

      let linkedIds: string[] = [];
      const linked = userRecord.get('Ville EPICU');
      if (linked) {
        if (Array.isArray(linked)) linkedIds = linked;
        else if (typeof linked === 'string') linkedIds = [linked];
      }

      if (linkedIds.length === 0) {
        // l'utilisateur n'a pas de ville Epicu liée -> pas de résultats
        return res.status(200).json({
          clients: [],
          pagination: {
            limit,
            offset,
            orderBy,
            order,
            hasMore: false,
            nextOffset: null,
            prevOffset: Math.max(0, offset - limit),
          },
        });
      }

      try {
        const formulaForCities = `OR(${linkedIds.map((id) => `RECORD_ID() = '${id}'`).join(',')})`;
        const cityRecords = await base('VILLES EPICU').select({ filterByFormula: formulaForCities, fields: ['Ville EPICU'] }).all();
        const cityNames: string[] = cityRecords.map((c: any) => String(c.get('Ville EPICU') || '').trim()).filter(Boolean);

        if (cityNames.length === 0) {
          return res.status(200).json({
            clients: [],
            pagination: {
              limit,
              offset,
              orderBy,
              order,
              hasMore: false,
              nextOffset: null,
              prevOffset: Math.max(0, offset - limit),
            },
          });
        }

        const cityParts = cityNames.map((name) => {
          const esc = String(name).replace(/"/g, '\\"');
          return `FIND("${esc}", ARRAYJOIN({Ville EPICU}))`;
        });
        const cityFilter = `OR(${cityParts.join(',')})`;

        if (selectOptions.filterByFormula) {
          selectOptions.filterByFormula = `AND(${selectOptions.filterByFormula}, ${cityFilter})`;
        } else {
          selectOptions.filterByFormula = cityFilter;
        }
      } catch (e) {
        console.error('Erreur résolution villes Epicu:', e);
        return res.status(500).json({ error: 'Impossible de récupérer les villes Epicu de l\'utilisateur' });
      }
    } catch (e) {
      console.error('Erreur récupération utilisateur:', e);
      return res.status(500).json({ error: 'Impossible de récupérer les informations de l\'utilisateur' });
    }

    // Construire la formule de filtrage
    let filterFormulas: string[] = [];

    if (q && q.trim().length > 0) {
      const searchTerm = escapeForAirtable(q.trim().toLowerCase());

      filterFormulas.push(
        `OR(` +
        `FIND("${searchTerm}", LOWER({Nom de l'établissement})) > 0,` +
        `FIND("${searchTerm}", LOWER({Raison sociale})) > 0,` +
        `FIND("${searchTerm}", LOWER({Email})) > 0,` +
        `FIND("${searchTerm}", LOWER({Ville})) > 0,` +
        `FIND("${searchTerm}", LOWER({Code postal})) > 0,` +
        `FIND("${searchTerm}", LOWER({Commentaires interactions})) > 0` +
        `)`
      );
    }

    if (category && category.trim().length > 0) {
      try {
        let catName = String(category);

        if (/^rec/i.test(category)) {
          const rec = await base('Catégories').find(category);

          catName = String(rec.get('Name') || rec.get('Nom') || rec.get('Titre') || catName);
        }
        const catEsc = catName.replace(/'/g, "\\'");

        filterFormulas.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      } catch (e) {
        const catEsc = String(category).replace(/'/g, "\\'");

        filterFormulas.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      }
    }

    // Appliquer les filtres si il y en a (conserver/combiner le filtre Ville EPICU si présent)
    if (filterFormulas.length > 0) {
      if (selectOptions.filterByFormula) {
        selectOptions.filterByFormula = `AND(${selectOptions.filterByFormula}, ${filterFormulas.length === 1 ? filterFormulas[0] : `AND(${filterFormulas.join(', ')})`})`;
      } else {
        selectOptions.filterByFormula = filterFormulas.length === 1
          ? filterFormulas[0]
          : `AND(${filterFormulas.join(', ')})`;
      }
    }

    // Ne récupérer qu'au plus offset+limit en mémoire
    if (req.method === 'GET') {
      selectOptions.maxRecords = offset + limit;

      // Récupération + fenêtre
      const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();
      const pageRecords = upToPageRecords.slice(offset, offset + limit);

      // Résoudre Catégorie pour la page courante
      const categoryIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Catégorie') || [])));
      let categoryNames: Record<string, string> = {};

      if (categoryIds.length > 0) {
        const catRecords = await base('Catégories')
          .select({
            filterByFormula: `OR(${categoryIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
            fields: ['Name'],
            pageSize: Math.min(categoryIds.length, 100),
            maxRecords: categoryIds.length,
          })
          .all();

        catRecords.forEach((cat: any) => {
          categoryNames[cat.id] = cat.get('Name');
        });
      }

      // Récupérer les publications pour tous les clients de la page
      const publicationIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('HISTORIQUE DE PUBLICATIONS') || [])));
      let publicationsData: Record<string, any> = {};

      if (publicationIds.length > 0) {
        try {
          const publications = await base('HISTORIQUE DE PUBLICATIONS')
            .select({
              filterByFormula: `OR(${publicationIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
              fields: [
                'Date de publication',
                'Montant de la sponsorisation',
                "Montant de l'addition",
                'Cadeau du gérant pour le jeu concours',
                'Montant du cadeau',
                'Tirage effectué',
                'Commentaire',
                '📊 Nombre de vues',
                '❤️ Likes',
                '🔁 Partages',
                '📌 Enregistrements'
              ],
              pageSize: Math.min(publicationIds.length, 100),
              maxRecords: publicationIds.length,
            })
            .all();

          // Trier les publications par date de publication DESC
          const sortedPublications = Array.from(publications).sort((a: any, b: any) => {
            const dateA = a.get('Date de publication');
            const dateB = b.get('Date de publication');
            
            // Si aucune date, mettre à la fin
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            // Trier par date décroissante (plus récent en premier)
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });

          sortedPublications.forEach((pub: any) => {
            publicationsData[pub.id] = {
              id: pub.id,
              datePublication: pub.get('Date de publication'),
              montantSponsorisation: pub.get('Montant de la sponsorisation'),
              montantAddition: pub.get("Montant de l'addition"),
              nombreAbonnes: pub.get('Nbre d\'abonnés fait gagner au client'),
              cadeauGerant: pub.get('Cadeau du gérant pour le jeu concours'),
              montantCadeau: pub.get('Montant du cadeau'),
              tirageEffectue: pub.get('Tirage effectué'),
              benefice: pub.get('Bénéfice'),
              commentaire: pub.get('Commentaire'),
              nombreVues: pub.get('📊 Nombre de vues') || 0,
              likes: pub.get('❤️ Likes') || 0,
              partages: pub.get('🔁 Partages') || 0,
              enregistrements: pub.get('📌 Enregistrements') || 0,
            };
          });
        } catch (e) {
          // Ignorer les erreurs de récupération des publications
        }
      }

      const clients = pageRecords.map((record: any) => {
        const catIds = record.get('Catégorie') || [];
        const catName = Array.isArray(catIds) && catIds.length > 0
          ? (categoryNames[catIds[0]] || catIds[0])
          : '';

        // Récupérer les publications associées à ce client
        const clientPublicationIds = record.get('HISTORIQUE DE PUBLICATIONS') || [];
        const publications = Array.isArray(clientPublicationIds)
          ? clientPublicationIds.map((id: string) => publicationsData[id]).filter(Boolean)
          : [];

        return {
          id: record.id,
          nomEtablissement: record.get("Nom de l'établissement"),
          categorie: catName,
          raisonSociale: record.get('Raison sociale'),
          email: record.get('Email'),
          telephone: record.get('Téléphone'),
          adresse: record.get('Adresse'),
          ville: record.get('Ville'),
          codePostal: record.get('Code postal'),
          siret: record.get('SIRET'),
          description: record.get('Description'),
          villeEpicu: record.get('Ville EPICU'),
          commentaires: record.get('Commentaires interactions'),
          dateSignatureContrat: record.get('Date de signature (from HISTORIQUE DE PUBLICATIONS)'),
          publications: publications,
          recordIdFromInteractions: getInteractionRecordId(record),
        };
      });

      const hasMore = upToPageRecords.length === offset + limit;

      res.status(200).json({
        clients,
        pagination: {
          limit,
          offset,
          orderBy,
          order,
          hasMore,
          nextOffset: hasMore ? offset + limit : null,
          prevOffset: Math.max(0, offset - limit),
        },
      });
      return;
    }

    // Méthode non autorisée pour cette route
    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Airtable error:', {
      statusCode: error?.statusCode,
      type: error?.error?.type,
      message: error?.message,
    });
    res.status(500).json({
      error: 'Erreur Airtable',
      details: error?.message || String(error),
      statusCode: error?.statusCode,
      type: error?.error?.type,
    });
  }
}
