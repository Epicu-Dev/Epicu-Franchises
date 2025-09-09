import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';

const TABLE_NAME = 'ÉTABLISSEMENTS';
const VIEW_NAME = '🟢 Clients';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    // PATCH handler: update client fields
    if (req.method === 'PATCH') {
      try {
        const body = req.body || {};
        const id = (req.query.id as string) || body.id;
        if (!id) return res.status(400).json({ error: 'id requis' });

        // Helpers (minimal, adapted from prospects)
        const ensureRelatedRecord = async (tableName: string, candidateValue: any, candidateFields: string[]) => {
          if (!candidateValue) return null;
          if (typeof candidateValue === 'string' && /^rec[A-Za-z0-9]+/.test(candidateValue)) return candidateValue;
          const val = String(candidateValue || '').trim();
          if (!val) return null;
          const formulaParts = candidateFields.map((f) => `LOWER({${f}}) = "${val.toLowerCase().replace(/"/g, '\\"')}"`);
          try {
            const found = await base(tableName).select({ filterByFormula: `OR(${formulaParts.join(',')})`, maxRecords: 1 }).firstPage();
            if (found && found.length > 0) return found[0].id;
          } catch (e) {
            // ignore
          }
          try {
            const created = await base(tableName).create([{ fields: { [candidateFields[0] || 'Name']: val } }]);
            return created[0].id;
          } catch (e) {
            return null;
          }
        };

        const resolveCategoryIds = async (raw: any) => {
          if (!raw) return [];
          const values = Array.isArray(raw) ? raw : [raw];
          const ids: string[] = [];
          for (const v of values.slice(0, 2)) {
            const id = await ensureRelatedRecord('Catégories', v, ['Name']);
            if (id) ids.push(id);
          }
          return ids;
        };

        const fieldsToUpdate: any = {};
        if (Object.prototype.hasOwnProperty.call(body, 'Catégorie')) {
          const catIds = await resolveCategoryIds(body['Catégorie'] || body.categorie);
          if (catIds.length > 0) fieldsToUpdate['Catégorie'] = catIds; else fieldsToUpdate['Catégorie'] = [];
        }
        if (Object.prototype.hasOwnProperty.call(body, "Nom de l'établissement")) fieldsToUpdate["Nom de l'établissement"] = body["Nom de l'établissement"];
        if (Object.prototype.hasOwnProperty.call(body, 'Raison sociale')) fieldsToUpdate['Raison sociale'] = body['Raison sociale'];
        if (Object.prototype.hasOwnProperty.call(body, 'Email')) fieldsToUpdate['Email'] = body['Email'];
        if (Object.prototype.hasOwnProperty.call(body, 'Téléphone')) fieldsToUpdate['Téléphone'] = body['Téléphone'];
        if (Object.prototype.hasOwnProperty.call(body, 'Adresse')) fieldsToUpdate['Adresse'] = body['Adresse'];
        if (Object.prototype.hasOwnProperty.call(body, 'Ville')) fieldsToUpdate['Ville'] = body['Ville'];
        if (Object.prototype.hasOwnProperty.call(body, 'Code postal')) fieldsToUpdate['Code postal'] = body['Code postal'];
        if (Object.prototype.hasOwnProperty.call(body, 'SIRET')) fieldsToUpdate['SIRET'] = body['SIRET'];
        if (Object.prototype.hasOwnProperty.call(body, 'Description')) fieldsToUpdate['Description'] = body['Description'];
        if (Object.prototype.hasOwnProperty.call(body, 'Commentaires')) fieldsToUpdate['Commentaires'] = body['Commentaires'];
        if (Object.prototype.hasOwnProperty.call(body, 'Ville EPICU')) {
          const villeId = await ensureRelatedRecord('VILLES EPICU', body['Ville EPICU'], ['Ville', 'Name']);
          if (villeId) fieldsToUpdate['Ville EPICU'] = [villeId]; else fieldsToUpdate['Ville EPICU'] = [];
        }

        if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

        const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);
        return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
      } catch (err: any) {
        console.error('clients PATCH error', err);
        return res.status(500).json({ error: 'Erreur mise à jour client', details: err?.message || String(err) });
      }
    }
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
      'Email',
      'Téléphone',
      'Adresse',
      'Ville',
      'Code postal',
      'SIRET',
      'Description',
      'Ville EPICU',
      'Commentaires',
      'Date de signature (from HISTORIQUE DE PUBLICATIONS)',
      'HISTORIQUE DE PUBLICATIONS',
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
    if (req.method === 'GET') {
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

      // Récupérer les publications pour tous les clients de la page
      const publicationIds = Array.from(new Set(pageRecords.flatMap((r: any) => r.get('HISTORIQUE DE PUBLICATIONS') || [])));
      let publicationsData: Record<string, any> = {};

      if (publicationIds.length > 0) {
        try {
          const publications = await base('HISTORIQUE DE PUBLICATIONS')
            .select({
              filterByFormula: `OR(${publicationIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
              fields: [
                'Date de publication',
                'Montant de la sponsorisation',
                "Montant de l'addition",
                'Cadeau du gérant pour le jeu concours',
                'Montant du cadeau',
                'Tirage effectué',
                'Commentaire',
                '📊 Nombre de vues',
                '❤️ Likes',
                '🔁 Partages',
                '📌 Enregistrements'
              ],
              pageSize: Math.min(publicationIds.length, 100),
              maxRecords: publicationIds.length,
            })
            .all();

          publications.forEach((pub: any) => {
            publicationsData[pub.id] = {
              id: pub.id,
              datePublication: pub.get('Date de publication'),
              montantSponsorisation: pub.get('Montant de la sponsorisation'),
              montantAddition: pub.get("Montant de l'addition"),
              cadeauGerant: pub.get('Cadeau du gérant pour le jeu concours'),
              montantCadeau: pub.get('Montant du cadeau'),
              tirageEffectue: pub.get('Tirage effectué'),
              benefice: pub.get('Bénéfice'),
              commentaire: pub.get('Commentaire'),
              nombreVues: pub.get('📊 Nombre de vues') || 0,
              likes: pub.get('❤️ Likes') || 0,
              partages: pub.get('🔁 Partages') || 0,
              enregistrements: pub.get('📌 Enregistrements') || 0,
            };
          });
        } catch (e) {
          // Ignorer les erreurs de récupération des publications
        }
      }

      const clients = pageRecords.map((record: any) => {
        const catIds = record.get('Catégorie') || [];
        const catName = Array.isArray(catIds) && catIds.length > 0
          ? (categoryNames[catIds[0]] || catIds[0])
          : '';

        // Récupérer les publications associées à ce client
        const clientPublicationIds = record.get('HISTORIQUE DE PUBLICATIONS') || [];
        const publications = Array.isArray(clientPublicationIds)
          ? clientPublicationIds.map((id: string) => publicationsData[id]).filter(Boolean)
          : [];

        return {
          id: record.id,
          nomEtablissement: record.get("Nom de l'établissement"),
          categorie: catName,
          raisonSociale: record.get('Raison sociale'),
          email: record.get('Email'),
          telephone: record.get('Téléphone'),
          adresse: record.get('Adresse'),
          ville: record.get('Ville'),
          codePostal: record.get('Code postal'),
          siret: record.get('SIRET'),
          description: record.get('Description'),
          villeEpicu: record.get('Ville EPICU'),
          commentaires: record.get('Commentaires'),
          dateSignatureContrat: record.get('Date de signature (from HISTORIQUE DE PUBLICATIONS)'),
          publications: publications
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
      return;
    }

    // Méthode non autorisée pour cette route
    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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
