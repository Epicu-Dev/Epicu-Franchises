import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'INTERACTIONS';

// helper to resolve établissement id
async function resolveEtablissement(candidate: any) {
  if (!candidate) return null;
  if (typeof candidate === 'string' && /^rec[A-Za-z0-9]+/.test(candidate)) return candidate;
  const val = String(candidate || '').trim();
  if (!val) return null;
  try {
    const found = await base('ÉTABLISSEMENTS').select({ filterByFormula: `LOWER({Nom de l\'établissement}) = "${val.toLowerCase().replace(/"/g, '\\"')}"`, maxRecords: 1 }).firstPage();
    if (found && found.length > 0) return found[0].id;
  } catch (e) {
    // ignore
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Récupérer les interactions pour un établissement donné
      const etablissementId = req.query.etablissement as string;

      if (!etablissementId) {
        return res.status(400).json({ error: 'ID établissement requis' });
      }

      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      try {


        // D'abord, récupérer toutes les interactions récentes pour debug

        const allInteractions = await base(TABLE_NAME)
          .select({
            fields: ['Date de l\'intéraction', 'Statut', 'Commentaire', 'Etablissement'],
            sort: [{ field: 'Date de l\'intéraction', direction: 'desc' }],
            maxRecords: 20
          })
          .all();



        // Maintenant filtrer pour l'établissement spécifique
        const interactions = allInteractions.filter((record: any) => {
          const etablissements = record.get('Etablissement') || [];
          const found = Array.isArray(etablissements) && etablissements.includes(etablissementId);

          return found;
        });


        const results = interactions.map((record: any) => ({
          id: record.id,
          dateInteraction: record.get('Date de l\'intéraction'),
          statut: record.get('Statut'),
          commentaire: record.get('Commentaire'),
          etablissement: record.get('Etablissement')
        }));

        return res.status(200).json({ interactions: results });
      } catch (err: any) {
        console.error('interaction GET error', err);
        return res.status(500).json({ error: 'Erreur récupération interactions', details: err?.message || String(err) });
      }
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      const fields: any = {};

      if (body.dateInteraction !== undefined) fields['Date de l\'intéraction'] = body.dateInteraction;
      if (body['Date de l\'intéraction'] !== undefined) fields['Date de l\'intéraction'] = body['Date de l\'intéraction'];

      // Etablissement relation
      const rawEtab = body.etablissement ?? body.etablissementId ?? body['Etablissement'] ?? body.etablissement_id;
      if (rawEtab !== undefined) {
        const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
        const etabId = await resolveEtablissement(candidate);
        if (etabId) fields['Etablissement'] = [etabId]; else fields['Etablissement'] = [];
      }

      if (body.statut !== undefined) fields['Statut'] = body.statut;
      if (body.commentaire !== undefined) fields['Commentaire'] = body.commentaire;

      if (Object.keys(fields).length === 0) return res.status(400).json({ error: "Aucun champ fourni pour création interaction" });

      try {
        const created = await base(TABLE_NAME).create([{ fields }]);
        return res.status(201).json({ id: created[0].id, fields: created[0].fields });
      } catch (err: any) {
        console.error('interaction POST error', err);
        return res.status(500).json({ error: 'Erreur création interaction', details: err?.message || String(err) });
      }
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const interactionId = req.query.id as string;

      if (!interactionId) {
        return res.status(400).json({ error: 'ID interaction requis' });
      }

      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      const fields: any = {};

      if (body.dateInteraction !== undefined) fields['Date de l\'intéraction'] = body.dateInteraction;
      if (body['Date de l\'intéraction'] !== undefined) fields['Date de l\'intéraction'] = body['Date de l\'intéraction'];

      // Etablissement relation
      const rawEtab = body.etablissement ?? body.etablissementId ?? body['Etablissement'] ?? body.etablissement_id;
      if (rawEtab !== undefined) {
        const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
        const etabId = await resolveEtablissement(candidate);
        if (etabId) fields['Etablissement'] = [etabId]; else fields['Etablissement'] = [];
      }

      if (body.statut !== undefined) fields['Statut'] = body.statut;
      if (body.commentaire !== undefined) fields['Commentaire'] = body.commentaire;

      if (Object.keys(fields).length === 0) return res.status(400).json({ error: "Aucun champ fourni pour mise à jour interaction" });

      try {
        const updated = await base(TABLE_NAME).update([{ id: interactionId, fields }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('interaction PATCH error', err);
        return res.status(500).json({ error: 'Erreur mise à jour interaction', details: err?.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Airtable error (interaction):', error?.message || error);
    return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
