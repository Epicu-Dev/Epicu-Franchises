import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const VIEW_NAME = '🟡 Prospects';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderBy = (req.query.orderBy as string) || "Nom de l'établissement";
  const q = (req.query.q as string) || (req.query.search as string) || '';

    const fields = [
      "Nom de l'établissement",
      'Catégorie',
      'Ville',
      'Suivi par...',
      'Commentaires',
      'Date de relance',
    ];

    const escapeForAirtableRegex = (s: string) => {
      return s
        .replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&')
        .replace(/"/g, '\\\"')
        .toLowerCase();
    };

    const selectOptions: any = { view: VIEW_NAME, fields };

    if (q && q.trim().length > 0) {
      const pattern = escapeForAirtableRegex(q.trim());
      const filterFormula = `OR(REGEX_MATCH(LOWER({Nom de l'établissement}), \"${pattern}\"),REGEX_MATCH(LOWER({Ville}), \"${pattern}\"),REGEX_MATCH(LOWER({Commentaires}), \"${pattern}\"))`;

      selectOptions.filterByFormula = filterFormula;
    }

    // Récupérer tous les prospects (éventuellement filtrés) pour le total
    const allRecords = await base('ÉTABLISSEMENTS')
      .select(selectOptions)
      .all();
    const totalCount = allRecords.length;

    // Pagination et tri
    let records = Array.from(allRecords);

    records = records.sort((a: any, b: any) => {
      const aValue = a.get(orderBy) || '';
      const bValue = b.get(orderBy) || '';

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;

      return 0;
    });
    records = records.slice(offset, offset + limit);

    // Récupérer les noms de catégorie (relation)
    const categoryIds = Array.from(new Set(records.flatMap((r: any) => r.get('Catégorie') || [])));
    let categoryNames: Record<string, string> = {};

    if (categoryIds.length > 0) {
      const catRecords = await base('Catégories')
        .select({
          filterByFormula: `OR(${categoryIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Name'],
        })
        .all();

      catRecords.forEach((cat: any) => {
        categoryNames[cat.id] = cat.get('Name');
      });
    }

    // Récupérer les noms des collaborateurs (relation Suivi par...)
    const suiviIds = Array.from(new Set(records.flatMap((r: any) => r.get('Suivi par...') || [])));
    let suiviNames: Record<string, string> = {};

    if (suiviIds.length > 0) {
      const suiviRecords = await base('Collaborateurs')
        .select({
          filterByFormula: `OR(${suiviIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Prénom', 'Nom'],
        })
        .all();

      suiviRecords.forEach((collab: any) => {
        const prenom = collab.get('Prénom') || '';
        const nom = collab.get('Nom') || '';

        suiviNames[collab.id] = `${prenom} ${nom}`.trim();
      });
    }

    const prospects = records.map((record: any) => {
      const catIds = record.get('Catégorie') || [];
      let catName = '';

      if (Array.isArray(catIds) && catIds.length > 0) {
        catName = categoryNames[catIds[0]] || catIds[0];
      }
      const suiviIds = record.get('Suivi par...') || [];
      let suiviPar = '';

      if (Array.isArray(suiviIds) && suiviIds.length > 0) {
        suiviPar = suiviNames[suiviIds[0]] || suiviIds[0];
      }

      return {
        nomEtablissement: record.get("Nom de l'établissement"),
        categorie: catName,
        ville: record.get('Ville'),
        suiviPar,
        commentaires: record.get('Commentaires'),
        dateRelance: record.get('Date de relance'),
      };
    });

    res.status(200).json({ prospects, totalCount, viewCount: allRecords.length });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erreur Airtable',
      details: error?.message || String(error),
      statusCode: error?.statusCode,
      type: error?.error?.type,
    });
  }
}
