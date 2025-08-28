import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const TABLE_NAME = 'STATISTIQUES MENSUELLES';
const VIEW_NAME = 'Vue complète';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limitRaw = parseInt((req.query.limit as string) || '50', 10);
    const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw)); // Airtable pageSize max 100
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderByReq = (req.query.orderBy as string) || "Mois-Annéee";
    const q = (req.query.q as string) || (req.query.search as string) || '';
    const category = (req.query.category as string) || '';

    const fields = [
      'Date - ville EPICU',
      'Mois-Année',
      'Ville EPICU',
      'Calcul de date',
      'Max Calcul de date',
      'Est dernière date ?',
      '📊 Total abonnés',
      '📊 Total vues',
      '📊 Prospects vus ds le mois',
      '📊 Propects signés ds le mois',
      '📊 Tx de conversion'
    ];

    const allowedOrderBy = new Set([
      'Date - ville EPICU',
      'Mois-Année',
      'Ville EPICU',
      '📊 Total abonnés',
      '📊 Total vues',
    ]);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : 'Date - ville EPICU';

    const escapeForAirtableRegex = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '\\"').toLowerCase();

    // Options de sélection (tri/filtre côté Airtable)
    const selectOptions: any = {
      view: VIEW_NAME,
      fields,
      pageSize: limit,
      sort: [{ field: orderBy, direction: order }],
    };

    // Construire la formule de filtrage
    let filterFormulas: string[] = [];

    if (q && q.trim().length > 0) {
      const pattern = escapeForAirtableRegex(q.trim());

      filterFormulas.push(
        `OR(` +
        `REGEX_MATCH(LOWER({Date - ville EPICU}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Mois-Année}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Ville EPICU}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({📊 Total abonnés}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({📊 Total vues}), "${pattern}")` +
        `)`
      );
    }



    // Appliquer les filtres si il y en a
    if (filterFormulas.length > 0) {
      selectOptions.filterByFormula = filterFormulas.length === 1
        ? filterFormulas[0]
        : `AND(${filterFormulas.join(', ')})`;
    }

    // Ne récupérer qu'au plus offset+limit en mémoire
    selectOptions.maxRecords = offset + limit;

    // Récupération + fenêtre
    const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();
    const pageRecords = upToPageRecords.slice(offset, offset + limit);



    const statistiques = pageRecords.map((record: any) => {
      return {
        dateVilleEpicu: record.get('Date - ville EPICU'),
        moisAnnee: record.get('Mois-Année'),
        villeEpicu: record.get('Ville EPICU'),
        calculDate: record.get('Calcul de date'),
        maxCalculDate: record.get('Max Calcul de date'),
        estDerniereDate: record.get('Est dernière date ?'),
        totalAbonnes: record.get('📊 Total abonnés'),
        totalVues: record.get('📊 Total vues'),
        prospectsVusDsLeMois: record.get('📊 Prospects vus ds le mois'),
        prospectsSignesDsLeMois: record.get('📊 Propects signés ds le mois'),
        txDeConversion: record.get('📊 Tx de conversion'),
      };
    });

    const hasMore = upToPageRecords.length === offset + limit;

    console.log(statistiques);

    res.status(200).json({
      statistiques,
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
    console.error('Airtable error:', {
      statusCode: error?.statusCode,
      type: error?.error?.type,
      message: error?.message,
    });
    res.status(500).json({
      error: 'Erreur Airtable',
      details: error?.message || String(error),
      statusCode: error?.statusCode,
      type: error?.error?.type,
    });
  }
}
