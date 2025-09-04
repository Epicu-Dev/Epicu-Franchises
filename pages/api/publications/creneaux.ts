import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'CALENDRIER PUBLICATIONS';
const VIEW_NAME = 'Toute les publications';

// helper: resolve or create a related record; returns record id or null
async function ensureRelatedRecord(tableName: string, candidateValue: any, candidateFields: string[]) {
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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // GET: lister les créneaux selon Catégorie (relation), Ville EPICU et date de début, avec offset & limit
        if (req.method === 'GET') {
            try {
                const category = (req.query.categorie as string) || (req.query.category as string) || (req.query.cat as string) || '';
                const ville = (req.query.ville as string) || (req.query.villeEpicu as string) || (req.query.ville_epicu as string) || '';
                const start = (req.query.start as string) || (req.query.date as string) || '';
                const offset = Number(req.query.offset || 0) || 0;
                const limit = Number(req.query.limit || 50) || 50;

                if (!start) return res.status(400).json({ error: 'Paramètre start (date de début) requis' });

                // normalize start to ISO date (keep input but protect quotes)
                const startEsc = String(start).replace(/"/g, '\\"');

                // resolve category id if provided
                let catId: string | null = null;
                if (category) {
                    if (/^rec/i.test(category)) catId = category;
                    else {
                        const found = await base('Catégories').select({ filterByFormula: `LOWER({Name}) = "${String(category).toLowerCase().replace(/"/g, '\\"')}"`, maxRecords: 1 }).firstPage();
                        if (found && found.length > 0) catId = found[0].id;
                    }
                }

                // resolve ville id if provided
                let villeId: string | null = null;
                if (ville) {
                    if (/^rec/i.test(ville)) villeId = ville;
                    else {
                        const found = await base('VILLES EPICU').select({ filterByFormula: `OR(LOWER({Ville EPICU}) = "${String(ville).toLowerCase().replace(/"/g, '\\"')}", LOWER({Ville}) = "${String(ville).toLowerCase().replace(/"/g, '\\"')}", LOWER({Name}) = "${String(ville).toLowerCase().replace(/"/g, '\\"')}")`, maxRecords: 1 }).firstPage();
                        if (found && found.length > 0) villeId = found[0].id;
                    }
                }

                // build formula parts
                const formulaParts: string[] = [];
                // category relation contains
                if (catId) formulaParts.push(`FIND("${catId}", ARRAYJOIN({Catégorie}))`);
                // ville relation contains
                if (villeId) formulaParts.push(`FIND("${villeId}", ARRAYJOIN({Ville EPICU}))`);
                // date >= start : use DATETIME_DIFF >= 0
                formulaParts.push(`DATETIME_DIFF({DATE}, DATETIME_PARSE("${startEsc}"), 'seconds') >= 0`);

                const filterFormula = formulaParts.length > 1 ? `AND(${formulaParts.join(',')})` : formulaParts[0];

                // fetch records; request only needed fields
                const fields = ['DATE', 'Catégorie', 'JOUR', 'Date de publication', 'HEURE', 'Statut de publication'];
                const records = await base(TABLE_NAME).select({ view: VIEW_NAME, filterByFormula: filterFormula, fields, pageSize: 100, sort: [{ field: 'DATE', direction: 'asc' }] }).all();

                // map to simple objects
                const mapped = records.map((r: any) => ({
                    id: r.id,
                    DATE: r.get('DATE'),
                    CATEGORIE: r.get('Catégorie'),
                    JOUR: r.get('JOUR'),
                    DATE_DE_PUBLICATION: r.get('Date de publication'),
                    HEURE: r.get('HEURE'),
                    STATUT_DE_PUBLICATION: r.get('Statut de publication'),
                }));

                const total = mapped.length;
                const sliced = mapped.slice(offset, offset + limit);

                return res.status(200).json({ total, offset, limit, results: sliced });
            } catch (err: any) {
                console.error('creneaux GET error', err);
                return res.status(500).json({ error: 'Erreur récupération créneaux', details: err?.message || String(err) });
            }
        }

        // PATCH: mettre à jour Statut de publication, Date de tournage, ÉTABLISSEMENT (relation)
        if (req.method === 'PATCH') {
            try {
                const body = req.body || {};
                const id = (req.query.id as string) || body.id;
                if (!id) return res.status(400).json({ error: 'id requis pour PATCH' });

                const userId = await requireValidAccessToken(req, res);
                if (!userId) return;

                // check exists
                let existing: any = null;
                try {
                    existing = await base(TABLE_NAME).find(id);
                } catch (e) {
                    return res.status(404).json({ error: 'Créneau introuvable' });
                }

                const fields: any = {};
                if (body.statutPublication !== undefined) fields['Statut de publication'] = body.statutPublication;
                if (body['Statut de publication'] !== undefined) fields['Statut de publication'] = body['Statut de publication'];

                if (body.dateTournage !== undefined) fields['Date de tournage'] = body.dateTournage;
                if (body['Date de tournage'] !== undefined) fields['Date de tournage'] = body['Date de tournage'];

                // établissement relation
                try {
                    const rawEtab = body.etablissement ?? body.etablissements ?? body['ÉTABLISSEMENTS'] ?? body.etablissementId ?? body.etablissement_id;
                    if (rawEtab !== undefined) {
                        const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
                        const etabId = await ensureRelatedRecord('ÉTABLISSEMENTS', candidate, ["Nom de l'établissement", 'Name']);
                        if (etabId) fields['ÉTABLISSEMENTS'] = [etabId]; else fields['ÉTABLISSEMENTS'] = [];
                    }
                } catch (e) {
                    console.warn('relations resolve error (PATCH creneaux)', e);
                }

                if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

                const updated = await base(TABLE_NAME).update([{ id, fields }]);
                return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
            } catch (err: any) {
                console.error('creneaux PATCH error', err);
                return res.status(500).json({ error: 'Erreur mise à jour créneau', details: err?.message || String(err) });
            }
        }

        res.setHeader('Allow', ['GET', 'PATCH']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error: any) {
        console.error('Airtable error (creneaux):', error?.message || error);
        res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
    }
}
