import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const VIEW_NAME = '🟡 Contacté';
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
        'Commentaires interactions',
        'Date de relance',
        'Téléphone',
        'Email',
        'Adresse',
        'Record_ID (from INTERACTIONS)',
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
        const qFormula = `OR(FIND("${searchTerm}", LOWER({Nom de l'établissement})) > 0, FIND("${searchTerm}", LOWER({Ville})) > 0, FIND("${searchTerm}", LOWER({Commentaires interactions})) > 0)`;
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
      
      // Debug: vérifier les champs disponibles sur le premier enregistrement
      if (upToPageRecords.length > 0) {
        const firstRecord = upToPageRecords[0];
        console.log('🔍 Champs disponibles sur le premier enregistrement:');
        console.log('📋 Tous les champs:', Object.keys(firstRecord.fields || {}));
        console.log('🔗 Record_ID (from INTERACTIONS):', firstRecord.get('Record_ID (from INTERACTIONS)'));
        console.log('🔍 Type du Record_ID:', typeof firstRecord.get('Record_ID (from INTERACTIONS)'));
        console.log('💬 Commentaires interactions:', firstRecord.get('Commentaires interactions'));
        
        // Vérifier si le champ existe dans les champs récupérés
        const allFields = Object.keys(firstRecord.fields || {});
        const hasRecordIdField = allFields.includes('Record_ID (from INTERACTIONS)');
        console.log('🔍 Le champ Record_ID (from INTERACTIONS) est-il présent dans les champs récupérés?', hasRecordIdField);
        
        // Chercher des champs similaires
        const similarFields = allFields.filter(field => 
          field.toLowerCase().includes('record') || 
          field.toLowerCase().includes('interaction')
        );
        console.log('🔍 Champs similaires trouvés:', similarFields);
      }
      
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

        const recordIdFromInteractions = getInteractionRecordId(record);

        return {
          id: record.id,
          nomEtablissement: record.get("Nom de l'établissement"),
          categorie: catName,
          ville: record.get('Ville'),
          telephone: record.get('Téléphone'),
          suiviPar,
          datePriseContact: record.get('Date de prise de contact'),
          commentaires: record.get('Commentaires interactions'),
          dateRelance: record.get('Date de relance'),
          email: record.get('Email'),
          adresse: record.get('Adresse'),
          recordIdFromInteractions: recordIdFromInteractions,
        };
      });

      const hasMore = upToPageRecords.length === offset + limit;
      res.status(200).json({
        prospects,
        pagination: { limit, offset, orderBy, order, hasMore, nextOffset: hasMore ? offset + limit : null, prevOffset: Math.max(0, offset - limit) },
      });
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = req.body || {};
        const nom = body["Nom de l'établissement"];
        const ville = body['Ville'] || body.ville || null;
        const villeEpicu = body['Ville EPICU'] || null;
        const telephone = body['Téléphone'] || body.telephone || null;
        const categorieRaw = body['Catégorie'] || body.categorie || null;
        const datePrise = body['Date de prise de contact'] || body.datePriseContact || null;
        const dateRelance = body['Date de relance'] || body.dateRelance || null;
        const commentaires = body['Commentaires interactions'] || body.commentaires || null;
        const email = body['Email'] || body.email || null;
        const suiviRaw = body['Suivi par'] || body['suiviPar'] || body['SuiviPar'] || body.suivi || null;

        // Require establishment name only
        if (!nom) return res.status(400).json({ error: `Champs requis: Nom de l'établissement` });

        const fieldsToCreate: any = {};
        fieldsToCreate["Nom de l'établissement"] = nom;
        if (telephone) fieldsToCreate['Téléphone'] = telephone;
        if (email) fieldsToCreate['Email'] = email;
        if (datePrise && datePrise.trim()) fieldsToCreate['Date de prise de contact'] = datePrise;
        // Commentaires interactions est un champ calculé, on ne peut pas le modifier directement
        if (dateRelance && dateRelance.trim()) fieldsToCreate['Date de relance'] = dateRelance;
        if (ville) fieldsToCreate['Ville'] = ville;

        if (villeEpicu) {
          // Si c'est déjà un tableau d'IDs, l'utiliser directement
          if (Array.isArray(villeEpicu)) {
            fieldsToCreate['Ville EPICU'] = villeEpicu;
          } else {
            // Sinon, utiliser ensureRelatedRecord pour trouver l'ID par nom
            const villeId = await ensureRelatedRecord('VILLES EPICU', villeEpicu, ['Ville', 'Name']);
            if (villeId) fieldsToCreate['Ville EPICU'] = [villeId];
          }
        }

        const catIds = await resolveCategoryIds(categorieRaw);
        if (catIds.length > 0) fieldsToCreate['Catégorie'] = catIds;

        const suiviIds = await resolveCollaboratorIds(suiviRaw);
        if (suiviIds.length > 0) fieldsToCreate['Suivi par'] = suiviIds;

        const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);
        const createdId = created[0].id;

        // Fetch the created record and return it in the same shape as GET
        const record = await base(TABLE_NAME).find(createdId);

        // resolve category & suivi names
        const catIdsOnRecord = record.get('Catégorie') || [];
        const suiviIdsOnRecord = record.get('Suivi par') || [];

        const categoryNames: Record<string, string> = {};
        if (Array.isArray(catIdsOnRecord) && catIdsOnRecord.length > 0) {
          const catRecords = await base('Catégories').select({ filterByFormula: `OR(${catIdsOnRecord.map((id: string) => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Name'], maxRecords: catIdsOnRecord.length }).all();
          catRecords.forEach((c: any) => { categoryNames[c.id] = c.get('Name'); });
        }

        const suiviNames: Record<string, string> = {};
        if (Array.isArray(suiviIdsOnRecord) && suiviIdsOnRecord.length > 0) {
          const collabRecords = await base('Collaborateurs').select({ filterByFormula: `OR(${suiviIdsOnRecord.map((id: string) => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Prénom', 'Nom'], maxRecords: suiviIdsOnRecord.length }).all();
          collabRecords.forEach((c: any) => { suiviNames[c.id] = `${c.get('Prénom') || ''} ${c.get('Nom') || ''}`.trim(); });
        }

        const catName = Array.isArray(catIdsOnRecord) && catIdsOnRecord.length > 0
          ? catIdsOnRecord.map((id: string) => categoryNames[id])
          : [];
        const spName = Array.isArray(suiviIdsOnRecord) && suiviIdsOnRecord.length > 0
          ? (suiviNames[suiviIdsOnRecord[0]] || suiviIdsOnRecord[0])
          : '';

        const prospect = {
          id: record.id,
          nomEtablissement: record.get("Nom de l'établissement"),
          categorie: catName,
          ville: record.get('Ville'),
          telephone: record.get('Téléphone'),
          suiviPar: spName,
          datePriseContact: record.get('Date de prise de contact'),
          dateRelance: record.get('Date de relance'),
          commentaires: record.get('Commentaires interactions'),
          email: record.get('Email'),
          adresse: record.get('Adresse'),
          recordIdFromInteractions: record.get('Record_ID (from INTERACTIONS)'),
        };

        return res.status(201).json({ prospect });
      } catch (err: any) {
        console.error('prospects POST error', err);
        return res.status(500).json({ error: 'Erreur création prospect', details: err?.message || String(err) });
      }
    }

    if (req.method === 'PATCH') {
      try {
        const body = req.body || {};
        const id = (req.query.id as string) || body.id;
        if (!id) return res.status(400).json({ error: 'id requis' });

        // Fetch existing to determine current date fields
        const existing = await base(TABLE_NAME).find(id);
        const existingDatePrise = existing.get('Date de prise de contact') || null;
        const existingDateRelance = existing.get('Date de relance') || null;

        const fieldsToUpdate: any = {};
        if (Object.prototype.hasOwnProperty.call(body, "Nom de l'établissement")) fieldsToUpdate["Nom de l'établissement"] = body["Nom de l'établissement"];
        if (Object.prototype.hasOwnProperty.call(body, 'Téléphone')) fieldsToUpdate['Téléphone'] = body['Téléphone'];
        if (Object.prototype.hasOwnProperty.call(body, 'Date de prise de contact')) {
          const dateValue = body['Date de prise de contact'];
          fieldsToUpdate['Date de prise de contact'] = dateValue && dateValue.trim() ? dateValue : null;
        }
        // Commentaires interactions est un champ calculé, on ne peut pas le modifier directement
        if (Object.prototype.hasOwnProperty.call(body, 'Email')) fieldsToUpdate['Email'] = body['Email'];
        if (Object.prototype.hasOwnProperty.call(body, 'Date de relance')) {
          const dateValue = body['Date de relance'];
          fieldsToUpdate['Date de relance'] = dateValue && dateValue.trim() ? dateValue : null;
        }

        // Gérer le champ Ville (texte libre)
        if (Object.prototype.hasOwnProperty.call(body, 'Ville')) {
          fieldsToUpdate['Ville'] = body['Ville'];
        }

        // Gérer le champ Ville EPICU (relation vers VILLES EPICU)
        if (Object.prototype.hasOwnProperty.call(body, 'Ville EPICU')) {
          const villeEpicuRaw = body['Ville EPICU'];
          if (villeEpicuRaw) {
            // Si c'est déjà un tableau d'IDs, l'utiliser directement
            if (Array.isArray(villeEpicuRaw)) {
              fieldsToUpdate['Ville EPICU'] = villeEpicuRaw;
            } else {
              // Sinon, utiliser ensureRelatedRecord pour trouver l'ID par nom
              const villeId = await ensureRelatedRecord('VILLES EPICU', villeEpicuRaw, ['Ville', 'Name']);
              if (villeId) fieldsToUpdate['Ville EPICU'] = [villeId]; else fieldsToUpdate['Ville EPICU'] = [];
            }
          } else {
            fieldsToUpdate['Ville EPICU'] = [];
          }
        }

        if (Object.prototype.hasOwnProperty.call(body, 'Catégorie')) {
          const catRaw = body['Catégorie'];
          const catIds = await resolveCategoryIds(catRaw);
          if (catIds.length > 0) fieldsToUpdate['Catégorie'] = catIds; else fieldsToUpdate['Catégorie'] = [];
        }

        if (Object.prototype.hasOwnProperty.call(body, 'Suivi par') || Object.prototype.hasOwnProperty.call(body, 'suiviPar')) {
          const raw = body['Suivi par'] || body['suiviPar'];
          const suiviIds = await resolveCollaboratorIds(raw);
          if (suiviIds.length > 0) fieldsToUpdate['Suivi par'] = suiviIds; else fieldsToUpdate['Suivi par'] = [];
        }

        const resultingDatePrise = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'Date de prise de contact') ? fieldsToUpdate['Date de prise de contact'] : existingDatePrise;
        const resultingDateRelance = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'Date de relance') ? fieldsToUpdate['Date de relance'] : existingDateRelance;

        // La date de prise de contact est maintenant facultative

        if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

        const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        return res.status(500).json({ error: 'Erreur mise à jour prospect', details: err?.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error), statusCode: error?.statusCode, type: error?.error?.type });
  }
}