import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';
import { view } from 'framer-motion';

const TABLE = 'FACTURES';
const CATEGORIES_TABLE = 'CATÉGORIES'; // table liée qui contient le champ "Name"

// Convertit n'importe quelle valeur Airtable (string / objet {name} / tableau) en texte
const toText = (v: any): string => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(toText).join(' ');
  if (typeof v === 'object') return toText(v.name ?? JSON.stringify(v));
  return String(v);
};

// Normalise (supprime accents, met en minuscule)
const normalize = (s: any) =>
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
        'Catégorie',            // ← IDs vers CATÉGORIES
        'Client',
        "Date d'émission",
        'Montant total net',
        'Prestation demandée',
        'Commentaire',
        'Statut facture',
      ],
    };

    // 1) Récupération des factures
    const records = await base(TABLE).select(selectOptions).all();

    // 2) Collecte des IDs liés
    const clientIds = new Set<string>();
    const categoryIds = new Set<string>();

    records.forEach((r: any) => {
      (r.get('Client') || []).forEach((id: string) => clientIds.add(id));
      (r.get('Catégorie') || []).forEach((id: string) => categoryIds.add(id));
    });

    // 3) Résolution des noms d'établissements
    const clientNames: Record<string, string> = {};
    if (clientIds.size > 0) {
      const clientRecs = await base('ÉTABLISSEMENTS')
        .select({
          filterByFormula: `OR(${Array.from(clientIds).map((id) => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ["Nom de l'établissement", 'Raison sociale'],
          maxRecords: clientIds.size,
        })
        .all();

      clientRecs.forEach((c: any) => {
        clientNames[c.id] = c.get("Nom de l'établissement") || c.get('Raison sociale') || '';
      });
    }

    // 4) Résolution des noms de catégories (champ "Name")
    const categoryNames: Record<string, string> = {};
    if (categoryIds.size > 0) {
      const catRecs = await base(CATEGORIES_TABLE)
        .select({
          filterByFormula: `OR(${Array.from(categoryIds).map((id) => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Name'],
          maxRecords: categoryIds.size,
        })
        .all();

      catRecs.forEach((c: any) => {
        categoryNames[c.id] = c.get('Name') || '';
      });
    }

    // 5) Mapping résultat (catégorie = nom(s) depuis CATÉGORIES)
    const results = records.map((r: any) => {
      const clientRef = r.get('Client') || [];
      const clientId = Array.isArray(clientRef) && clientRef.length > 0 ? clientRef[0] : null;

      const rawStatut = r.get('Statut facture');
      const statutText = toText(rawStatut);

      const catsRef: string[] = r.get('Catégorie') || [];
      const catsNames = catsRef.map((id) => categoryNames[id]).filter(Boolean);
      const categorieText = catsNames.join(' / ') || null;

      return {
        id: r.id,
        categorie: categorieText, // ← nom(s) depuis CATÉGORIES
        nomEtablissement: clientId ? (clientNames[clientId] ?? null) : null,
        date: r.get("Date d'émission") ?? null,
        montant: r.get('Montant total net') ?? null,
        typePrestation: r.get('Prestation demandée') ?? null,
        commentaire: r.get('Commentaire') ?? null,
        statut: statutText,
      };
    });

    const target = 'payee';
    const filteredByStatut = results.filter((it) => normalize(it.statut).includes(target));

    // 7) Filtre texte q (nom établissement / catégorie (Name))
    const filtered = q
      ? filteredByStatut.filter(
          (r) =>
            normalize(r.nomEtablissement).includes(normalize(q)) ||
            normalize(r.categorie).includes(normalize(q))
        )
      : filteredByStatut;

    return res.status(200).json({ invoices: filtered.slice(0, limit) });
  } catch (error: any) {
    console.error('facturation/en_attente error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
