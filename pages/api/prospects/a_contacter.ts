import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const VIEW_NAME = '🟡 À contacter';
const TABLE_NAME = 'ÉTABLISSEMENTS';

// Helpers
const ensureRelatedRecord = async (tableName: string, candidateValue: any, candidateFields: string[]) => {
  if (!candidateValue) return null;
  if (typeof candidateValue === 'string' && /^rec[A-Za-z0-9]+/.test(candidateValue)) return candidateValue;
  const val = String(candidateValue || '').trim();
  if (!val) return null;

  const formulaParts = candidateFields.map((f) => `LOWER({${f}}) = "${val.toLowerCase().replace(/"/g, '\\"')}"`);

  try {
    const found = await base(tableName).select({ filterByFormula: `OR(${formulaParts.join(',')})`, maxRecords: 1 }).firstPage();
    if (found && found.length > 0) return found[0].id;
  } catch (e) {
    // ignore
  }

  try {
    const created = await base(tableName).create([{ fields: { [candidateFields[0] || 'Name']: val } }]);
    return created[0].id;
  } catch (e) {
    return null;
  }
};

const resolveCategoryIds = async (raw: any) => {
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  const ids: string[] = [];
  for (const v of values.slice(0, 2)) {
    const id = await ensureRelatedRecord('Catégories', v, ['Name']);
    if (id) ids.push(id);
  }
  return ids;
};

const resolveCollaboratorIds = async (raw: any) => {
  if (!raw) return [];
  const vals = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const v of vals) {
    if (!v) continue;
    if (typeof v === 'string' && /^rec[A-Za-z0-9]+/.test(v)) {
      out.push(v);
      continue;
    }
    const name = String(v).trim();
    if (!name) continue;
    try {
      const found = await base('COLLABORATEURS').select({
        filterByFormula: `OR(LOWER({Nom complet}) = "${name.toLowerCase().replace(/"/g, '\\"')}", LOWER(CONCATENATE({Prénom}, ' ', {Nom})) = "${name.toLowerCase().replace(/"/g, '\\"')}" )`,
        maxRecords: 1,
      }).firstPage();
      if (found && found.length > 0) out.push(found[0].id);
    } catch (e) {
      // ignore
    }
  }
  return out;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Vérification de l'authentification
      const userId = await requireValidAccessToken(req, res);
      if (!userId) return; // requireValidAccessToken a déjà répondu

      const limitRaw = parseInt((req.query.limit as string) || '10', 10);
      const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
      const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 10 : limitRaw));
      const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

      const order = req.query.order === 'desc' ? 'desc' : 'asc';
      const orderByReq = (req.query.orderBy as string) || "Nom de l'établissement";
      const q = (req.query.q as string) || (req.query.search as string) || '';

      const fields = [
        "Nom de l'établissement",
        'Catégorie',
        'Ville',
        'Suivi par',
        'Date de prise de contact',
        'Commentaires',
        'Date de relance',
        'Téléphone',
        'Email',
        'Adresse',
      ];

      const allowedOrderBy = new Set(fields);
      const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Nom de l'établissement";

      const escapeForAirtable = (s: string) => s.replace(/'/g, "\\'").replace(/"/g, '\\"');

      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: limit,
        sort: [{ field: orderBy, direction: order }],
      };

      // Auth: si l'utilisateur est admin -> voir tous les prospects
      // sinon -> ne voir que les prospects qui partagent au moins une Ville EPICU avec lui
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

          // Résoudre les IDs en noms via la table VILLES EPICU
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
            return res.status(500).json({ error: 'Impossible de récupérer les villes Epicu de l\'utilisateur' });
          }
        }
      } catch (e) {
        return res.status(500).json({ error: 'Impossible de récupérer les informations de l\'utilisateur' });
      }

      const categoryFilter = (req.query.category as string) || (req.query.categorie as string) || null;
      const suiviFilter = (req.query.suivi as string) || (req.query.suiviPar as string) || null;

      const formulaParts: string[] = [];
      if (q && q.trim().length > 0) {
        const searchTerm = escapeForAirtable(q.trim().toLowerCase());
        const qFormula = `OR(FIND("${searchTerm}", LOWER({Nom de l'établissement})) > 0, FIND("${searchTerm}", LOWER({Ville})) > 0, FIND("${searchTerm}", LOWER({Commentaires})) > 0)`;
        formulaParts.push(qFormula);
      }

      if (categoryFilter) {
        try {
          let catName = String(categoryFilter);
          if (/^rec/i.test(categoryFilter)) {
            const rec = await base('Catégories').find(categoryFilter);
            catName = String(rec.get('Name') || rec.get('Nom') || rec.get('Titre') || catName);
          }
          const catEsc = String(catName).replace(/'/g, "\\'");
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
          const suEsc = String(suiviName).replace(/'/g, "\\'");
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

      // resolve related names on page
      const categoryIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Catégorie') || [])));
      const suiviIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Suivi par') || [])));

      const categoryNames: Record<string, string> = {};
      if (categoryIds.length > 0) {
        const catRecords = await base('Catégories').select({ filterByFormula: `OR(${categoryIds.map((id) => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Name'], maxRecords: categoryIds.length }).all();
        catRecords.forEach((c: any) => { categoryNames[c.id] = c.get('Name'); });
      }

      const suiviNames: Record<string, string> = {};
      if (suiviIds.length > 0) {
        const collabRecords = await base('Collaborateurs').select({ filterByFormula: `OR(${suiviIds.map((id) => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Prénom', 'Nom'], maxRecords: suiviIds.length }).all();
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
          telephone: record.get('Téléphone'),
          suiviPar,
          datePriseContact: record.get('Date de prise de contact'),
          commentaires: record.get('Commentaires'),
          dateRelance: record.get('Date de relance'),
          email: record.get('Email'),
          adresse: record.get('Adresse'),
        };
      });

      const hasMore = upToPageRecords.length === offset + limit;
      res.status(200).json({
        prospects,
        pagination: { limit, offset, orderBy, order, hasMore, nextOffset: hasMore ? offset + limit : null, prevOffset: Math.max(0, offset - limit) },
      });
      return;
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error), statusCode: error?.statusCode, type: error?.error?.type });
  }
}
