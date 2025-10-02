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
    // Date d'émission - laisser vide si non définie
    // Ne pas définir de valeur par défaut automatiquement

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
      const { status, q, limit = '20', offset = '0', sortField = 'establishmentName', sortDirection = 'asc' } = req.query;
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
      url.searchParams.set('sortField', sortField as string);
      url.searchParams.set('sortDirection', sortDirection as string);

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
      const prestation = body['Prestation'] || body.prestation || null;
      const clientRaw = body['Client'] || body.client || null;
      const dateEmission = body["Date d'émission"] || body.dateEmission || null;
      const datePaiement = body['Date de paiement'] || body.datePaiement || body.date || null;
      const statut = body['Statut facture'] || body.statut || null;
      const montantBrut = body['Montant total brut'] ?? body['Montant total net'] ?? body.montant ?? null;
      const commentaire = body['Commentaire'] || body.commentaire || null;
      const publicationId = body['publication_id'] || body.publicationId || null;

      const fieldsToCreate: any = {};
      if (prestation) fieldsToCreate['Prestation'] = prestation;

      if (clientRaw) {
        const cid = await findOrCreateEstablishment(clientRaw);
        if (cid) fieldsToCreate['Client'] = [cid];
      }

      if (dateEmission && dateEmission.trim() !== '') fieldsToCreate["Date d'émission"] = dateEmission;
      if (datePaiement && datePaiement.trim() !== '') fieldsToCreate['Date de paiement'] = datePaiement;
      if (statut) fieldsToCreate['Statut facture'] = statut;
      if (montantBrut != null) fieldsToCreate['Montant total brut'] = montantBrut;
      if (commentaire) fieldsToCreate['Commentaire'] = commentaire;
      if (publicationId) fieldsToCreate['HISTORIQUE DE PUBLICATIONS'] = [publicationId];

      const created = await base(TABLE).create([{ fields: fieldsToCreate }]);
      const rec = created[0];

      // Ensure required fields exist on created record
      try {
        const toUpdate = await ensureInvoiceFields(rec.id, rec);
        if (toUpdate) await base(TABLE).update([{ id: rec.id, fields: toUpdate }]);
      } catch (e) {
        // ignore
      }

      // resolve client name and category
      let nomEtablissement = null;
      let categorie = null;
      const clientIds = rec.get('Client') || [];
      if (Array.isArray(clientIds) && clientIds.length > 0) {
        try {
          const crecs = await base('ÉTABLISSEMENTS').select({ 
            filterByFormula: `RECORD_ID() = '${clientIds[0]}'`, 
            fields: ["Nom de l'établissement", 'Raison sociale', 'Catégorie'], 
            maxRecords: 1 
          }).all();
          if (crecs && crecs.length > 0) {
            const clientRecord = crecs[0];
            nomEtablissement = clientRecord.get("Nom de l'établissement") || clientRecord.get('Raison sociale') || null;
            
            // Récupérer la catégorie de l'établissement
            const categoryIds = clientRecord.get('Catégorie') || [];
            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
              try {
                const catRecords = await base('Catégories')
                  .select({
                    filterByFormula: `RECORD_ID() = '${categoryIds[0]}'`,
                    fields: ['Name'],
                    maxRecords: 1,
                  })
                  .all();
                if (catRecords && catRecords.length > 0) {
                  categorie = catRecords[0].get('Name') || null;
                }
              } catch (e) {
                // Ignorer les erreurs de récupération de catégorie
              }
            }
          }
        } catch (e) { }
      }

      const invoice = {
        id: rec.id,
        categorie,
        nomEtablissement,
        datePaiement: rec.get('Date de paiement') || null,
        dateEmission: rec.get("Date d'émission") || null,
        montant: rec.get('Montant total brut') ?? rec.get('Montant total net') ?? null,
        typePrestation: rec.get('Prestation') || null,
        commentaire: rec.get('Commentaire') || null,
        statut: rec.get('Statut facture') || null,
        publicationId: (rec.get('HISTORIQUE DE PUBLICATIONS') as string[])?.[0] || null,
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
      if (Object.prototype.hasOwnProperty.call(body, 'Prestation') || Object.prototype.hasOwnProperty.call(body, 'prestation')) fieldsToUpdate['Prestation'] = body['Prestation'] || body.prestation;

      if (Object.prototype.hasOwnProperty.call(body, 'Client') || Object.prototype.hasOwnProperty.call(body, 'client')) {
        const clientRaw = body['Client'] || body.client;
        if (clientRaw) {
          const cid = await findOrCreateEstablishment(clientRaw);
          if (cid) fieldsToUpdate['Client'] = [cid]; else fieldsToUpdate['Client'] = [];
        } else {
          fieldsToUpdate['Client'] = [];
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, "Date d'émission") || Object.prototype.hasOwnProperty.call(body, 'dateEmission')) {
        const emissionValue = body["Date d'émission"] || body.dateEmission;
        fieldsToUpdate["Date d'émission"] = emissionValue && emissionValue.trim() !== '' ? emissionValue : null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'Date de paiement') || Object.prototype.hasOwnProperty.call(body, 'datePaiement') || Object.prototype.hasOwnProperty.call(body, 'date')) {
        const paiementValue = body['Date de paiement'] || body.datePaiement || body.date;
        fieldsToUpdate['Date de paiement'] = paiementValue && paiementValue.trim() !== '' ? paiementValue : null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'Statut facture') || Object.prototype.hasOwnProperty.call(body, 'statut')) fieldsToUpdate['Statut facture'] = body['Statut facture'] || body.statut;
      if (Object.prototype.hasOwnProperty.call(body, 'Montant total brut') || Object.prototype.hasOwnProperty.call(body, 'montant')) fieldsToUpdate['Montant total brut'] = body['Montant total brut'] ?? body['Montant total net'] ?? body.montant;
      if (Object.prototype.hasOwnProperty.call(body, 'Commentaire') || Object.prototype.hasOwnProperty.call(body, 'commentaire')) fieldsToUpdate['Commentaire'] = body['Commentaire'] || body.commentaire || null;
      if (Object.prototype.hasOwnProperty.call(body, 'publication_id') || Object.prototype.hasOwnProperty.call(body, 'publicationId')) {
        const pubId = body['publication_id'] || body.publicationId;
        fieldsToUpdate['HISTORIQUE DE PUBLICATIONS'] = pubId ? [pubId] : [];
      }

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

      // resolve client name and category
      let nomEtablissement = null;
      let categorie = null;
      const clientIds = rec.get('Client') || [];
      if (Array.isArray(clientIds) && clientIds.length > 0) {
        try {
          const crecs = await base('ÉTABLISSEMENTS').select({ 
            filterByFormula: `RECORD_ID() = '${clientIds[0]}'`, 
            fields: ["Nom de l'établissement", 'Raison sociale', 'Catégorie'], 
            maxRecords: 1 
          }).all();
          if (crecs && crecs.length > 0) {
            const clientRecord = crecs[0];
            nomEtablissement = clientRecord.get("Nom de l'établissement") || clientRecord.get('Raison sociale') || null;
            
            // Récupérer la catégorie de l'établissement
            const categoryIds = clientRecord.get('Catégorie') || [];
            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
              try {
                const catRecords = await base('Catégories')
                  .select({
                    filterByFormula: `RECORD_ID() = '${categoryIds[0]}'`,
                    fields: ['Name'],
                    maxRecords: 1,
                  })
                  .all();
                if (catRecords && catRecords.length > 0) {
                  categorie = catRecords[0].get('Name') || null;
                }
              } catch (e) {
                // Ignorer les erreurs de récupération de catégorie
              }
            }
          }
        } catch (e) { }
      }

      const invoice = {
        id: rec.id,
        categorie,
        nomEtablissement,
        datePaiement: rec.get('Date de paiement') || null,
        dateEmission: rec.get("Date d'émission") || null,
        montant: rec.get('Montant total brut') ?? rec.get('Montant total net') ?? null,
        typePrestation: rec.get('Prestation') || null,
        commentaire: rec.get('Commentaire') || null,
        statut: rec.get('Statut facture') || null,
        publicationId: (rec.get('HISTORIQUE DE PUBLICATIONS') as string[])?.[0] || null,
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
