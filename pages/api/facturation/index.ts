import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE = 'FACTURES';

const findOrCreateEstablishment = async (val: any): Promise<string | null> => {
  if (!val) return null;
  if (Array.isArray(val) && val.length > 0) return val[0];
  if (typeof val === 'string' && /^rec[A-Za-z0-9]+/.test(val)) return val;

  const name = String(val).trim();
  if (!name) return null;

  try {
    const found = await base('ÉTABLISSEMENTS').select({ filterByFormula: `LOWER({Nom de l'établissement}) = "${name.toLowerCase().replace(/"/g, '\\"')}"`, maxRecords: 1 }).firstPage();
    if (found && found.length > 0) return found[0].id;
  } catch (e) {
    // ignore
  }

  try {
    const created = await base('ÉTABLISSEMENTS').create([{ fields: { "Nom de l'établissement": name } }]);
    return created[0].id;
  } catch (e) {
    console.error('Error creating establishment', e);
    return null;
  }
};

// Ensure required invoice fields exist on a record; returns fieldsToUpdate or null
const ensureInvoiceFields = async (recId: string, rec?: any) => {
  try {
    let record = rec;
    if (!record) {
      record = await base(TABLE).find(recId);
    }
    const fieldsToUpdate: any = {};
    // Date d'émission
    const dateEmission = record.get("Date d'échéance") || record.get("Date d'émission") || record.get('Date d\'émission');
    // prefer Date d'émission field exact name
    const dateField = record.get("Date d'émission") || record.get('Date d\'émission');
    if (!dateField) {
      // set to today ISO if missing
      fieldsToUpdate["Date d'émission"] = new Date().toISOString();
    }

    // Montant payé
    const montantPaye = record.get('Montant payé');
    if (montantPaye === undefined || montantPaye === null) {
      fieldsToUpdate['Montant payé'] = 0;
    }

    // PUBLICATIONS relation
    const publications = record.get('PUBLICATIONS');
    if (!publications) {
      fieldsToUpdate['PUBLICATIONS'] = [];
    }

    return Object.keys(fieldsToUpdate).length > 0 ? fieldsToUpdate : null;
  } catch (e) {
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Route by method
    if (req.method === 'GET') {
      const { status, q, limit = '20', offset = '0' } = req.query;
      const limitNum = Math.max(1, Math.min(200, parseInt(limit as string, 10)));
      const offsetNum = Math.max(0, parseInt(offset as string, 10));

      let endpoint = '';
      // Déterminer l'endpoint selon le statut
      switch (status) {
        case 'payee':
          endpoint = '/api/facturation/payee';
          break;
        case 'en_attente':
          endpoint = '/api/facturation/attente';
          break;
        case 'retard':
          endpoint = '/api/facturation/retard';
          break;
        default:
          endpoint = '/api/facturation/payee'; // Par défaut
      }

      // Construire l'URL avec les paramètres
      const url = new URL(endpoint, `http://${req.headers.host}`);
      if (q) url.searchParams.set('q', q as string);
      url.searchParams.set('limit', limitNum.toString());
      url.searchParams.set('offset', offsetNum.toString());

      // Appeler l'endpoint approprié
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Erreur lors de l'appel à ${endpoint}`);
      }

      const data = await response.json();

      // Calculer la pagination pour le lazy loading
      const hasMore = data.invoices && data.invoices.length === limitNum;
      const nextOffset = hasMore ? offsetNum + limitNum : null;

      return res.status(200).json({
        invoices: data.invoices || [],
        pagination: {
          hasMore,
          nextOffset,
          limit: limitNum,
          offset: offsetNum,
        },
      });
    }

    if (req.method === 'POST') {
      // Create invoice
      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      const body = req.body || {};
      const prestation = body['Prestation demandée'] || body.prestation || null;
      const clientRaw = body['Client'] || body.client || null;
      const dateEmission = body["Date d'émission"] || body.date || null;
      const statut = body['Statut facture'] || body.statut || null;
      const montantBrut = body['Montant total brut'] ?? body['Montant total net'] ?? body.montant ?? null;
      const commentaire = body['Commentaire'] || body.commentaire || null;

      const fieldsToCreate: any = {};
      // Ne pas envoyer le champ Prestation demandée pour éviter les erreurs de permissions
      // if (prestation) fieldsToCreate['Prestation demandée'] = prestation;

      if (clientRaw) {
        const cid = await findOrCreateEstablishment(clientRaw);
        if (cid) fieldsToCreate['Client'] = [cid];
      }

      if (dateEmission) fieldsToCreate["Date d'émission"] = dateEmission;
      if (statut) fieldsToCreate['Statut facture'] = statut;
      if (montantBrut != null) fieldsToCreate['Montant total brut'] = montantBrut;
      if (commentaire) fieldsToCreate['Commentaire'] = commentaire;

      const created = await base(TABLE).create([{ fields: fieldsToCreate }]);
      const rec = created[0];

      // Ensure required fields exist on created record
      try {
        const toUpdate = await ensureInvoiceFields(rec.id, rec);
        if (toUpdate) await base(TABLE).update([{ id: rec.id, fields: toUpdate }]);
      } catch (e) {
        // ignore
      }

      // resolve client name
      let nomEtablissement = null;
      const clientIds = rec.get('Client') || [];
      if (Array.isArray(clientIds) && clientIds.length > 0) {
        try {
          const crecs = await base('ÉTABLISSEMENTS').select({ filterByFormula: `RECORD_ID() = '${clientIds[0]}'`, fields: ["Nom de l'établissement", 'Raison sociale'], maxRecords: 1 }).all();
          if (crecs && crecs.length > 0) nomEtablissement = crecs[0].get("Nom de l'établissement") || crecs[0].get('Raison sociale') || null;
        } catch (e) {}
      }

      const invoice = {
        id: rec.id,
        categorie: null,
        nomEtablissement,
        date: rec.get("Date d'émission") || null,
        montant: rec.get('Montant total brut') ?? rec.get('Montant total net') ?? null,
        typePrestation: rec.get('Prestation demandée') || null,
        commentaire: rec.get('Commentaire') || null,
        statut: rec.get('Statut facture') || null,
      };

      return res.status(201).json({ invoice });
    }

    if (req.method === 'PATCH') {
      // Update invoice
      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      const body = req.body || {};
      const id = (req.query.id as string) || body.id;
      if (!id) return res.status(400).json({ error: 'id requis' });

      const fieldsToUpdate: any = {};
      // Ne pas envoyer le champ Prestation demandée pour éviter les erreurs de permissions
      // if (Object.prototype.hasOwnProperty.call(body, 'Prestation demandée') || Object.prototype.hasOwnProperty.call(body, 'prestation')) fieldsToUpdate['Prestation demandée'] = body['Prestation demandée'] || body.prestation;

      if (Object.prototype.hasOwnProperty.call(body, 'Client') || Object.prototype.hasOwnProperty.call(body, 'client')) {
        const clientRaw = body['Client'] || body.client;
        if (clientRaw) {
          const cid = await findOrCreateEstablishment(clientRaw);
          if (cid) fieldsToUpdate['Client'] = [cid]; else fieldsToUpdate['Client'] = [];
        } else {
          fieldsToUpdate['Client'] = [];
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, "Date d'émission") || Object.prototype.hasOwnProperty.call(body, 'date')) fieldsToUpdate["Date d'émission"] = body["Date d'émission"] || body.date;
      if (Object.prototype.hasOwnProperty.call(body, 'Statut facture') || Object.prototype.hasOwnProperty.call(body, 'statut')) fieldsToUpdate['Statut facture'] = body['Statut facture'] || body.statut;
      if (Object.prototype.hasOwnProperty.call(body, 'Montant total brut') || Object.prototype.hasOwnProperty.call(body, 'montant')) fieldsToUpdate['Montant total brut'] = body['Montant total brut'] ?? body['Montant total net'] ?? body.montant;
      if (Object.prototype.hasOwnProperty.call(body, 'Commentaire') || Object.prototype.hasOwnProperty.call(body, 'commentaire')) fieldsToUpdate['Commentaire'] = body['Commentaire'] || body.commentaire || null;

      if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

      const updated = await base(TABLE).update([{ id, fields: fieldsToUpdate }]);
      const rec = updated[0];

      // Ensure required fields exist on updated record
      try {
        const toUpdate = await ensureInvoiceFields(rec.id, rec);
        if (toUpdate) await base(TABLE).update([{ id: rec.id, fields: toUpdate }]);
      } catch (e) {
        // ignore
      }

      // resolve client name
      let nomEtablissement = null;
      const clientIds = rec.get('Client') || [];
      if (Array.isArray(clientIds) && clientIds.length > 0) {
        try {
          const crecs = await base('ÉTABLISSEMENTS').select({ filterByFormula: `RECORD_ID() = '${clientIds[0]}'`, fields: ["Nom de l'établissement", 'Raison sociale'], maxRecords: 1 }).all();
          if (crecs && crecs.length > 0) nomEtablissement = crecs[0].get("Nom de l'établissement") || crecs[0].get('Raison sociale') || null;
        } catch (e) {}
      }

      const invoice = {
        id: rec.id,
        categorie: null,
        nomEtablissement,
        date: rec.get("Date d'émission") || null,
        montant: rec.get('Montant total brut') ?? rec.get('Montant total net') ?? null,
        typePrestation: rec.get('Prestation demandée') || null,
        commentaire: rec.get('Commentaire') || null,
        statut: rec.get('Statut facture') || null,
      };

      return res.status(200).json({ invoice });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('facturation/index error:', error?.message || error);
    return res.status(500).json({ 
      error: 'Internal error', 
      details: error?.message || String(error) 
    });
  }
}
