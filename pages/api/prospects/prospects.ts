import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const VIEW_NAME = '🟡 Prospects';
const TABLE_NAME = 'ÉTABLISSEMENTS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
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
      'Commentaires',
      'Date de relance',
    ];
    const allowedOrderBy = new Set([...fields]);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Nom de l'établissement";

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

    // Options de sélection communes
    const selectOptions: any = {
      view: VIEW_NAME,
      fields,
      pageSize: limit, // ne récupère que 'limit' par page côté API
      sort: [{ field: orderBy, direction: order }],
    };

    // Filtre plein-texte (regex insensitive en minuscule)
    // Optional filters: q + category + suivi
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
      selectOptions.filterByFormula = formulaParts.length === 1 ? formulaParts[0] : `AND(${formulaParts.join(',')})`;
    }

    // ⚡️ Optimisation : on ne récupère que 'offset + limit' en tout.
    selectOptions.maxRecords = offset + limit;

    // Récupérer (au plus) offset+limit, triés côté Airtable
    const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

    // Extraire uniquement la fenêtre demandée
    const pageRecords = upToPageRecords.slice(offset, offset + limit);

    // --- Résolution des relations pour Catégorie & Suivi par... uniquement sur la page courante
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

  const prospects = pageRecords.map((record: any) => {
      const catIds = record.get('Catégorie') || [];
      const catName = Array.isArray(catIds) && catIds.length > 0
        ? (categoryNames[catIds[0]] || catIds[0])
        : '';

      const spIds = record.get('Suivi par') || [];
      const suiviPar = Array.isArray(spIds) && spIds.length > 0
        ? (suiviNames[spIds[0]] || spIds[0])
        : '';

      return {
        id: record.id,
        nomEtablissement: record.get("Nom de l'établissement"),
        categorie: catName,
        ville: record.get('Ville'),
        suiviPar,
        commentaires: record.get('Commentaires'),
        dateRelance: record.get('Date de relance'),
      };
    });

    // Indice de pagination : si on a reçu exactement offset+limit, il y a probablement une page suivante
    const hasMore = upToPageRecords.length === offset + limit;

    res.status(200).json({
      prospects,
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
    // --- POST: create a prospect
    if (req.method === 'POST') {
      try {
        const body = req.body || {};

        // Respect exact field names
        const SIRET = body['SIRET'];

        // server-side validation: SIRET must be exactly 14 digits
        if (SIRET && typeof SIRET === 'string') {
          const siretClean = SIRET.replace(/\s+/g, '');

          if (!/^\d{14}$/.test(siretClean)) return res.status(400).json({ error: 'SIRET invalide — doit contenir exactement 14 chiffres' });
        }
        const nom = body["Nom de l'établissement"];
        const villeRaw = body['Ville EPICU'];
        const telephone = body['Téléphone'];
        const categorieRaw = body['Catégorie'];
        const statut = body['Statut'];
        const datePremier = body['Date du premier contact'];
        const dateRelance = body['Date de relance'];
        const jeRencontre = body['Je viens de le rencontrer (bool)'];
        const commentaires = body['Commentaires'];

        // Required validation
        const missing: string[] = [];

        if (!SIRET) missing.push('SIRET');
        if (!nom) missing.push("Nom de l'établissement");
        if (!villeRaw) missing.push('Ville EPICU');
        if (!telephone) missing.push('Téléphone');
        if (!categorieRaw) missing.push('Catégorie');
        if (!statut) missing.push('Statut');
        if (!datePremier) missing.push('Date du premier contact');
        if (!dateRelance) missing.push('Date de relance');

  if (missing.length > 0) return res.status(400).json({ error: 'Champs requis manquants', missing });

        const fieldsToCreate: any = {};

  fieldsToCreate['SIRET'] = String(SIRET).replace(/\s+/g, '');
        fieldsToCreate["Nom de l'établissement"] = nom;
        fieldsToCreate['Téléphone'] = telephone;
        fieldsToCreate['Statut'] = statut;
        fieldsToCreate['Date du premier contact'] = datePremier;
        fieldsToCreate['Date de relance'] = dateRelance;
        if (typeof jeRencontre !== 'undefined') fieldsToCreate['Je viens de le rencontrer (bool)'] = Boolean(jeRencontre);
        if (commentaires) fieldsToCreate['Commentaires'] = commentaires;

        // Resolve Ville EPICU relation (table 'VILLES EPICU')
        const ensureRelatedRecord = async (tableName: string, candidateValue: any, candidateFields: string[]) => {
          if (!candidateValue) return null;
          if (typeof candidateValue === 'string' && /^rec[A-Za-z0-9]+/.test(candidateValue)) return candidateValue;
          const val = String(candidateValue).trim();

          if (!val) return null;
          const formulaParts = candidateFields.map(f => `LOWER({${f}}) = "${val.toLowerCase().replace(/"/g, '\\"')}"`);

          try {
            const found = await base(tableName).select({ filterByFormula: `OR(${formulaParts.join(',')})`, maxRecords: 1 }).firstPage();

            if (found && found.length > 0) return found[0].id;
          } catch (e) {}
          try {
            const created = await base(tableName).create([{ fields: { [candidateFields[0] || 'Name']: val } }]);

            return created[0].id;
          } catch (e) { return null; }
        };

        const villeId = await ensureRelatedRecord('VILLES EPICU', villeRaw, ['Ville', 'Name']);

        if (villeId) fieldsToCreate['Ville'] = [villeId];

        const catId = await ensureRelatedRecord('Catégories', categorieRaw, ['Name']);

        if (catId) fieldsToCreate['Catégorie'] = [catId];

        const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);

        return res.status(201).json({ id: created[0].id, fields: created[0].fields });
      } catch (err: any) {
        console.error('prospects POST error', err);

        return res.status(500).json({ error: 'Erreur création prospect', details: err?.message || String(err) });
      }
    }

    // --- PATCH: update existing prospect
    if (req.method === 'PATCH') {
      try {
        const body = req.body || {};
        const id = (req.query.id as string) || body.id;

        if (!id) return res.status(400).json({ error: 'id requis' });

        const fieldsToUpdate: any = {};

        if (Object.prototype.hasOwnProperty.call(body, 'SIRET')) {
          const s = String(body['SIRET'] || '').replace(/\s+/g, '');

          if (!/^\d{14}$/.test(s)) return res.status(400).json({ error: 'SIRET invalide — doit contenir exactement 14 chiffres' });
          fieldsToUpdate['SIRET'] = s;
        }
        if (Object.prototype.hasOwnProperty.call(body, "Nom de l'établissement")) fieldsToUpdate["Nom de l'établissement"] = body["Nom de l'établissement"];
        if (Object.prototype.hasOwnProperty.call(body, 'Téléphone')) fieldsToUpdate['Téléphone'] = body['Téléphone'];
        if (Object.prototype.hasOwnProperty.call(body, 'Statut')) fieldsToUpdate['Statut'] = body['Statut'];
        if (Object.prototype.hasOwnProperty.call(body, 'Date du premier contact')) fieldsToUpdate['Date du premier contact'] = body['Date du premier contact'];
        if (Object.prototype.hasOwnProperty.call(body, 'Date de relance')) fieldsToUpdate['Date de relance'] = body['Date de relance'];
        if (Object.prototype.hasOwnProperty.call(body, 'Je viens de le rencontrer (bool)')) fieldsToUpdate['Je viens de le rencontrer (bool)'] = Boolean(body['Je viens de le rencontrer (bool)']);
        if (Object.prototype.hasOwnProperty.call(body, 'Commentaires')) fieldsToUpdate['Commentaires'] = body['Commentaires'];

        if (Object.prototype.hasOwnProperty.call(body, 'Ville EPICU')) {
          const villeRaw = body['Ville EPICU'];
          const ensureRelatedRecord = async (tableName: string, candidateValue: any, candidateFields: string[]) => {
            if (!candidateValue) return null;
            if (typeof candidateValue === 'string' && /^rec[A-Za-z0-9]+/.test(candidateValue)) return candidateValue;
            const val = String(candidateValue).trim();

            if (!val) return null;
            const formulaParts = candidateFields.map(f => `LOWER({${f}}) = "${val.toLowerCase().replace(/"/g, '\\"')}"`);

            try {
              const found = await base(tableName).select({ filterByFormula: `OR(${formulaParts.join(',')})`, maxRecords: 1 }).firstPage();

              if (found && found.length > 0) return found[0].id;
            } catch (e) {}
            try {
              const created = await base(tableName).create([{ fields: { [candidateFields[0] || 'Name']: val } }]);

              return created[0].id;
            } catch (e) { return null; }
          };
          const villeId = await ensureRelatedRecord('VILLES EPICU', villeRaw, ['Ville', 'Name']);

          if (villeId) fieldsToUpdate['Ville'] = [villeId]; else fieldsToUpdate['Ville'] = [];
        }

        if (Object.prototype.hasOwnProperty.call(body, 'Catégorie')) {
          const catRaw = body['Catégorie'];
          const ensureRelatedRecord = async (tableName: string, candidateValue: any, candidateFields: string[]) => {
            if (!candidateValue) return null;
            if (typeof candidateValue === 'string' && /^rec[A-Za-z0-9]+/.test(candidateValue)) return candidateValue;
            const val = String(candidateValue).trim();

            if (!val) return null;
            const formulaParts = candidateFields.map(f => `LOWER({${f}}) = "${val.toLowerCase().replace(/"/g, '\\"')}"`);

            try {
              const found = await base(tableName).select({ filterByFormula: `OR(${formulaParts.join(',')})`, maxRecords: 1 }).firstPage();

              if (found && found.length > 0) return found[0].id;
            } catch (e) {}
            try {
              const created = await base(tableName).create([{ fields: { [candidateFields[0] || 'Name']: val } }]);

              return created[0].id;
            } catch (e) { return null; }
          };
          const catId = await ensureRelatedRecord('Catégories', catRaw, ['Name']);

          if (catId) fieldsToUpdate['Catégorie'] = [catId]; else fieldsToUpdate['Catégorie'] = [];
        }

        if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

        const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);

        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('prospects PATCH error', err);

        return res.status(500).json({ error: 'Erreur mise à jour prospect', details: err?.message || String(err) });
      }
    }

    // If none matched
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);

    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erreur Airtable',
      details: error?.message || String(error),
      statusCode: error?.statusCode,
      type: error?.error?.type,
    });
  }
}