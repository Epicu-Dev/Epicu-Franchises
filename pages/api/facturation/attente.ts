import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE = 'FACTURES';
const CATEGORIES_TABLE = 'CATÉGORIES';

// Convertit n'importe quelle valeur Airtable (string / objet {name} / tableau) en texte
const toText = (v: any): string => {
  if (v == null) return '';
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
    const limit = Math.max(1, Math.min(200, parseInt((req.query.limit as string) || '100', 10)));

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
      (r.get('Client') || []).forEach((id: string) => clientIds.add(id));
      (r.get('Catégorie') || []).forEach((id: string) => categoryIds.add(id));
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

      const catsRef: string[] = r.get('Catégorie') || [];
      const catsNames = catsRef.map(id => categoryNames[id]).filter(Boolean);
      const categorieText = catsNames.length ? catsNames.join(' / ') : null;

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
        normalize(r.nomEtablissement).includes(nq) ||
        normalize(r.categorie).includes(nq)
      )
      : filteredByStatut;

    return res.status(200).json({ invoices: filtered.slice(0, limit) });
  } catch (error: any) {
    console.error('facturation/en_attente error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
