import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE_NAME = 'COLLABORATEURS';
const VIEW_NAME = 'Utilisateurs par rôle';

const CITIES_TABLE_NAME = 'VILLES EPICU';
const CITY_NAME_FIELD = 'Ville EPICU';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limitRaw = parseInt((req.query.limit as string) || '10', 10);
    const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 10 : limitRaw)); // Airtable pageSize max 100
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderByReq = (req.query.orderBy as string) || 'Nom complet';
    const allowedOrderBy = new Set(['Nom complet']);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : 'Nom complet';

    const q = (req.query.q as string) || (req.query.search as string) || '';

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

    // On renvoie toujours une page (même sans filtre)
    const selectOptions: any = {
      view: VIEW_NAME,
      fields: ['Nom complet', 'Ville EPICU'],
      pageSize: limit,
      sort: [{ field: orderBy, direction: order }],
      // 👇 overfetch +1 pour savoir s'il reste des données
      maxRecords: offset + limit + 1,
    };

    // Filtre par nom (regex, insensible à la casse)
    if (q.trim().length > 0) {
      const pattern = escapeForAirtableRegex(q.trim());
      selectOptions.filterByFormula = `REGEX_MATCH(LOWER({Nom complet}), "${pattern}")`;
    }

    const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

    // Page courante
    const pageRecords = upToPageRecords.slice(offset, offset + limit);

    // Récupérer tous les IDs de villes liés sur la page et les résoudre en noms
    const allCityIds: string[] = Array.from(
      new Set(
        pageRecords.flatMap((r: any) => (r.get('Ville EPICU') as string[] | undefined) || [])
      )
    );

    let cityNameById = new Map<string, string>();
    if (allCityIds.length > 0) {
      const formula = `OR(${allCityIds.map((id) => `RECORD_ID()="${id}"`).join(',')})`;
      const cityRecords = await base(CITIES_TABLE_NAME)
        .select({ fields: [CITY_NAME_FIELD], filterByFormula: formula })
        .all();
      cityRecords.forEach((cr: any) => {
        cityNameById.set(cr.id, cr.get(CITY_NAME_FIELD));
      });
    }

    const results = pageRecords.map((r: any) => {
      const linkedCityIds: string[] = (r.get('Ville EPICU') as string[] | undefined) || [];
      const villes = linkedCityIds
        .map((id) => cityNameById.get(id))
        .filter((v): v is string => Boolean(v));
      return {
        id: r.id, // record id du collaborateur
        nomComplet: r.get('Nom complet') || '',
        villes, // liste de noms de villes
      };
    });

    const hasMore = upToPageRecords.length > offset + limit;

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
    console.error('Airtable error (collaborateurs):', error?.message || error);
    res.status(500).json({
      error: 'Erreur Airtable',
      details: error?.message || String(error),
      statusCode: error?.statusCode,
      type: error?.error?.type,
    });
  }
}