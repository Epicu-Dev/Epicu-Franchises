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
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const body = req.body || {};

    const userId = await requireValidAccessToken(req, res);
    if (!userId) return;

    const fields: any = {};

    if (body.dateInteraction !== undefined) fields['Date de l\'interaction'] = body.dateInteraction;
    if (body['Date de l\'interaction'] !== undefined) fields['Date de l\'interaction'] = body['Date de l\'interaction'];

    // Etablissement relation
    const rawEtab = body.etablissement ?? body.etablissementId ?? body['ÉTABLISSEMENTS'] ?? body.etablissement_id;
    if (rawEtab !== undefined) {
      const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
      const etabId = await resolveEtablissement(candidate);
      if (etabId) fields['ÉTABLISSEMENTS'] = [etabId]; else fields['ÉTABLISSEMENTS'] = [];
    }

    if (body.statut !== undefined) fields['Statut'] = body.statut;
    if (body.commentaire !== undefined) fields['Commentaire'] = body.commentaire;
    if (body.prochainRdv !== undefined) fields['Prochain rdv'] = body.prochainRdv;
    if (body['Prochain rdv'] !== undefined) fields['Prochain rdv'] = body['Prochain rdv'];

    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Aucun champ fourni pour création interaction' });

    try {
      const created = await base(TABLE_NAME).create([{ fields }]);
      return res.status(201).json({ id: created[0].id, fields: created[0].fields });
    } catch (err: any) {
      console.error('interaction POST error', err);
      return res.status(500).json({ error: 'Erreur création interaction', details: err?.message || String(err) });
    }
  } catch (error: any) {
    console.error('Airtable error (interaction):', error?.message || error);
    return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
