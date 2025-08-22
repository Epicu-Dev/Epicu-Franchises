import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE_NAME = 'TO DO';
const VIEW_NAME = 'Grid view';

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

      const fields = [
        'Nom de la tâche',
        'Date de création',
        "Date d'échéance",
        'Statut',
        'Type de tâche',
        'Description',
        'Collaborateur',
      ];

      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: Math.min(100, offset + limit),
        maxRecords: offset + limit,
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
        if (!collaborator) return true;
        const coll = it.collaborators || it['Collaborateur'] || [];
        if (Array.isArray(coll) && coll.length > 0) return coll.includes(collaborator);
        if (typeof coll === 'string' && coll.length > 0) return coll === collaborator;
        return false;
      });

      const page = filtered.slice(offset, offset + limit);
      res.status(200).json({ todos: page, total: filtered.length });
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

      if (duePayload) fieldsToCreate["Date d'échéance"] = duePayload;
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

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('pages/api/todo error:', error?.message || error);
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
}
