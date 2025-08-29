import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const TABLE_NAME = 'ÉTABLISSEMENTS';
const VIEW_NAME = '🟢 Clients';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limitRaw = parseInt((req.query.limit as string) || '50', 10);
    const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw));
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const orderByReq = (req.query.orderBy as string) || "Nom de l'établissement";
    const q = (req.query.q as string) || (req.query.search as string) || '';
    const category = (req.query.category as string) || '';

    const fields = [
      'Catégorie',
      "Nom de l'établissement",
      'Raison sociale',
      'Prénom du contact',
      'Email',
      'Téléphone',
      'Adresse',
      'Ville',
      'Code postal',
      'Numéro TVA',
      'SIRET',
      'Description',
      'Fonction du contact',
      'Moyen de contact',
      'Pages Insta',
      'Ville EPICU',
      'Commentaires',
    ];

    const allowedOrderBy = new Set([
      "Nom de l'établissement",
      'Catégorie',
      'Raison sociale',
    ]);
    const orderBy = allowedOrderBy.has(orderByReq) ? orderByReq : "Nom de l'établissement";

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
        `REGEX_MATCH(LOWER({Nom de l'établissement}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Raison sociale}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Prénom du contact}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Email}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Ville}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Code postal}), "${pattern}"),` +
        `REGEX_MATCH(LOWER({Commentaires}), "${pattern}")` +
        `)`
      );
    }

    if (category && category.trim().length > 0) {
      try {
        let catName = String(category);

        if (/^rec/i.test(category)) {
          const rec = await base('Catégories').find(category);

          catName = String(rec.get('Name') || rec.get('Nom') || rec.get('Titre') || catName);
        }
        const catEsc = catName.replace(/'/g, "\\'");

        filterFormulas.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      } catch (e) {
        const catEsc = String(category).replace(/'/g, "\\'");

        filterFormulas.push(`FIND('${catEsc}', ARRAYJOIN({Catégorie})) > 0`);
      }
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

    // Résoudre Catégorie pour la page courante
    const categoryIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('Catégorie') || [])));
    let categoryNames: Record<string, string> = {};

    if (categoryIds.length > 0) {
      const catRecords = await base('Catégories')
        .select({
          filterByFormula: `OR(${categoryIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Name'],
          pageSize: Math.min(categoryIds.length, 100),
          maxRecords: categoryIds.length,
        })
        .all();

      catRecords.forEach((cat: any) => {
        categoryNames[cat.id] = cat.get('Name');
      });
    }

    const clients = pageRecords.map((record: any) => {
      const catIds = record.get('Catégorie') || [];
      const catName = Array.isArray(catIds) && catIds.length > 0
        ? (categoryNames[catIds[0]] || catIds[0])
        : '';

      return {
        nomEtablissement: record.get("Nom de l'établissement"),
        categorie: catName,
        raisonSociale: record.get('Raison sociale'),
        prenomContact: record.get('Prénom du contact'),
        email: record.get('Email'),
        telephone: record.get('Téléphone'),
        adresse: record.get('Adresse'),
        ville: record.get('Ville'),
        codePostal: record.get('Code postal'),
        numeroTVA: record.get('Numéro TVA'),
        siret: record.get('SIRET'),
        description: record.get('Description'),
        fonctionContact: record.get('Fonction du contact'),
        moyenContact: record.get('Moyen de contact'),
        pagesInsta: record.get('Pages Insta'),
        villeEpicu: record.get('Ville EPICU'),
        dateSignature: 'waiting', // conservé comme dans ton code
        commentaire: record.get('Commentaires')
      };
    });

    const hasMore = upToPageRecords.length === offset + limit;

    res.status(200).json({
      clients,
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
