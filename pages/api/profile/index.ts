import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'COLLABORATEURS';

// helper: resolve or create a related record; returns record id or null
async function ensureRelatedRecord(tableName: string, candidateValue: any, candidateFields: string[]) {
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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await requireValidAccessToken(req, res);
    if (!userId) return;

    if (req.method === 'GET') {
      try {
        const rec = await base(TABLE_NAME).find(userId as string);
        return res.status(200).json({
          id: rec.id,
          nom: rec.get('Nom') || '',
          prenom: rec.get('Prénom') || '',
          emailPerso: rec.get('Email perso') || null,
          emailEpicu: rec.get('Email EPICU') || null,
          cp: rec.get('CP') || null,
          ville: rec.get('Ville') || null,
          categorie: rec.get('Catégorie') || null,
          siret: rec.get('Siret') || null,
          telephone: rec.get('Téléphone') || null,
          dateNaissance: rec.get('Date de naissance') || null,
          adresse: rec.get('Adresse') || null,
        });
      } catch (e) {
        return res.status(404).json({ error: 'Collaborateur introuvable' });
      }
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};

      // Only allow the authenticated user to update their own profile
      const idFromBody = (body.id as string | undefined) || (req.query.id as string | undefined);
      if (idFromBody && idFromBody !== (userId as string)) return res.status(403).json({ error: 'Forbidden: can only modify own profile' });

      const fields: any = {};
      if (body.nom !== undefined || body.Nom !== undefined) fields['Nom'] = body.nom ?? body.Nom;
      if (body.prenom !== undefined || body.Prénom !== undefined) fields['Prénom'] = body.prenom ?? body.Prénom;
      if (body.emailPerso !== undefined || body['Email perso'] !== undefined) fields['Email perso'] = body.emailPerso ?? body['Email perso'];
      if (body.emailEpicu !== undefined || body['Email EPICU'] !== undefined) fields['Email EPICU'] = body.emailEpicu ?? body['Email EPICU'];
      if (body.cp !== undefined || body.CP !== undefined) fields['CP'] = body.cp ?? body.CP;
      if (body.ville !== undefined || body.Ville !== undefined) fields['Ville'] = body.ville ?? body.Ville;
      if (body.categorie !== undefined || body['Catégorie'] !== undefined) fields['Catégorie'] = Array.isArray(body.categorie || body['Catégorie']) ? (body.categorie || body['Catégorie']).slice(0, 2) : [body.categorie || body['Catégorie']];
      if (body.siret !== undefined || body.Siret !== undefined) fields['Siret'] = body.siret ?? body.Siret;
      if (body.telephone !== undefined || body['Téléphone'] !== undefined) fields['Téléphone'] = body.telephone ?? body['Téléphone'];
      if (body.dateNaissance !== undefined || body['Date de naissance'] !== undefined) fields['Date de naissance'] = body.dateNaissance ?? body['Date de naissance'];
      if (body.adresse !== undefined || body['Adresse'] !== undefined) fields['Adresse'] = body.adresse ?? body['Adresse'];

      // Ville EPICU relation handling if provided via villeEpicu or similar
      try {
        const rawVille = body.villeEpicu ?? body.ville_epicu ?? body.villeEpicuId ?? body.villeEpicu_id ?? body.ville_epicu_id ?? body['Ville EPICU'];
        if (rawVille !== undefined) {
          if (rawVille === null) {
            fields['Ville EPICU'] = [];
          } else {
            const candidate = Array.isArray(rawVille) ? rawVille[0] : rawVille;
            const villeId = await ensureRelatedRecord('VILLES EPICU', candidate, ['Ville EPICU', 'Ville', 'Name']);
            if (villeId) fields['Ville EPICU'] = [villeId]; else fields['Ville EPICU'] = [];
          }
        }
      } catch (e) {
        console.warn('Erreur résolution ville (PROFILE PATCH)', e);
      }

      if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

      try {
        const updated = await base(TABLE_NAME).update([{ id: userId as string, fields }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('profile PATCH error', err);
        return res.status(500).json({ error: 'Erreur mise à jour profil', details: err?.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Airtable error (profile):', error?.message || error);
    return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
