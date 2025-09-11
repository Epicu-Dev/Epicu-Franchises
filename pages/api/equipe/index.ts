import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'COLLABORATEURS';
const VIEW_NAME = 'Utilisateurs par rôle';

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
    if (req.method === 'GET') {
      // Liste de tous les collaborateurs (aucune restriction par rôle)
      const limitRaw = parseInt((req.query.limit as string) || '10', 10);
      const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
      const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 10 : limitRaw));
      const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

      const order = req.query.order === 'desc' ? 'desc' : 'asc';
      const orderByReq = (req.query.orderBy as string) || 'Nom';
      const allowedOrderBy = new Set(['Nom', 'Prénom']);
      const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : 'Nom';

      const q = (req.query.q as string) || (req.query.search as string) || '';

      const escapeForAirtableRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

      const selectOptions: any = {
        view: VIEW_NAME,
        fields: ['Nom', 'Prénom', 'Ville EPICU', 'Email EPICU', 'Rôle', 'ÉTABLISSEMENTS', 'Trombi'],
        pageSize: limit,
        sort: [{ field: orderBy, direction: order }],
        maxRecords: offset + limit + 1,
      };

      if (q.trim().length > 0) {
        const pattern = escapeForAirtableRegex(q.trim());
        // search by nom OR prénom
        selectOptions.filterByFormula = `OR(REGEX_MATCH(LOWER({Nom}), "${pattern}"), REGEX_MATCH(LOWER({Prénom}), "${pattern}"))`;
      }

      // require auth to access équipe
      const callerUserId = await requireValidAccessToken(req, res);
      if (!callerUserId) return;

      // detect if caller is admin to include sensitive fields
      let isAdmin = false;
      try {
        const callerRec = await base(TABLE_NAME).find(callerUserId);
        const callerRole = String(callerRec.get('Rôle') || '').toLowerCase();
        isAdmin = callerRole === 'admin' || callerRole === 'administrateur';
      } catch (e) {
        console.warn('Impossible de récupérer le rôle de l\'utilisateur caller', e);
      }

      if (isAdmin) {
        selectOptions.fields.push('Email perso', 'Date de naissance', 'Téléphone', 'Adresse', 'Siret', 'Date DIP', 'Franchise signée le', "Attestation formation initiale");
      }

      const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

      const pageRecords = upToPageRecords.slice(offset, offset + limit);

      // Resolve Ville EPICU names for linked ids
      const allCityIds: string[] = Array.from(new Set(pageRecords.flatMap((r: any) => (r.get('Ville EPICU') as string[] | undefined) || [])));

      const cityNameById = new Map<string, string>();
      if (allCityIds.length > 0) {
        const formula = `OR(${allCityIds.map((id) => `RECORD_ID()=\"${String(id).replace(/"/g, '\\\"')}\"`).join(',')})`;
        const cityRecords = await base('VILLES EPICU').select({ fields: ['Ville EPICU'], filterByFormula: formula }).all();
        cityRecords.forEach((cr: any) => cityNameById.set(cr.id, cr.get('Ville EPICU')));
      }

      const results = pageRecords.map((r: any) => {
        const villesIds: string[] = (r.get('Ville EPICU') as string[] | undefined) || [];
        const villes = villesIds.map((id) => cityNameById.get(id)).filter((v): v is string => Boolean(v));
        const etablIds: string[] = (r.get('ÉTABLISSEMENTS') as string[] | undefined) || [];

        const baseObj: any = {
          id: r.id,
          nom: r.get('Nom') || '',
          prenom: r.get('Prénom') || '',
          villeEpicu: villes,
          emailEpicu: r.get('Email EPICU') || null,
          role: r.get('Rôle') || null,
          etablissements: etablIds,
          trombi: r.get('Trombi') || null,
        };

        if (isAdmin) {
          baseObj.emailPerso = r.get('Email perso') || null;
          baseObj.dateNaissance = r.get('Date de naissance') || null;
          baseObj.telephone = r.get('Téléphone') || null;
          baseObj.adresse = r.get('Adresse') || null;
          baseObj.siret = r.get('Siret') || null;
          baseObj.dateDIP = r.get('Date DIP') || null;
          baseObj.dateSignatureContrat = r.get('Franchise signée le') || null;
          baseObj.dateSignatureAttestation = r.get("Attestation formation initiale") || null;
        }

        return baseObj;
      });

      const hasMore = upToPageRecords.length > offset + limit;

      return res.status(200).json({ results, pagination: { limit, offset, orderBy, order, hasMore, nextOffset: hasMore ? offset + limit : null, prevOffset: Math.max(0, offset - limit) } });
    }

    if (req.method === 'POST') {
      // create collaborator
      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      // detect admin to allow performing POST
      let isAdmin = false;
      try {
        const callerRec = await base(TABLE_NAME).find(userId);
        const callerRole = String(callerRec.get('Rôle') || '').toLowerCase();
        isAdmin = callerRole === 'admin' || callerRole === 'administrateur';
      } catch (e) {
        console.warn('Impossible de récupérer le rôle de l\'utilisateur caller (POST équipe)', e);
      }

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: admin role required' });
      }

      const body = req.body || {};
      const fields: any = {};

      if (isAdmin) {
        if (body.nom !== undefined) fields['Nom'] = body.nom;
        if (body.prenom !== undefined) fields['Prénom'] = body.prenom;
        if (body.emailPerso !== undefined) fields['Email perso'] = body.emailPerso;
        if (body.emailEpicu !== undefined) fields['Email EPICU'] = body.emailEpicu;
        if (body.cp !== undefined) fields['CP'] = body.cp;
        if (body.ville !== undefined) fields['Ville'] = body.ville;
        if (body.categorie !== undefined) fields['Catégorie'] = Array.isArray(body.categorie) ? body.categorie.slice(0, 2) : [body.categorie];
        if (body.siret !== undefined || body.Siret !== undefined) fields['Siret'] = body.siret ?? body.Siret;
        if (body.telephone !== undefined || body['Téléphone'] !== undefined) fields['Téléphone'] = body.telephone ?? body['Téléphone'];
        if (body.dateNaissance !== undefined || body['Date de naissance'] !== undefined) fields['Date de naissance'] = body.dateNaissance ?? body['Date de naissance'];
        if (body.dateDIP !== undefined || body['Date DIP'] !== undefined) fields['Date DIP'] = body.dateDIP ?? body['Date DIP'];
        if (body.adresse !== undefined || body['Adresse'] !== undefined) fields['Adresse'] = body.adresse ?? body['Adresse'];
        if (body.attestationFormationInitiale !== undefined) fields['Attestation formation initiale'] = body.attestationFormationInitiale;
        if (body['Attestation formation initiale'] !== undefined) fields['Attestation formation initiale'] = body['Attestation formation initiale'];
      }

      // Ville EPICU relation
      try {
        const rawVille = body.villeEpicu ?? body.ville_epicu ?? body.villeEpicuId ?? body.villeEpicu_id ?? body.ville_epicu_id;
        if (rawVille !== undefined && rawVille !== null) {
          const candidate = Array.isArray(rawVille) ? rawVille[0] : rawVille;
          const villeId = await ensureRelatedRecord('VILLES EPICU', candidate, ['Ville EPICU', 'Ville', 'Name']);
          if (villeId) fields['Ville EPICU'] = [villeId]; else fields['Ville EPICU'] = [];
        }
      } catch (e) {
        console.warn('Erreur résolution ville (POST équipe)', e);
      }

      // ÉTABLISSEMENTS relation (optionnel)
      try {
        const rawEtab = body.etablissement ?? body.etablissements ?? body.Etablissements ?? body.etablissementId ?? body.etablissement_id;
        if (rawEtab !== undefined && rawEtab !== null) {
          const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
          const etabId = await ensureRelatedRecord('ÉTABLISSEMENTS', candidate, ["Nom de l'établissement", 'Name']);
          if (etabId) fields['ÉTABLISSEMENTS'] = [etabId]; else fields['ÉTABLISSEMENTS'] = [];
        }
      } catch (e) {
        console.warn('Erreur résolution établissements (POST équipe)', e);
      }

      // Minimal validation
      if (!fields['Nom'] && !fields['Prénom']) return res.status(400).json({ error: 'Nom ou Prénom requis' });

      try {
        const created = await base(TABLE_NAME).create([{ fields }]);
        return res.status(201).json({ id: created[0].id, fields: created[0].fields });
      } catch (err: any) {
        console.error('equipe POST error', err);
        return res.status(500).json({ error: 'Erreur création collaborateur', details: err?.message || String(err) });
      }
    }

    if (req.method === 'PATCH') {
      // update collaborator
      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      const body = req.body || {};
      const id = (req.query.id as string) || body.id;
      if (!id) return res.status(400).json({ error: 'id requis pour PATCH' });

      // check exists
      try {
        await base(TABLE_NAME).find(id);
      } catch (e) {
        return res.status(404).json({ error: 'Collaborateur introuvable' });
      }

      // Only admins can PATCH (same constraint as POST)
      let isAdmin = false;
      try {
        const callerRec = await base(TABLE_NAME).find((await requireValidAccessToken(req, res)) as string);
        const callerRole = String(callerRec.get('Rôle') || '').toLowerCase();
        isAdmin = callerRole === 'admin' || callerRole === 'administrateur';
      } catch (e) {
        console.warn('Impossible de récupérer le rôle de l\'utilisateur caller (PATCH équipe)', e);
      }

      if (!isAdmin) return res.status(403).json({ error: 'Forbidden: admin role required' });

      const fields: any = {};
      // writable by admins (and match POST fields)
      if (body.nom !== undefined || body.Nom !== undefined) fields['Nom'] = body.nom ?? body.Nom;
      if (body.prenom !== undefined || body.Prénom !== undefined) fields['Prénom'] = body.prenom ?? body.Prénom;
      if (body.emailPerso !== undefined || body.emailPerso !== undefined) fields['Email perso'] = body.emailPerso ?? body.emailPerso;
      if (body.emailEpicu !== undefined || body['Email EPICU'] !== undefined) fields['Email EPICU'] = body.emailEpicu ?? body['Email EPICU'];
      if (body.cp !== undefined || body.CP !== undefined) fields['CP'] = body.cp ?? body.CP;
      if (body.ville !== undefined || body.Ville !== undefined) fields['Ville'] = body.ville ?? body.Ville;
      if (body.categorie !== undefined || body['Catégorie'] !== undefined) fields['Catégorie'] = Array.isArray(body.categorie || body['Catégorie']) ? (body.categorie || body['Catégorie']).slice(0, 2) : [body.categorie || body['Catégorie']];

      // sensitive fields (admins only)
      if (body.siret !== undefined || body.Siret !== undefined) fields['Siret'] = body.siret ?? body.Siret;
      if (body.telephone !== undefined || body['Téléphone'] !== undefined) fields['Téléphone'] = body.telephone ?? body['Téléphone'];
      if (body.dateNaissance !== undefined || body['Date de naissance'] !== undefined) fields['Date de naissance'] = body.dateNaissance ?? body['Date de naissance'];
      if (body.dateDIP !== undefined || body['Date DIP'] !== undefined) fields['Date DIP'] = body.dateDIP ?? body['Date DIP'];
      if (body.adresse !== undefined || body['Adresse'] !== undefined) fields['Adresse'] = body.adresse ?? body['Adresse'];
      // Attestation formation initiale
      if (body.attestationFormationInitiale !== undefined) fields['Attestation formation initiale'] = body.attestationFormationInitiale;
      if (body['Attestation formation initiale'] !== undefined) fields['Attestation formation initiale'] = body['Attestation formation initiale'];
      if (body.dateSignatureAttestation !== undefined) fields['Attestation formation initiale'] = body.dateSignatureAttestation;

      // Ville EPICU relation
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
        console.warn('Erreur résolution ville (PATCH équipe)', e);
      }

      // ÉTABLISSEMENTS relation
      try {
        const rawEtab = body.etablissement ?? body.etablissements ?? body.Etablissements ?? body.etablissementId ?? body.etablissement_id ?? body['ÉTABLISSEMENTS'];
        if (rawEtab !== undefined) {
          if (rawEtab === null) {
            fields['ÉTABLISSEMENTS'] = [];
          } else {
            const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
            const etabId = await ensureRelatedRecord('ÉTABLISSEMENTS', candidate, ["Nom de l'établissement", 'Name']);
            if (etabId) fields['ÉTABLISSEMENTS'] = [etabId]; else fields['ÉTABLISSEMENTS'] = [];
          }
        }
      } catch (e) {
        console.warn('Erreur résolution établissements (PATCH équipe)', e);
      }

      if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

      try {
        const updated = await base(TABLE_NAME).update([{ id, fields }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('equipe PATCH error', err);
        return res.status(500).json({ error: 'Erreur mise à jour collaborateur', details: err?.message || String(err) });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Airtable error (equipe):', error?.message || error);
    return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
