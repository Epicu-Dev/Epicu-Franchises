import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE_NAME = 'VILLES EPICU';
const VIEW_NAME = "Vue complète";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = (req.query.q as string) || (req.query.search as string) || '';
    if (!q || q.trim().length === 0) {
      return res.status(200).json({ results: [] });
    }

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/"/g, '\\\"').toLowerCase();

    const pattern = escapeForAirtableRegex(q.trim());
    const filterFormula = `REGEX_MATCH(LOWER({Ville EPICU}), "${pattern}")`;

    // Limiter à 10 résultats, pas de tri/offset
    const records = await base(TABLE_NAME)
      .select({
        view: VIEW_NAME,
        fields: ['Ville EPICU'],
        filterByFormula: filterFormula,
        maxRecords: 10,
      })
      .all();

    const results = records.map((r: any) => ({ id: r.id, ville: r.get('Ville EPICU') }));

    res.status(200).json({ results, count: results.length });
  } catch (error: any) {
    console.error('Airtable error (villes epicu):', error?.message || error);
    res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
