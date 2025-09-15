import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const VIEW_NAME = '🔴 Perdu';
const TABLE_NAME = 'ÉTABLISSEMENTS';

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

    const fields = [
      "Nom de l'établissement",
      'Catégorie',
      'Ville',
      'Suivi par',
      'Commentaires',
      'Date de relance',
      'Téléphone',
      'Email',
      'Adresse',
    ];
    const allowedOrderBy = new Set([...fields]);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Nom de l'établissement";

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

    const selectOptions: any = {
      view: VIEW_NAME,
      fields,
      pageSize: limit,
      sort: [{ field: orderBy, direction: order }],
    };

    // Auth: si l'utilisateur est admin -> voir tous les prospects perdus
    // sinon -> ne voir que les prospects perdus qui partagent au moins une Ville EPICU avec lui
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
            prospects: [],
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
              prospects: [],
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
      }
    } catch (e) {
      console.error('Erreur récupération utilisateur:', e);
      return res.status(500).json({ error: 'Impossible de récupérer les informations de l\'utilisateur' });
    }

    const categoryFilter = (req.query.category as string) || (req.query.categorie as string) || null;
    const suiviFilter = (req.query.suivi as string) || (req.query.suiviPar as string) || null;

    const formulaParts: string[] = [];

    if (q && q.trim().length > 0) {
      const pattern = escapeForAirtableRegex(q.trim());
      const qFormula =
        `OR(` +
        `REGEX_MATCH(LOWER({Nom de l'établissement}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Ville}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Commentaires}), "${pattern}")` +
        `)`;

      formulaParts.push(qFormula);
    }

    if (categoryFilter) {
      try {
        let catName = String(categoryFilter);
        if (/^rec/i.test(categoryFilter)) {
          const rec = await base('Catégories').find(categoryFilter);
          catName = String(rec.get('Name') || rec.get('Nom') || rec.get('Titre') || catName);
        }
        const catEsc = catName.replace(/'/g, "\\'");
        formulaParts.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      } catch (e) {
        const catEsc = String(categoryFilter).replace(/'/g, "\\'");
        formulaParts.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      }
    }

    if (suiviFilter) {
      try {
        let suiviName = String(suiviFilter);
        if (/^rec/i.test(suiviFilter)) {
          const rec = await base('Collaborateurs').find(suiviFilter);
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

    selectOptions.maxRecords = offset + limit;
    const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();
    const pageRecords = upToPageRecords.slice(offset, offset + limit);

    const categoryIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Catégorie') || [])));
    const suiviIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Suivi par') || [])));

    const categoryNames: Record<string, string> = {};
    if (categoryIds.length > 0) {
      const catRecords = await base('Catégories').select({ filterByFormula: `OR(${categoryIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Name'], pageSize: Math.min(categoryIds.length, 100), maxRecords: categoryIds.length }).all();
      catRecords.forEach((cat: any) => { categoryNames[cat.id] = cat.get('Name'); });
    }

    const suiviNames: Record<string, string> = {};
    if (suiviIds.length > 0) {
      const collabRecords = await base('Collaborateurs').select({ filterByFormula: `OR(${suiviIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Prénom', 'Nom'], pageSize: Math.min(suiviIds.length, 100), maxRecords: suiviIds.length }).all();
      collabRecords.forEach((c: any) => { suiviNames[c.id] = `${c.get('Prénom') || ''} ${c.get('Nom') || ''}`.trim(); });
    }

    const prospects = pageRecords.map((record: any) => {
      const catIds = record.get('Catégorie') || [];
      const catName = catIds.length > 0 ? catIds.map((id: string) => categoryNames[id]) : [];
      const spIds = record.get('Suivi par') || [];
      const suiviPar = Array.isArray(spIds) && spIds.length > 0 ? (suiviNames[spIds[0]] || spIds[0]) : '';

      return {
        id: record.id,
        nomEtablissement: record.get("Nom de l'établissement"),
        categorie: catName,
        ville: record.get('Ville'),
        suiviPar,
        commentaires: record.get('Commentaires'),
        datePriseContact: record.get('Date de prise de contact'),
        dateRelance: record.get('Date de relance'),
        telephone: record.get('Téléphone'),
        email: record.get('Email'),
        adresse: record.get('Adresse'),
      };
    });

    const hasMore = upToPageRecords.length === offset + limit;
    res.status(200).json({ prospects, pagination: { limit, offset, orderBy, order, hasMore, nextOffset: hasMore ? offset + limit : null, prevOffset: Math.max(0, offset - limit) } });
    return;
  } catch (error: any) {
    console.error('Airtable error:', { statusCode: error?.statusCode, type: error?.error?.type, message: error?.message });
    res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error), statusCode: error?.statusCode, type: error?.error?.type });
  }
}