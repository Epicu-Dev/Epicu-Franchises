import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE = 'FACTURES';
const CATEGORIES_TABLE = 'CATÉGORIES';

// Convertit n'importe quelle valeur Airtable (string / objet {name} / tableau) en texte
const toText = (v: any): string => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(toText).join(' ');
  if (typeof v === 'object') return toText(v.name ?? JSON.stringify(v));
  return String(v);
};

// Normalise (supprime accents, met en minuscule)
const normalize = (s: any) => toText(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const establishmentId = String(req.query.id || '').trim();
    if (!establishmentId) {
      return res.status(400).json({ error: 'Missing establishment id (query param `id`)' });
    }

    const q = (req.query.q as string) || '';
    const limit = Math.max(1, Math.min(200, parseInt((req.query.limit as string) || '100', 10)));

    const selectOptions: any = {
      maxRecords: Math.max(200, limit), // fetch enough to filter server-side
      fields: [
        'Catégorie',
        'Client',
        "Date d\'émission",
        'Montant total net',
        'Prestation demandée',
        'Commentaire',
        'Statut facture',
      ],
    };

    // 1) Récupération des factures (sans filtrage Airtable pour éviter mismatch accents/case)
    const records = await base(TABLE).select(selectOptions).all();

    // 2) Filtrer localement les factures qui mentionnent l'établissement donné
    const filteredRecords = records.filter((r: any) => {
      const clients = r.get('Client') || [];
      return Array.isArray(clients) && clients.includes(establishmentId);
    });

    // 3) Récupérer le nom de l'établissement demandé
    let establishmentName = null;
    if (establishmentId) {
      const estRecs = await base('ÉTABLISSEMENTS')
        .select({ filterByFormula: `RECORD_ID() = '${establishmentId}'`, fields: ["Nom de l'établissement", 'Raison sociale'], maxRecords: 1 })
        .all();
      if (estRecs && estRecs.length > 0) {
        const c = estRecs[0];
        establishmentName = c.get("Nom de l'établissement") || c.get('Raison sociale') || null;
      }
    }

    // 4) Collecte des catégories liées depuis les factures filtrées
    const categoryIds = new Set<string>();
    filteredRecords.forEach((r: any) => {
      (r.get('Catégorie') || []).forEach((id: string) => categoryIds.add(id));
    });

    const categoryNames: Record<string, string> = {};
    if (categoryIds.size > 0) {
      const catRecs = await base(CATEGORIES_TABLE)
        .select({ filterByFormula: `OR(${Array.from(categoryIds).map((id) => `RECORD_ID() = '${id}'`).join(',')})`, fields: ['Name'], maxRecords: categoryIds.size })
        .all();
      catRecs.forEach((c: any) => {
        categoryNames[c.id] = c.get('Name') || '';
      });
    }

    // 5) Mapping résultat
    const results = filteredRecords.map((r: any) => {
      const catsRef: string[] = r.get('Catégorie') || [];
      const catsNames = catsRef.map((id) => categoryNames[id]).filter(Boolean);
      const categorieText = catsNames.join(' / ') || null;

      return {
        id: r.id,
        categorie: categorieText,
        nomEtablissement: establishmentName,
        date: r.get("Date d'émission") ?? null,
        montant: r.get('Montant total net') ?? null,
        typePrestation: r.get('Prestation demandée') ?? null,
        commentaire: r.get('Commentaire') ?? null,
        statut: toText(r.get('Statut facture')) || null,
      };
    });

    // 6) Filtre texte q (nom établissement / catégorie) et limite
    const filtered = q
      ? results.filter((r) => normalize(r.nomEtablissement).includes(normalize(q)) || normalize(r.categorie).includes(normalize(q)))
      : results;

    return res.status(200).json({ invoices: filtered.slice(0, limit) });
  } catch (error: any) {
    console.error('facturation/etablissement error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
