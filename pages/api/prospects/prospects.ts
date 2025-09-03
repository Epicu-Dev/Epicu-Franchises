import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const VIEW_NAME = '🟡 Prospects';
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
      const found = await base('Collaborateurs').select({
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

      const escapeForAirtableRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: limit,
        sort: [{ field: orderBy, direction: order }],
      };

      const categoryFilter = (req.query.category as string) || (req.query.categorie as string) || null;
      const suiviFilter = (req.query.suivi as string) || (req.query.suiviPar as string) || null;

      const formulaParts: string[] = [];
      if (q && q.trim().length > 0) {
        const pattern = escapeForAirtableRegex(q.trim());
        const qFormula = `OR(REGEX_MATCH(LOWER({Nom de l'établissement}), "${pattern}"),REGEX_MATCH(LOWER({Ville}), "${pattern}"),REGEX_MATCH(LOWER({Commentaires}), "${pattern}"))`;
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

      if (formulaParts.length > 0) selectOptions.filterByFormula = formulaParts.length === 1 ? formulaParts[0] : `AND(${formulaParts.join(',')})`;

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
        const catName = Array.isArray(catIds) && catIds.length > 0 ? (categoryNames[catIds[0]] || catIds[0]) : '';
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

    if (req.method === 'POST') {
      try {
        const body = req.body || {};
        const nom = body["Nom de l'établissement"];
        const villeRaw = body['Ville EPICU'] || body['Ville'] || body.ville;
        const telephone = body['Téléphone'] || body.telephone || null;
        const categorieRaw = body['Catégorie'] || body.categorie || null;
        const datePrise = body['Date de prise de contact'] || body.datePriseContact || null;
        const dateRelance = body['Date de relance'] || body.dateRelance || null;
        const commentaires = body['Commentaires'] || body.commentaires || null;
        const email = body['Email'] || body.email || null;
        const suiviRaw = body['Suivi par'] || body['suiviPar'] || body['SuiviPar'] || body.suivi || null;

        // Require establishment name and both date fields
        if (!nom) return res.status(400).json({ error: `Missing required field: Nom de l'établissement` });
        if (!datePrise) return res.status(400).json({ error: `Missing required field: Date de prise de contact` });
        if (!dateRelance) return res.status(400).json({ error: `Missing required field: Date de relance` });

        const fieldsToCreate: any = {};
        fieldsToCreate["Nom de l'établissement"] = nom;
        if (telephone) fieldsToCreate['Téléphone'] = telephone;
        if (email) fieldsToCreate['Email'] = email;
        if (datePrise) fieldsToCreate['Date de prise de contact'] = datePrise;
        if (commentaires) fieldsToCreate['Commentaires'] = commentaires;
        if (dateRelance) fieldsToCreate['Date de relance'] = dateRelance;

        if (villeRaw) {
          const villeId = await ensureRelatedRecord('VILLES EPICU', villeRaw, ['Ville', 'Name']);
          if (villeId) fieldsToCreate['Ville'] = [villeId];
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

        const catName = Array.isArray(catIdsOnRecord) && catIdsOnRecord.length > 0 ? (categoryNames[catIdsOnRecord[0]] || catIdsOnRecord[0]) : '';
        const spName = Array.isArray(suiviIdsOnRecord) && suiviIdsOnRecord.length > 0 ? (suiviNames[suiviIdsOnRecord[0]] || suiviIdsOnRecord[0]) : '';

        const prospect = {
          id: record.id,
          nomEtablissement: record.get("Nom de l'établissement"),
          categorie: catName,
          ville: record.get('Ville'),
          telephone: record.get('Téléphone'),
          suiviPar: spName,
          datePriseContact: record.get('Date de prise de contact'),
          dateRelance: record.get('Date de relance'),
          commentaires: record.get('Commentaires'),
          email: record.get('Email'),
          adresse: record.get('Adresse'),
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
        if (Object.prototype.hasOwnProperty.call(body, 'Date de prise de contact')) fieldsToUpdate['Date de prise de contact'] = body['Date de prise de contact'];
        if (Object.prototype.hasOwnProperty.call(body, 'Commentaires')) fieldsToUpdate['Commentaires'] = body['Commentaires'];
        if (Object.prototype.hasOwnProperty.call(body, 'Email')) fieldsToUpdate['Email'] = body['Email'];
        if (Object.prototype.hasOwnProperty.call(body, 'Date de relance')) fieldsToUpdate['Date de relance'] = body['Date de relance'];

        if (Object.prototype.hasOwnProperty.call(body, 'Ville EPICU')) {
          const villeRaw = body['Ville EPICU'];
          const villeId = await ensureRelatedRecord('VILLES EPICU', villeRaw, ['Ville', 'Name']);
          if (villeId) fieldsToUpdate['Ville'] = [villeId]; else fieldsToUpdate['Ville'] = [];
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

        if (!resultingDatePrise) return res.status(400).json({ error: `Missing required field after update: Date de prise de contact` });
        if (!resultingDateRelance) return res.status(400).json({ error: `Missing required field after update: Date de relance` });

        if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

        const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('prospects PATCH error', err);
        return res.status(500).json({ error: 'Erreur mise à jour prospect', details: err?.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error), statusCode: error?.statusCode, type: error?.error?.type });
  }
}