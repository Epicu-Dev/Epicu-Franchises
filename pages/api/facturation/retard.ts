import type { NextApiRequest, NextApiResponse } from 'next';
import { base } from '../constants';

const TABLE = 'FACTURES';
const CATEGORIES_TABLE = 'CATÉGORIES';

// Convertit toute valeur Airtable (string / objet {name} / array) en texte
const toText = (v: any): string => {
  if (v == null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(toText).join(' ');
  if (typeof v === 'object') return toText((v as any).name ?? JSON.stringify(v));
  return String(v);
};

// Normalise (sans accents, minuscule)
const normalize = (s: any): string =>
  toText(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const q = (req.query.q as string) || '';
    const limit = Math.max(1, Math.min(200, parseInt((req.query.limit as string) || '20', 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));
    const sortField = (req.query.sortField as string) || 'establishmentName';
    const sortDirection = (req.query.sortDirection as string) || 'asc';

    const selectOptions: any = {
      view: 'Toutes les factures',
      maxRecords: limit,
      fields: [
        'Catégorie',              // IDs vers CATÉGORIES
        'Client',                 // IDs vers ÉTABLISSEMENTS
        "Date d'émission",
        'Montant total net',
        'Prestation',
        'Commentaire',
        'Statut facture',         // single select (ex. "🔴 En retard")
        'HISTORIQUE DE PUBLICATIONS', // ← Ajout du champ pour les publications
      ],
    };

    // 1) Récupération des factures
    const records = await base(TABLE).select(selectOptions).all();

    // 2) Collecte des IDs liés
    const clientIds = new Set<string>();
    const categoryIds = new Set<string>();
    records.forEach((r: any) => {
      const clients = r.get('Client');
      const categories = r.get('Catégorie');
      
      if (clients && Array.isArray(clients)) {
        clients.forEach((id: string) => {
          if (id && typeof id === 'string') clientIds.add(id);
        });
      }
      
      if (categories && Array.isArray(categories)) {
        categories.forEach((id: string) => {
          if (id && typeof id === 'string') categoryIds.add(id);
        });
      }
    });

    // 3) Résolution des noms d'établissements
    const clientNames: Record<string, string> = {};
    if (clientIds.size > 0) {
      const clientRecs = await base('ÉTABLISSEMENTS')
        .select({
          filterByFormula: `OR(${Array.from(clientIds).map(id => `RECORD_ID() = '${id}'`).join(',')})`,
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
          filterByFormula: `OR(${Array.from(categoryIds).map(id => `RECORD_ID() = '${id}'`).join(',')})`,
          fields: ['Name'],
          maxRecords: categoryIds.size,
        })
        .all();

      catRecs.forEach((c: any) => {
        categoryNames[c.id] = c.get('Name') || '';
      });
    }


    // 6) Mapping résultats (catégories résolues, statut en texte)
    const results = records.map((r: any) => {
      const clientRef: string[] = r.get('Client') || [];
      const clientId = Array.isArray(clientRef) && clientRef.length > 0 ? clientRef[0] : null;

      const catsRef = r.get('Catégorie');
      let categorieText = 'Non catégorisé';
      
      if (catsRef && Array.isArray(catsRef) && catsRef.length > 0) {
        const catsNames = catsRef.map(id => categoryNames[id]).filter(Boolean);
        categorieText = catsNames.length ? catsNames.join(' / ') : 'Non catégorisé';
      }

      const pubsRef = r.get('HISTORIQUE DE PUBLICATIONS');
      let publicationId = null;
      
      if (pubsRef && Array.isArray(pubsRef) && pubsRef.length > 0) {
        publicationId = pubsRef[0]; // Prendre la première publication
      }

      return {
        id: r.id,
        categorie: categorieText,
        nomEtablissement: clientId ? (clientNames[clientId] ?? null) : null,
        dateEmission: r.get("Date d'émission") ?? null,
        montant: r.get('Montant total net') ?? null,
        typePrestation: r.get('Prestation') ?? null,
        commentaire: r.get('Commentaire') ?? null,
        statut: toText(r.get('Statut facture')), // toujours une string
        publicationId: publicationId, // ← ID de la publication
      };
    });

    // 6) Filtre par statut "En retard" (emoji/casse/accents tolérés)
    const target = 'en retard';
    const filteredByStatut = results.filter(it =>
      normalize(it.statut).includes(normalize(target))
    );

    // 7) Filtre texte optionnel sur établissement OU catégorie
    const nq = normalize(q);
    const filtered = q
      ? filteredByStatut.filter(r =>
        (r.nomEtablissement && normalize(r.nomEtablissement).includes(nq)) ||
        (r.categorie && normalize(r.categorie).includes(nq))
      )
      : filteredByStatut;

    // 8) Tri des résultats
    const sorted = filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'category':
          aValue = a.categorie || '';
          bValue = b.categorie || '';
          break;
        case 'establishmentName':
          aValue = a.nomEtablissement || '';
          bValue = b.nomEtablissement || '';
          break;
        case 'dateEmission':
          aValue = a.dateEmission ? new Date(a.dateEmission).getTime() : 0;
          bValue = b.dateEmission ? new Date(b.dateEmission).getTime() : 0;
          break;
        case 'amount':
          aValue = a.montant || 0;
          bValue = b.montant || 0;
          break;
        default:
          aValue = a.nomEtablissement || '';
          bValue = b.nomEtablissement || '';
      }

      if (sortField === 'dateEmission' || sortField === 'amount') {
        // Tri numérique
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Tri alphabétique
        const comparison = aValue.toString().localeCompare(bValue.toString(), 'fr');
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    // Appliquer l'offset et la limite pour la pagination
    const paginatedInvoices = sorted.slice(offset, offset + limit);
    
    return res.status(200).json({ invoices: paginatedInvoices });
  } catch (error: any) {
    console.error('facturation/en_retard error:', error?.message || error);
    return res.status(500).json({ error: 'Internal error', details: error?.message || String(error) });
  }
}
