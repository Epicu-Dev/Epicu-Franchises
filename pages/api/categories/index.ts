import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE_NAME = 'CATÉGORIES';
const VIEW_NAME = 'Grid view';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = (req.query.q as string) || (req.query.search as string) || '';

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\"/g, '\\\"').toLowerCase();

    // If no query provided, return up to 10 categories (default behaviour requested)
    if (!q || q.trim().length === 0) {
      const records = await base(TABLE_NAME)
        .select({
          view: VIEW_NAME,
          fields: ['Name'],
          maxRecords: 10,
        })
        .all();

      const results = records.map((r: any) => ({ id: r.id, name: r.get('Name') }));
      return res.status(200).json({ results, count: results.length });
    }

    const pattern = escapeForAirtableRegex(q.trim());
    const filterFormula = `REGEX_MATCH(LOWER({Name}), "${pattern}")`;

    const records = await base(TABLE_NAME)
      .select({
        view: VIEW_NAME,
        fields: ['Name'],
        filterByFormula: filterFormula,
        maxRecords: 10,
      })
      .all();

    const results = records.map((r: any) => ({ id: r.id, name: r.get('Name') }));

    res.status(200).json({ results, count: results.length });
  } catch (error: any) {
    console.error('Airtable error (categories):', error?.message || error);
    res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}
