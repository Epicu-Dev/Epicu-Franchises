import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE = 'FACTURES';
const CATEGORIES_TABLE = 'CATÉGORIES';

// Convertit n'importe quelle valeur Airtable (string / objet {name} / tableau) en texte
const toText = (v: any): string => {
  if (v == null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(toText).join(' ');
  if (typeof v === 'object') return toText((v as any).name ?? JSON.stringify(v));
  return String(v);
};

// Normalise (enlève accents, minuscule) pour comparaisons souples
const normalize = (s: any): string =>
  toText(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const q = (req.query.q as string) || '';
    const limit = Math.max(1, Math.min(200, parseInt((req.query.limit as string) || '20', 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

    const selectOptions: any = {
      view: 'Toutes les factures',
      maxRecords: limit,
      fields: [
        'Catégorie',              // IDs vers CATÉGORIES
        'Client',                 // IDs vers ÉTABLISSEMENTS
        "Date d'émission",
        'Montant total net',
        'Prestation demandée',
        'Commentaire',
        'Statut facture',         // single select: ex "🟡 En attente"
      ],
    };

    // 1) Récupérer les factures (sans filtre Airtable pour éviter soucis d'accents/casse)
    const records = await base(TABLE).select(selectOptions).all();

    // 2) Collecter les IDs liés (clients, catégories)
    const clientIds = new Set<string>();
    const categoryIds = new Set<string>();

    records.forEach((r: any) => {
      const clients = r.get('Client');
      const categories = r.get('Catégorie');

      if (clients && Array.isArray(clients)) {
        clients.forEach((id: string) => {
          if (id && typeof id === 'string') clientIds.add(id);
        });
      }

      if (categories && Array.isArray(categories)) {
        categories.forEach((id: string) => {
          if (id && typeof id === 'string') categoryIds.add(id);
        });
      }
    });

    // 3) Résoudre noms d'établissements
    const clientNames: Record<string, string> = {};
    if (clientIds.size > 0) {
      const clientRecs = await base('ÉTABLISSEMENTS')
        .select({
          filterByFormula: `OR(${Array.from(clientIds).map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ["Nom de l'établissement", 'Raison sociale'],
          maxRecords: clientIds.size,
        })
        .all();

      clientRecs.forEach((c: any) => {
        clientNames[c.id] = c.get("Nom de l'établissement") || c.get('Raison sociale') || '';
      });
    }

    // 4) Résoudre noms de catégories (champ "Name")
    const categoryNames: Record<string, string> = {};
    if (categoryIds.size > 0) {
      const catRecs = await base(CATEGORIES_TABLE)
        .select({
          filterByFormula: `OR(${Array.from(categoryIds).map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Name'],
          maxRecords: categoryIds.size,
        })
        .all();

      catRecs.forEach((c: any) => {
        categoryNames[c.id] = c.get('Name') || '';
      });
    }

    // 5) Mapping des résultats (statut en string, catégories résolues)
    const results = records.map((r: any) => {
      const clientRef: string[] = r.get('Client') || [];
      const clientId = Array.isArray(clientRef) && clientRef.length > 0 ? clientRef[0] : null;

      const rawStatut = r.get('Statut facture');

      const catsRef = r.get('Catégorie');
      let categorieText = 'Non catégorisé';
      
      if (catsRef && Array.isArray(catsRef) && catsRef.length > 0) {
        const catsNames = catsRef.map(id => categoryNames[id]).filter(Boolean);
        categorieText = catsNames.length ? catsNames.join(' / ') : 'Non catégorisé';
      }

      return {
        id: r.id,
        categorie: categorieText,
        nomEtablissement: clientId ? (clientNames[clientId] ?? null) : null,
        date: r.get("Date d'émission") ?? null,
        montant: r.get('Montant total net') ?? null,
        typePrestation: r.get('Prestation demandée') ?? null,
        commentaire: r.get('Commentaire') ?? null,
        statut: toText(rawStatut), // toujours une string
      };
    });

    // 6) Filtre par statut "En attente" (insensible accents/emoji/casse)
    const target = 'en attente';
    const filteredByStatut = results.filter(it =>
      normalize(it.statut).includes(normalize(target))
    );

    // 7) Filtre texte q sur établissement OU catégorie (noms résolus)
    const nq = normalize(q);
    const filtered = q
      ? filteredByStatut.filter(r =>
        (r.nomEtablissement && normalize(r.nomEtablissement).includes(nq)) ||
        (r.categorie && normalize(r.categorie).includes(nq))
      )
      : filteredByStatut;

    // Appliquer l'offset et la limite pour la pagination
    const paginatedInvoices = filtered.slice(offset, offset + limit);

    return res.status(200).json({ invoices: paginatedInvoices });
  } catch (error: any) {
    console.error('facturation/en_attente error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
