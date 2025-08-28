import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const TABLE_NAME = 'AGENDA';
const VIEW_NAME = 'Grid view';

function parseDateParam(v?: string | string[] | undefined) {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;

  if (!s) return null;
  const d = new Date(s);

  return isNaN(d.getTime()) ? null : d;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const limitRaw = parseInt((req.query.limit as string) || '50', 10);
      const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
      const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw));
      const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

      const collaborator = (req.query.collaborator as string) || (req.query.user as string) || null;
      // dateStart: if not provided, default to first day of current month at 00:00
      const rawDateStart = req.query.dateStart as string | undefined;
      let dateStart = parseDateParam(rawDateStart);

      if (!dateStart) {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        firstOfMonth.setHours(0, 0, 0, 0);
        dateStart = firstOfMonth;
      }
      const dateEnd = parseDateParam(req.query.dateEnd as string | undefined);

      // Champs attendus (français) : utiliser les champs fournis
      const fields = [
        'Tâche',
        'Date',
        'Type',
        'Description',
        'Collaborateur',
      ];

      // Construire la formule de filtrage si besoin
      const filters: string[] = [];

      if (collaborator) {
        // filterByFormula to match collaborator reference
        // Airtable stored collaborator as a linked record id — using RECORD_ID() comparisons is not relevant here
        // We'll filter client-side after fetching upTo offset+limit records, but add a server-side filter if field contains plain text
        // No robust generic filter possible without knowing field type — keep server-side simple
      }

      // Récupérer au plus offset+limit records
      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: Math.min(100, offset + limit),
        maxRecords: offset + limit,
      };

      const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

      // Mapper records
      const mapped = upToPageRecords.map((r: any) => {
        // champs français
        const task = r.get('Tâche') || '';
        const date = r.get('Date') || '';
        const type = r.get('Type') || '';
        const description = r.get('Description') || '';
        const collaborators = r.get('Collaborateur') || [];

        return {
          id: r.id,
          task,
          date,
          type,
          description,
          collaborators,
        };
      });

      // filtrage par date/client côté serveur (après mapping)
      let filtered = mapped.filter((ev: any) => {
        if (dateStart) {
          const evDate = new Date(ev.date);

          evDate.setHours(0, 0, 0, 0);
          if (evDate < dateStart) return false;
        }
        if (dateEnd) {
          const evDate = new Date(ev.date);

          evDate.setHours(23, 59, 59, 999);
          if (evDate > dateEnd) return false;
        }
        if (collaborator) {
          // collaborator stored as linked record id array (Airtable) or string
          const coll = ev.collaborators || ev.Collaborateur || [];

          if (Array.isArray(coll) && coll.length > 0) {
            if (!coll.includes(collaborator)) return false;
          } else if (typeof coll === 'string' && coll.length > 0) {
            if (coll !== collaborator) return false;
          } else {
            return false;
          }
        }

        return true;
      });

      const page = filtered.slice(offset, offset + limit);

      res.status(200).json({ events: page, total: filtered.length });

      return;
    }

    if (req.method === 'POST') {
      const body = req.body;

      // Basic validation for required French fields
      if (!body || (!body['Tâche'] && !body.tache && !body.title && !body.name)) {
        return res.status(400).json({ error: 'Tâche requise' });
      }
      if (!body['Date'] && !body.date) {
        return res.status(400).json({ error: 'Date requise' });
      }

      const fieldsToCreate: any = {
        'Tâche': body['Tâche'] || body.tache || body.title || body.name || '',
        'Date': body['Date'] || body.date,
        'Type': body['Type'] || body.type || '',
        'Description': body['Description'] || body.description || body.desc || '',
      };

      // Collaborateur linkage: expect an array of record ids or single id
      const collPayload = body['Collaborateur'] || body.collaborator || body.collaborateurs || body.collaborators || body.user;

      if (collPayload) {
        if (Array.isArray(collPayload)) fieldsToCreate['Collaborateur'] = collPayload;
        else fieldsToCreate['Collaborateur'] = [collPayload];
      }

      const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);

      res.status(201).json({ id: created[0].id, ...fieldsToCreate });

      return;
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const id = (req.query.id as string) || body.id;

      if (!id) return res.status(400).json({ error: 'id requis' });

      const fieldsToUpdate: any = {};

      if (body['Tâche'] ?? body.tache ?? body.title ?? body.name) {
        fieldsToUpdate['Tâche'] = body['Tâche'] || body.tache || body.title || body.name;
      }
      if (body['Date'] ?? body.date) {
        fieldsToUpdate['Date'] = body['Date'] || body.date;
      }
      if (body['Type'] ?? body.type) {
        fieldsToUpdate['Type'] = body['Type'] || body.type;
      }
      if (body['Description'] ?? body.description ?? body.desc) {
        fieldsToUpdate['Description'] = body['Description'] || body.description || body.desc;
      }

      // Collaborateur linkage: accept array, single id, null (to clear)
      if (Object.prototype.hasOwnProperty.call(body, 'Collaborateur') || Object.prototype.hasOwnProperty.call(body, 'collaborator') || Object.prototype.hasOwnProperty.call(body, 'collaborateurs') || Object.prototype.hasOwnProperty.call(body, 'collaborators') || Object.prototype.hasOwnProperty.call(body, 'user')) {
        const collPayload = body['Collaborateur'] ?? body.collaborator ?? body.collaborateurs ?? body.collaborators ?? body.user;

        if (collPayload === null) {
          // clear links
          fieldsToUpdate['Collaborateur'] = [];
        } else if (Array.isArray(collPayload)) {
          fieldsToUpdate['Collaborateur'] = collPayload;
        } else if (collPayload) {
          fieldsToUpdate['Collaborateur'] = [collPayload];
        } else {
          // empty string or falsy -> clear
          fieldsToUpdate['Collaborateur'] = [];
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      }

      const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);

      res.status(200).json({ id: updated[0].id, fields: updated[0].fields });

      return;
    }

    if (req.method === 'DELETE') {
      const id = (req.query.id as string) || req.body.id;

      if (!id) return res.status(400).json({ error: 'id requis' });

      const deleted = await base(TABLE_NAME).destroy([id]);

      res.status(200).json({ id: deleted[0].id });

      return;
    }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('pages/api/agenda error:', error?.message || error);
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
}
