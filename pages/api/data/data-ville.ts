import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'STATISTIQUES MENSUELLES VILLE';
const VIEW_NAME = 'Vue complète';

function escAirtable(s: string) {
  return s.replace(/"/g, '\\"');
}

function canonicalFirstOfMonth(date: string) {
  if (/^[0-9]{2}-[0-9]{4}$/.test(date)) {
    const [mm, yyyy] = date.split('-');
    return `${yyyy}-${mm}-01`;
  }
  if (/^[0-9]{2}\/[0-9]{4}$/.test(date)) {
    const [mm, yyyy] = date.split('/');
    return `${yyyy}-${mm}-01`;
  }
  if (/^[0-9]{4}-[0-9]{2}-01$/.test(date)) {
    return date;
  }
  if (/^[0-9]{4}-[0-9]{2}$/.test(date)) {
    const [yyyy, mm] = date.split('-');
    return `${yyyy}-${mm}-01`;
  }
  if (/^[0-9]{4}$/.test(date)) {
    return `${date}-01-01`;
  }
  return null;
}

function toNumber(v: any) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/\s+/g, '').replace(/,/g, '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

async function resolveCityName(ville: string): Promise<string | null> {
  if (!ville) return null;
  if (/^rec/i.test(ville)) {
    try {
      const cityRec = await base('VILLES EPICU').find(ville);
      const vn = cityRec.get('Ville EPICU');
      return vn != null ? String(vn) : null;
    } catch {
      return null;
    }
  }
  return ville;
}

function buildDateVilleFormula(date: string, villeName?: string | null) {
  const canonical = canonicalFirstOfMonth(date);
  if (!canonical) return null;
  const monthYear = `${String(new Date(canonical).getMonth() + 1).padStart(2, '0')}/${new Date(canonical).getFullYear()}`;
  if (villeName) {
    return `{Date - ville EPICU} = "${escAirtable(monthYear + ' - ' + villeName)}"`;
  }
  return `FIND("${escAirtable(monthYear)}", {Date - ville EPICU})`;
}

function getField(record: any, ...names: string[]) {
  for (const n of names) {
    const v = record.get(n);
    if (v !== undefined) return v;
  }
  return undefined;
}

function mapRecordToPayload(record: any) {
  return {
    dateVilleEpicu: getField(record, 'Date - ville EPICU') || null,
    moisAnnee: getField(record, 'Mois-Année') || null,
    villeEpicu: getField(record, 'Ville EPICU') || null,
    totalAbonnes: toNumber(getField(record, 'Total abonnés', '📊 Total abonnés', 'Nombre d\'abonnés')),
    totalVues: toNumber(getField(record, 'Total vues', '📊 Total vues')),
    totalProspectsVus: toNumber(getField(record, 'Prospects vus ds le mois', '📊 Prospects vus ds le mois', 'Prospects vus')),
    totalProspectsSignes: toNumber(getField(record, 'Propects signés ds le mois', '📊 Propects signés ds le mois', 'Clients signés')),
    tauxConversion: roundTo2(toNumber(getField(record, 'Tx de conversion', '📊 Tx de conversion'))),
    postsPublies: toNumber(getField(record, 'Posts publiés')),
    abonnesFood: toNumber(getField(record, 'Abonnés 🟠 FOOD', '📊 Abonnés 🟠 FOOD')),
    abonnesShop: toNumber(getField(record, 'Abonnés 🟣 SHOP', '📊 Abonnés 🟣 SHOP')),
    abonnesTravel: toNumber(getField(record, 'Abonnés 🟢 TRAVEL', '📊 Abonnés 🟢 TRAVEL')),
    abonnesFun: toNumber(getField(record, 'Abonnés 🔴 FUN', '📊 Abonnés 🔴 FUN')),
    abonnesBeauty: toNumber(getField(record, 'Abonnés 🩷 BEAUTY', '📊 Abonnés 🩷 BEAUTY')),
    vuesFood: toNumber(getField(record, 'Vues 🟠 FOOD', '📊 Vues 🟠 FOOD')),
    vuesShop: toNumber(getField(record, 'Vues 🟣 SHOP', '📊 Vues 🟣 SHOP')),
    vuesTravel: toNumber(getField(record, 'Vues 🟢 TRAVEL', '📊 Vues 🟢 TRAVEL')),
    vuesFun: toNumber(getField(record, 'Vues 🔴 FUN', '📊 Vues 🔴 FUN')),
    vuesBeauty: toNumber(getField(record, 'Vues 🩷 BEAUTY', '📊 Vues 🩷 BEAUTY')),
    montantCadeau: toNumber(getField(record, 'Montant des cadeaux')),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const method = req.method || 'GET';

    if (method === 'PATCH') {
      const body = req.body || {};
      const villeReq = (body.ville as string) || (req.query.ville as string) || '';
      const date = (body.date as string) || (req.query.date as string) || '';

      if (!villeReq || villeReq === 'all') {
        return res.status(400).json({ error: 'Paramètre ville requis et ne peut pas être "all" pour PATCH' });
      }

      const canonical = canonicalFirstOfMonth(date);
      if (!canonical) {
        return res.status(400).json({ error: 'Paramètre date invalide. Format attendu: mm-yyyy' });
      }

      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      const FIELD_MAP: Record<string, string> = {
        viewsFood: 'Vues 🟠 FOOD',
        abonnesFood: 'Abonnés 🟠 FOOD',
        abonnesShop: 'Abonnés 🟣 SHOP',
        vuesShop: 'Vues 🟣 SHOP',
        abonnesTravel: 'Abonnés 🟢 TRAVEL',
        vuesTravel: 'Vues 🟢 TRAVEL',
        abonnesFun: 'Abonnés 🔴 FUN',
        vuesFun: 'Vues 🔴 FUN',
        abonnesBeauty: 'Abonnés 🩷 BEAUTY',
        vuesBeauty: 'Vues 🩷 BEAUTY',
      };

      const allowedAirtableFields = new Set(Object.values(FIELD_MAP));

      const fieldsToUpdate: Record<string, any> = {};
      for (const [k, airtableName] of Object.entries(FIELD_MAP)) {
        if ((body as any)[k] !== undefined) fieldsToUpdate[airtableName] = toNumber((body as any)[k]);
      }
      for (const k of Object.keys(body)) {
        if (allowedAirtableFields.has(k)) fieldsToUpdate[k] = toNumber((body as any)[k]);
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'Aucun champ valide fourni pour mise à jour' });
      }

      const villeName = await resolveCityName(villeReq);
      const filterByFormula = buildDateVilleFormula(date, villeName);
      if (!filterByFormula) return res.status(400).json({ error: 'Paramètre date invalide' });

    const found = await base(TABLE_NAME).select({ view: VIEW_NAME, filterByFormula, pageSize: 1 }).all();
    if (!found || found.length === 0) {
      // Créer un nouvel enregistrement si aucune statistique n'existe pour ce mois/ville
      const monthYear = `${String(new Date(canonical).getMonth() + 1).padStart(2, '0')}/${new Date(canonical).getFullYear()}`;
      const dateVilleEpicu = `${monthYear} - ${villeName}`;
      
      const fieldsToCreate: any = {
        'Date - ville EPICU': dateVilleEpicu,
        'Mois-Année': canonical,
        ...fieldsToUpdate
      };

      // Ajouter le nom de ville seulement s'il n'est pas null
      if (villeName) {
        fieldsToCreate['Ville EPICU'] = villeName;
      }

      const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);
      if (!created || created.length === 0) return res.status(500).json({ error: 'Échec création Airtable' });

      const u = created[0];
      return res.status(200).json({ id: u.id, fields: u.fields });
    }

    const record = found[0];
    const updated = await base(TABLE_NAME).update([{ id: record.id, fields: fieldsToUpdate }]);
    if (!updated || updated.length === 0) return res.status(500).json({ error: 'Échec mise à jour Airtable' });

    const u = updated[0];
    return res.status(200).json({ id: u.id, fields: u.fields });
    }

    // GET
    const ville = (req.query.ville as string) || 'all';
    const date = (req.query.date as string) || '';

    const canonical = canonicalFirstOfMonth(date);
    if (!canonical) {
      return res.status(400).json({ error: 'Paramètre date invalide. Format attendu: mm-yyyy' });
    }

    // Agrégation sur toutes les villes de l'utilisateur si ville === 'all'
    if (ville === 'all') {
      const userId = await requireValidAccessToken(req, res);
      if (!userId) return;

      let linkedIds: string[] = [];
      try {
        const userRec = await base('COLLABORATEURS').find(userId);
        const linked = userRec.get('Ville EPICU');
        if (linked) {
          if (Array.isArray(linked)) linkedIds = linked;
          else if (typeof linked === 'string') linkedIds = [linked];
        }
      } catch (e) {
        return res.status(500).json({ error: 'Impossible de récupérer les villes de l\'utilisateur' });
      }

      if (linkedIds.length === 0) {
        return res.status(200).json({
          date,
          ville: 'all',
          totalAbonnes: 0,
          totalVues: 0,
          totalProspectsSignes: 0,
          totalProspectsVus: 0,
          tauxConversion: 0,
          postsPublies: 0,
          montantCadeau: 0,
          abonnesFood: 0,
          abonnesShop: 0,
          abonnesTravel: 0,
          abonnesFun: 0,
          abonnesBeauty: 0,
          vuesFood: 0,
          vuesShop: 0,
          vuesTravel: 0,
          vuesFun: 0,
          vuesBeauty: 0,
        });
      }

      // Résoudre les noms de ville
      const formulaIds = `OR(${linkedIds.map((id) => `RECORD_ID()="${escAirtable(id)}"`).join(',')})`;
      const cityRecs = await base('VILLES EPICU').select({ fields: ['Ville EPICU'], filterByFormula: formulaIds }).all();
      const cityNames = cityRecs.map((cr: any) => String(cr.get('Ville EPICU'))).filter(Boolean);

      let agg = {
        date,
        ville: 'all',
        totalAbonnes: 0,
        totalVues: 0,
        totalProspectsSignes: 0,
        totalProspectsVus: 0,
        tauxConversion: 0,
        postsPublies: 0,
        montantCadeau: 0,
        abonnesFood: 0,
        abonnesShop: 0,
        abonnesTravel: 0,
        abonnesFun: 0,
        abonnesBeauty: 0,
        vuesFood: 0,
        vuesShop: 0,
        vuesTravel: 0,
        vuesFun: 0,
        vuesBeauty: 0,
      } as any;

      let totalClients = 0;
      let totalProspects = 0;

      for (const name of cityNames) {
        const filterByFormula = buildDateVilleFormula(date, name);
        if (!filterByFormula) continue;
        const recs = await base(TABLE_NAME).select({ view: VIEW_NAME, filterByFormula, pageSize: 5 }).all();
        if (!recs || recs.length === 0) continue;

        // Additionner toutes les lignes éventuelles
        for (const r of recs) {
          const payload = mapRecordToPayload(r);
          agg.totalAbonnes += payload.totalAbonnes;
          agg.totalVues += payload.totalVues;
          agg.totalProspectsSignes += payload.totalProspectsSignes;
          agg.totalProspectsVus += payload.totalProspectsVus;
          agg.postsPublies += payload.postsPublies;
          agg.montantCadeau += payload.montantCadeau;
          totalClients += payload.totalProspectsSignes;
          totalProspects += payload.totalProspectsVus;
          agg.abonnesFood += payload.abonnesFood;
          agg.abonnesShop += payload.abonnesShop;
          agg.abonnesTravel += payload.abonnesTravel;
          agg.abonnesFun += payload.abonnesFun;
          agg.abonnesBeauty += payload.abonnesBeauty;
          agg.vuesFood += payload.vuesFood;
          agg.vuesShop += payload.vuesShop;
          agg.vuesTravel += payload.vuesTravel;
          agg.vuesFun += payload.vuesFun;
          agg.vuesBeauty += payload.vuesBeauty;
        }
      }

      agg.tauxConversion = roundTo2(totalProspects > 0 ? (totalClients / totalProspects) * 100 : 0);
      return res.status(200).json(agg);
    }

    // Ville spécifique
    const villeName = await resolveCityName(ville);
    const filterByFormula = buildDateVilleFormula(date, villeName);
    if (!filterByFormula) return res.status(400).json({ error: 'Paramètre date invalide' });

    const found = await base(TABLE_NAME).select({
      view: VIEW_NAME,
      filterByFormula,
      pageSize: 1,
    }).all();

    if (!found || found.length === 0) {
      // Retourner des valeurs par défaut si aucune statistique n'existe
      return res.status(200).json({
        date,
        ville: villeName,
        dateVilleEpicu: null,
        moisAnnee: null,
        villeEpicu: villeName,
        totalAbonnes: 0,
        totalVues: 0,
        totalProspectsVus: 0,
        totalProspectsSignes: 0,
        tauxConversion: 0,
        postsPublies: 0,
        abonnesFood: 0,
        abonnesShop: 0,
        abonnesTravel: 0,
        abonnesFun: 0,
        abonnesBeauty: 0,
        vuesFood: 0,
        vuesShop: 0,
        vuesTravel: 0,
        vuesFun: 0,
        vuesBeauty: 0,
        montantCadeau: 0,
      });
    }

    const rec = found[0];
    const payload = mapRecordToPayload(rec);
    return res.status(200).json({ date, ville: villeName, ...payload });
  } catch (error: any) {
    console.error('Airtable error (data-ville):', error?.message || error);
    return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
  }
}


