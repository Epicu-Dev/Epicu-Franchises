import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE_NAME = 'VILLES EPICU';
const VIEW_NAME = 'Vue complète';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limitRaw = parseInt((req.query.limit as string) || '10', 10);
    const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 10 : limitRaw)); // Airtable pageSize max 100
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderByReq = (req.query.orderBy as string) || 'Ville EPICU';
    const allowedOrderBy = new Set(['Ville EPICU']);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : 'Ville EPICU';

    const q = (req.query.q as string) || (req.query.search as string) || '';

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

    // Si pas de requête, on renvoie une liste vide (comportement initial),
    // mais avec un objet pagination cohérent.
    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        results: [],
        pagination: {
          limit,
          offset,
          orderBy,
          order,
          hasMore: false,
          nextOffset: null,
          prevOffset: Math.max(0, offset - limit),
        },
      });
    }

    const pattern = escapeForAirtableRegex(q.trim());
    const filterFormula = `REGEX_MATCH(LOWER({Ville EPICU}), "${pattern}")`;

    const selectOptions: any = {
      view: VIEW_NAME,
      fields: ['Ville EPICU'],
      pageSize: limit,
      sort: [{ field: orderBy, direction: order }],
      filterByFormula: filterFormula,
      maxRecords: offset + limit, // ne charger qu'au plus offset+limit
    };

    const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();
    const pageRecords = upToPageRecords.slice(offset, offset + limit);

    const results = pageRecords.map((r: any) => ({
      id: r.id,
      ville: r.get('Ville EPICU'),
    }));

    const hasMore = upToPageRecords.length === offset + limit;

    res.status(200).json({
      results,
      pagination: {
        limit,
        offset,
        orderBy,
        order,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
        prevOffset: Math.max(0, offset - limit),
      },
    });
  } catch (error: any) {
    console.error('Airtable error (villes epicu):', error?.message || error);
    res.status(500).json({
      error: 'Erreur Airtable',
      details: error?.message || String(error),
      statusCode: error?.statusCode,
      type: error?.error?.type,
    });
  }
}
