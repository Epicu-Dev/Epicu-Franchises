import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'RESSOURCES';
const VIEW_NAME = 'Grid view';

function escAirtable(s: string) {
  return String(s || '').replace(/\"/g, '\\"');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const limitRaw = parseInt((req.query.limit as string) || '10', 10);
      const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
      const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 10 : limitRaw));
      const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

      const order = req.query.order === 'desc' ? 'desc' : 'asc';
      const orderByReq = (req.query.orderBy as string) || 'Date d\'ajout';
      const allowedOrderBy = new Set(['Objet', 'Onglet', 'Date d\'ajout']);
      const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : 'Date d\'ajout';

      const q = (req.query.q as string) || (req.query.search as string) || '';

      const fields = ['Objet', 'Onglet', 'Commentaires', 'Lien', 'Date d\'ajout'];

      const escapeForAirtableRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&').replace(/\"/g, '\\"').toLowerCase();

      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: limit,
        sort: [{ field: orderBy, direction: order }],
      };

      // Filtre onglet = "Ressources Canva"
      const formulaParts: string[] = [`{Onglet} = "Ressources Canva"`];

      if (q && q.trim().length > 0) {
        const pattern = escapeForAirtableRegex(q.trim());
        const qFormula = `OR(REGEX_MATCH(LOWER({Objet}), "${pattern}"), REGEX_MATCH(LOWER({Commentaires}), "${pattern}"), REGEX_MATCH(LOWER({Lien}), "${pattern}"))`;
        formulaParts.push(qFormula);
      }

      if (formulaParts.length > 0) selectOptions.filterByFormula = formulaParts.length === 1 ? formulaParts[0] : `AND(${formulaParts.join(',')})`;

      selectOptions.maxRecords = offset + limit;

      const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();
      const pageRecords = upToPageRecords.slice(offset, offset + limit);

      const results = pageRecords.map((r: any) => ({
        id: r.id,
        objet: r.get('Objet'),
        onglet: r.get('Onglet'),
        commentaires: r.get('Commentaires'),
        lien: r.get('Lien'),
        dateAjout: r.get("Date d\'ajout"),
      }));

      const hasMore = upToPageRecords.length === offset + limit;

      return res.status(200).json({ results, pagination: { limit, offset, orderBy, order, hasMore, nextOffset: hasMore ? offset + limit : null, prevOffset: Math.max(0, offset - limit) } });
    }

    if (req.method === 'POST') {
      try {
        // require auth for creation
        const userId = await requireValidAccessToken(req, res);
        if (!userId) return; // requireValidAccessToken already responded

        const body = req.body || {};
        const objet = body['Objet'] || body.objet;
        const commentaires = body['Commentaires'] || body.commentaires || null;
        const lien = body['Lien'] || body.lien || null;

        if (!objet) return res.status(400).json({ error: 'Objet requis' });

        const fieldsToCreate: any = {};
        fieldsToCreate['Objet'] = objet;
        // Forcer l'onglet sur Ressources Canva
        fieldsToCreate['Onglet'] = 'Ressources Canva';
        if (commentaires) fieldsToCreate['Commentaires'] = commentaires;
        if (lien) fieldsToCreate['Lien'] = lien;

        if (Object.prototype.hasOwnProperty.call(body, "Date d\'ajout")) {
          fieldsToCreate["Date d\'ajout"] = body["Date d\'ajout"];
        }

        const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);
        const createdId = created[0].id;
        const record = await base(TABLE_NAME).find(createdId);

        const result = {
          id: record.id,
          objet: record.get('Objet'),
          onglet: record.get('Onglet'),
          commentaires: record.get('Commentaires'),
          lien: record.get('Lien'),
          dateAjout: record.get("Date d\'ajout"),
        };

        return res.status(201).json({ resource: result });
      } catch (err: any) {
        console.error('canva POST error', err);
        return res.status(500).json({ error: 'Erreur création ressource', details: err?.message || String(err) });
      }
    }

    if (req.method === 'PATCH') {
      try {
        const body = req.body || {};
        const id = (req.query.id as string) || body.id;
        if (!id) return res.status(400).json({ error: 'id requis' });

        const fieldsToUpdate: any = {};
        if (Object.prototype.hasOwnProperty.call(body, 'Objet')) fieldsToUpdate['Objet'] = body['Objet'];
        if (Object.prototype.hasOwnProperty.call(body, 'Commentaires')) fieldsToUpdate['Commentaires'] = body['Commentaires'];
        if (Object.prototype.hasOwnProperty.call(body, 'Lien')) fieldsToUpdate['Lien'] = body['Lien'];

        // Toujours forcer l'onglet sur Ressources Canva
        fieldsToUpdate['Onglet'] = 'Ressources Canva';

        if (Object.prototype.hasOwnProperty.call(body, "Date d\'ajout")) fieldsToUpdate["Date d\'ajout"] = body["Date d\'ajout"];

        if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

        const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('canva PATCH error', err);
        return res.status(500).json({ error: 'Erreur mise à jour ressource', details: err?.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Airtable error (canva):', error?.message || error);
    return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
