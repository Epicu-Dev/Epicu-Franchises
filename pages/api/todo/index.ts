import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE_NAME = 'TO DO';
const VIEW_NAME = 'Grid view';

function dateOnly(v?: any) {
  if (v == null) return v;
  if (typeof v !== 'string') return v;
  // handle ISO datetimes and 'YYYY-MM-DD hh:mm' etc. Keep only YYYY-MM-DD
  const t = v.split('T')[0];
  return t.split(' ')[0];
}

// util pour lire une clé avec ou sans apostrophe typographique
const getField = (obj: any, keys: string[]) =>
  keys.reduce<any>((acc, k) => (acc ?? obj?.[k]), undefined);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const limitRaw = parseInt((req.query.limit as string) || '50', 10);
      const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
      const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw));
      const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

      const collaborator =
        (req.query.collaborator as string) ||
        (req.query.user as string) ||
        null;

      const statusFilter = req.query.status as string || null;
      const searchQuery = req.query.q as string || null;
      
      // Paramètres de tri
      const order = req.query.order === 'desc' ? 'desc' : 'asc';
      const orderByReq = (req.query.orderBy as string) || "Date de création";

      const fields = [
        'Nom de la tâche',
        'Date de création',
        "Date d'échéance",
        'Statut',
        'Type de tâche',
        'Description',
        'Collaborateur',
      ];

      // Champs autorisés pour le tri (sécurité + cohérence)
      const allowedOrderBy = new Set([
        'Nom de la tâche',
        'Date de création',
        "Date d'échéance",
        'Statut',
        'Type de tâche'
      ]);
      const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Date de création";

      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: Math.min(100, offset + limit),
        maxRecords: offset + limit,
        sort: [{ field: orderBy, direction: order }],
      };

      const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

      const mapped = upToPageRecords.map((r: any) => {
        const name = r.get('Nom de la tâche') || '';
        const createdAt = r.get('Date de création') || '';
        // tolérance apostrophes côté lecture
        const dueDate =
          r.get("Date d'échéance") ??
          '';
        const status = r.get('Statut') || '';
        const type = r.get('Type de tâche') || '';
        const description = r.get('Description') || '';
        const collaborators = r.get('Collaborateur') || [];

        return {
          id: r.id,
          name,
          createdAt,   // fourni par Airtable (champ calculé)
          dueDate,
          status,
          type,
          description,
          collaborators,
        };
      });

      const filtered = mapped.filter((it: any) => {
        // Filtre par collaborateur
        if (collaborator) {
          const coll = it.collaborators || it['Collaborateur'] || [];
          if (Array.isArray(coll) && coll.length > 0) {
            if (!coll.includes(collaborator)) return false;
          } else if (typeof coll === 'string' && coll.length > 0) {
            if (coll !== collaborator) return false;
          } else {
            return false;
          }
        }

        // Filtre par statut
        if (statusFilter && it.status !== statusFilter) {
          return false;
        }

        // Filtre par recherche
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const nameMatch = it.name.toLowerCase().includes(searchLower);
          const descriptionMatch = it.description && it.description.toLowerCase().includes(searchLower);
          const typeMatch = it.type && it.type.toLowerCase().includes(searchLower);
          
          if (!nameMatch && !descriptionMatch && !typeMatch) {
            return false;
          }
        }

        return true;
      });

      const page = filtered.slice(offset, offset + limit);
      res.status(200).json({ 
        todos: page, 
        total: filtered.length,
        pagination: {
          limit,
          offset,
          orderBy,
          order,
          hasMore: filtered.length > offset + limit,
          nextOffset: filtered.length > offset + limit ? offset + limit : null,
          prevOffset: Math.max(0, offset - limit),
        }
      });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body;

      const name =
        getField(body, ['Nom de la tâche', 'nom', 'name', 'title', 'Tâche', 'tache']);
      // On garde la validation fonctionnelle, mais on **n’enverra pas** ce champ à Airtable.
      const createdAt =
        getField(body, ['Date de création', 'createdAt', 'created_at']);
      const status = getField(body, ['Statut', 'status']);
      const type =
        getField(body, ['Type de tâche', 'type', 'taskType', 'task_type']);

      if (!name) {
        return res.status(400).json({ error: 'Nom de la tâche requis' });
      }
      if (!createdAt) {
        // Facultatif techniquement pour Airtable, mais on suit ton contrat d’API
        return res.status(400).json({ error: 'Date de création requise' });
      }
      if (!status) {
        return res.status(400).json({ error: 'Statut requis' });
      }
      if (!type) {
        return res.status(400).json({ error: 'Type de tâche requis' });
      }

      // On N’ENVOIE PAS "Date de création" à Airtable (champ calculé)
      const fieldsToCreate: any = {
        'Nom de la tâche': name,
        'Statut': status,
        'Type de tâche': type,
      };

      // Optionnels
      const duePayload =
        getField(body, ["Date d'échéance"]);
      const descPayload =
        getField(body, ['Description', 'description', 'desc']);

  if (duePayload) fieldsToCreate["Date d'échéance"] = dateOnly(duePayload);
      if (descPayload) fieldsToCreate['Description'] = descPayload;

      // Collaborateur (id ou tableau d’ids)
      const collPayload =
        getField(body, ['Collaborateur', 'collaborator', 'collaborateurs', 'collaborators', 'user']);
      if (collPayload) {
        fieldsToCreate['Collaborateur'] = Array.isArray(collPayload)
          ? collPayload
          : [collPayload];
      }

      const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);

      // On renvoie createdAt depuis Airtable si besoin (relecture)
      res.status(201).json({ id: created[0].id, ...fieldsToCreate });
      return;
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const id = (req.query.id as string) || body.id;
      if (!id) return res.status(400).json({ error: 'id requis' });

      const fieldsToUpdate: any = {};
      const name = getField(body, ['Nom de la tâche', 'nom', 'name', 'title', 'Tâche', 'tache']);
      if (name) fieldsToUpdate['Nom de la tâche'] = name;

      const due = getField(body, ["Date d'échéance", 'dueDate', 'due_date']);
      if (typeof due !== 'undefined') {
        if (due === null || due === '') fieldsToUpdate["Date d'échéance"] = '';
        else fieldsToUpdate["Date d'échéance"] = dateOnly(due);
      }

      const status = getField(body, ['Statut', 'status']);
      if (typeof status !== 'undefined') fieldsToUpdate['Statut'] = status;

      const type = getField(body, ['Type de tâche', 'type', 'taskType']);
      if (typeof type !== 'undefined') fieldsToUpdate['Type de tâche'] = type;

      const desc = getField(body, ['Description', 'description', 'desc']);
      if (typeof desc !== 'undefined') fieldsToUpdate['Description'] = desc;

      const collPayload = getField(body, ['Collaborateur', 'collaborator', 'collaborateurs', 'collaborators', 'user']);
      if (Object.prototype.hasOwnProperty.call(body, 'Collaborateur') || Object.prototype.hasOwnProperty.call(body, 'collaborator') || Object.prototype.hasOwnProperty.call(body, 'collaborateurs') || Object.prototype.hasOwnProperty.call(body, 'collaborators') || Object.prototype.hasOwnProperty.call(body, 'user')) {
        if (collPayload === null) fieldsToUpdate['Collaborateur'] = [];
        else if (Array.isArray(collPayload)) fieldsToUpdate['Collaborateur'] = collPayload;
        else if (collPayload) fieldsToUpdate['Collaborateur'] = [collPayload];
        else fieldsToUpdate['Collaborateur'] = [];
      }

      if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

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
    console.error('pages/api/todo error:', error?.message || error);
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
}
