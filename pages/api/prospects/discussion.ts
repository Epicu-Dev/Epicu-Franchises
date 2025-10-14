import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const VIEW_NAME = '🟡 En discussion';
const TABLE_NAME = 'ÉTABLISSEMENTS';

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
    // Vérification de l'authentification
    const userId = await requireValidAccessToken(req, res);
    if (!userId) return; // requireValidAccessToken a déjà répondu

    const limitRaw = parseInt((req.query.limit as string) || '10', 10);
    const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 10 : limitRaw)); // Airtable pageSize max 100
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderByReq = (req.query.orderBy as string) || "Nom de l'établissement";
    const q = (req.query.q as string) || (req.query.search as string) || '';

    // Champs autorisés (sécurité + cohérence tri)
    const fields = [
      "Nom de l'établissement",
      'Catégorie',
      'Ville',
      'Suivi par',
      'Commentaires interactions',
      'Date de relance',
      'Téléphone',
      'Email',
      'Adresse',
      'Record_ID (from INTERACTIONS)',
    ];
    const allowedOrderBy = new Set([...fields]);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Nom de l'établissement";

    const escapeForAirtable = (s: string) => s.replace(/'/g, "\\'").replace(/"/g, '\\"');

    // Options de sélection communes
    const selectOptions: any = {
      view: VIEW_NAME,
      fields,
      pageSize: limit, // ne récupère que 'limit' par page côté API
      sort: [{ field: orderBy, direction: order }],
    };

    // Auth: si l'utilisateur est admin -> voir toutes les discussions
    // sinon -> ne voir que les discussions qui partagent au moins une Ville EPICU avec lui
    try {
      const userRecord = await base('COLLABORATEURS').find(userId);
      const userRole = String(userRecord.get('Rôle') || '').toLowerCase();
      const isAdmin = userRole === 'admin' || userRole === 'administrateur';

      if (!isAdmin) {
        let linkedIds: string[] = [];
        const linked = userRecord.get('Ville EPICU');
        if (linked) {
          if (Array.isArray(linked)) linkedIds = linked;
          else if (typeof linked === 'string') linkedIds = [linked];
        }

        if (linkedIds.length === 0) {
          // l'utilisateur n'a pas de ville Epicu liée -> pas de résultats
          return res.status(200).json({
            discussions: [],
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

        // Résoudre les IDs de Ville EPICU en noms (table VILLES EPICU)
        try {
          const formulaForCities = `OR(${linkedIds.map((id) => `RECORD_ID() = '${id}'`).join(',')})`;
          const cityRecords = await base('VILLES EPICU')
            .select({ filterByFormula: formulaForCities, fields: ['Ville EPICU'] })
            .all();

          const cityNames: string[] = cityRecords
            .map((c: any) => String(c.get('Ville EPICU') || '').trim())
            .filter(Boolean);

          if (cityNames.length === 0) {
            // Aucune ville résolue -> pas de résultats
            return res.status(200).json({
              discussions: [],
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

          // Échapper les guillemets doubles pour inclusion dans la formule
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
      }
    } catch (e) {
      console.error('Erreur récupération utilisateur:', e);
      return res.status(500).json({ error: 'Impossible de récupérer les informations de l\'utilisateur' });
    }

    // Optional filters: full-text q + category (linked record id) + suivi (linked collaborator id)
    const categoryFilter = (req.query.category as string) || (req.query.categorie as string) || null;
    const suiviFilter = (req.query.suivi as string) || (req.query.suiviPar as string) || null;

    const formulaParts: string[] = [];

    if (q && q.trim().length > 0) {
      const searchTerm = escapeForAirtable(q.trim().toLowerCase());
      const qFormula = `OR(FIND("${searchTerm}", LOWER({Nom de l'établissement})) > 0, FIND("${searchTerm}", LOWER({Ville})) > 0, FIND("${searchTerm}", LOWER({Commentaires interactions})) > 0)`;
      formulaParts.push(qFormula);
    }

    // If the client provided a record id (ex: starts with 'rec'), resolve it to the display name
    if (categoryFilter) {
      try {
        let catName = String(categoryFilter);

        if (/^rec/i.test(categoryFilter)) {
          const rec = await base('Catégories').find(categoryFilter);

          // prefer 'Name' field, fallback to any common name fields
          catName = String(rec.get('Name') || rec.get('Nom') || rec.get('Titre') || catName);
        }
        const catEsc = catName.replace(/'/g, "\\'");

        formulaParts.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      } catch (e) {
        // if resolve fails, fallback to raw value
        const catEsc = String(categoryFilter).replace(/'/g, "\\'");

        formulaParts.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      }
    }

    if (suiviFilter) {
      try {
        let suiviName = String(suiviFilter);

        if (/^rec/i.test(suiviFilter)) {
          const rec = await base('Collaborateurs').find(suiviFilter);

          // prefer a full name field if present, else concat Prenom + Nom
          suiviName = String(rec.get('Nom complet') || `${rec.get('Prénom') || ''} ${rec.get('Nom') || ''}`.trim() || suiviName);
        }
        const suEsc = suiviName.replace(/'/g, "\\'");

        formulaParts.push(`FIND('${suEsc}', ARRAYJOIN({Suivi par})) > 0`);
      } catch (e) {
        const suEsc = String(suiviFilter).replace(/'/g, "\\'");

        formulaParts.push(`FIND('${suEsc}', ARRAYJOIN({Suivi par})) > 0`);
      }
    }

    if (formulaParts.length > 0) {
      if (selectOptions.filterByFormula) {
        selectOptions.filterByFormula = `AND(${selectOptions.filterByFormula}, ${formulaParts.length === 1 ? formulaParts[0] : `AND(${formulaParts.join(',')})`})`;
      } else {
        selectOptions.filterByFormula = formulaParts.length === 1 ? formulaParts[0] : `AND(${formulaParts.join(',')})`;
      }
    }

    // ⚡️ On ne récupère que 'offset + limit' en tout.
    selectOptions.maxRecords = offset + limit;

    // Récupérer (au plus) offset+limit, triés côté Airtable
    const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

    // Extraire la fenêtre demandée
    const pageRecords = upToPageRecords.slice(offset, offset + limit);

    // Résolution des relations (uniquement pour la page courante)
    const categoryIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Catégorie') || [])));
    const suiviIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Suivi par') || [])));

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

    let suiviNames: Record<string, string> = {};

    if (suiviIds.length > 0) {
      const collabRecords = await base('Collaborateurs')
        .select({
          filterByFormula: `OR(${suiviIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Prénom', 'Nom'],
          pageSize: Math.min(suiviIds.length, 100),
          maxRecords: suiviIds.length,
        })
        .all();

      collabRecords.forEach((collab: any) => {
        const prenom = collab.get('Prénom') || '';
        const nom = collab.get('Nom') || '';

        suiviNames[collab.id] = `${prenom} ${nom}`.trim();
      });
    }

    const discussions = pageRecords.map((record: any) => {
      const catIds = record.get('Catégorie') || [];
      const catName = catIds.length > 0 ? catIds.map((id: string) => categoryNames[id]) : [];


      const spIds = record.get('Suivi par') || [];
      const suiviPar = Array.isArray(spIds) && spIds.length > 0
        ? (suiviNames[spIds[0]] || spIds[0])
        : '';

      const recordIdFromInteractions = getInteractionRecordId(record);

      return {
        id: record.id,
        nomEtablissement: record.get("Nom de l'établissement"),
        categorie: catName,
        ville: record.get('Ville'),
        suiviPar,
        commentaires: record.get('Commentaires interactions'),
        datePriseContact: record.get('Date de prise de contact'),
        dateRelance: record.get('Date de relance'),
        telephone: record.get('Téléphone'),
        email: record.get('Email'),
        adresse: record.get('Adresse'),
        recordIdFromInteractions: recordIdFromInteractions,
      };
    });

    // Indice de pagination : s'il y a exactement offset+limit en mémoire, il y a probablement une page suivante
    const hasMore = upToPageRecords.length === offset + limit;

    res.status(200).json({
      discussions,
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