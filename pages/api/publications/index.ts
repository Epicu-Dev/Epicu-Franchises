import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';
const TABLE_NAME = 'HISTORIQUE DE PUBLICATIONS';
const VIEW_NAME = 'Grid view';

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
        // POST: créer une publication
        if (req.method === 'POST') {
            try {
                const body = req.body || {};

                // Auth
                const userId = await requireValidAccessToken(req, res);
                if (!userId) return;

                const fields: any = {};
                // relations: ÉTABLISSEMENTS, Catégorie, Ville EPICU
                try {
                    const rawEtab = body.etablissement ?? body.etablissements ?? body['ÉTABLISSEMENTS'] ?? body.etablissementId ?? body.etablissement_id;
                    if (rawEtab !== undefined) {
                        const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
                        const etabId = await ensureRelatedRecord('ÉTABLISSEMENTS', candidate, ["Nom de l'établissement", 'Name']);
                        if (etabId) fields['ÉTABLISSEMENTS'] = [etabId]; else fields['ÉTABLISSEMENTS'] = [];
                    } else {
                        // Établissement obligatoire
                        return res.status(400).json({ error: 'Établissement obligatoire' });
                    }

                    const rawCat = body.categorie ?? body.category ?? body['Catégorie'] ?? body['CATÉGORIE'];
                    if (rawCat !== undefined) {
                        const values = Array.isArray(rawCat) ? rawCat.slice(0, 2) : [rawCat];
                        const ids: string[] = [];
                        for (const v of values) {
                            const id = await ensureRelatedRecord('Catégories', v, ['Name']);
                            if (id) ids.push(id);
                        }
                        fields['Catégorie'] = ids;
                    }

                    const rawVille = body.villeEpicu ?? body['Ville EPICU'] ?? body.ville ?? body.ville_epicu;
                    if (rawVille !== undefined) {
                        const candidate = Array.isArray(rawVille) ? rawVille[0] : rawVille;
                        const villeId = await ensureRelatedRecord('VILLES EPICU', candidate, ['Ville EPICU', 'Ville', 'Name']);
                        if (villeId) fields['Ville EPICU'] = [villeId]; else fields['Ville EPICU'] = [];
                    }
                } catch (e) {
                    // ignore relation resolution errors here, proceed with other fields
                    console.warn('relations resolve error (POST publications)', e);
                }
                // On accepte les clés en camelCase ou en noms de champs Airtable
                if (body.montantSponsorisation !== undefined) fields['Montant de la sponsorisation'] = body.montantSponsorisation;
                if (body['Montant de la sponsorisation'] !== undefined) fields['Montant de la sponsorisation'] = body['Montant de la sponsorisation'];
                if (body.datePublication !== undefined) fields['Date de publication'] = body.datePublication;
                if (body['Date de publication'] !== undefined) fields['Date de publication'] = body['Date de publication'];

                if (body.montantAddition !== undefined) fields['Montant de l\'addition'] = body.montantAddition;
                if (body['Montant de l\'addition'] !== undefined) fields['Montant de l\'addition'] = body['Montant de l\'addition'];

                if (body.nombreAbonnes !== undefined) fields['Nbre d\'abonnés fait gagner au client'] = body.nombreAbonnes;
                if (body['Nbre d\'abonnés fait gagner au client'] !== undefined) fields['Nbre d\'abonnés fait gagner au client'] = body['Nbre d\'abonnés fait gagner au client'];

                if (body.cadeauGerant !== undefined) fields['Cadeau du gérant pour le jeu concours'] = body.cadeauGerant;
                if (body['Cadeau du gérant pour le jeu concours'] !== undefined) fields['Cadeau du gérant pour le jeu concours'] = body['Cadeau du gérant pour le jeu concours'];

                if (body.montantCadeau !== undefined) fields['Montant du cadeau'] = body.montantCadeau;
                if (body['Montant du cadeau'] !== undefined) fields['Montant du cadeau'] = body['Montant du cadeau'];

                if (body.tirageEffectue !== undefined) fields['Tirage effectué'] = body.tirageEffectue;
                if (body['Tirage effectué'] !== undefined) fields['Tirage effectué'] = body['Tirage effectué'];

                if (body.commentaire !== undefined) fields['Commentaire'] = body.commentaire;
                if (body['Commentaire'] !== undefined) fields['Commentaire'] = body['Commentaire'];

                if (body.vues !== undefined) fields['📊 Nombre de vues'] = body.vues;
                if (body['📊 Nombre de vues'] !== undefined) fields['📊 Nombre de vues'] = body['📊 Nombre de vues'];

                if (body.likes !== undefined) fields['❤️ Likes'] = body.likes;
                if (body['❤️ Likes'] !== undefined) fields['❤️ Likes'] = body['❤️ Likes'];

                if (body.partages !== undefined) fields['🔁 Partages'] = body.partages;
                if (body['🔁 Partages'] !== undefined) fields['🔁 Partages'] = body['🔁 Partages'];

                if (body.enregistrements !== undefined) fields['📌 Enregistrements'] = body.enregistrements;
                if (body['📌 Enregistrements'] !== undefined) fields['📌 Enregistrements'] = body['📌 Enregistrements'];

                if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Aucun champ fourni pour la création' });
                const created = await base(TABLE_NAME).create([{ fields }]);
                return res.status(201).json({ id: created[0].id, fields: created[0].fields });
            } catch (err: any) {
                console.error('publications POST error', err);
                return res.status(500).json({ error: 'Erreur création publication', details: err?.message || String(err) });
            }
        }

        // PATCH: modifier une publication existante (id requis)
        if (req.method === 'PATCH') {
            try {
                const body = req.body || {};
                const id = (req.query.id as string) || body.id;
                if (!id) return res.status(400).json({ error: 'id requis pour PATCH' });

                const userId = await requireValidAccessToken(req, res);
                if (!userId) return;

                // Vérifier que l'enregistrement existe
                let existing: any = null;
                try {
                    existing = await base(TABLE_NAME).find(id);
                } catch (e) {
                    return res.status(404).json({ error: 'Publication introuvable' });
                }
                const fields: any = {};
                // relations: ÉTABLISSEMENTS, Catégorie, Ville EPICU (PATCH)
                try {
                    const rawEtab = body.etablissement ?? body.etablissements ?? body['ÉTABLISSEMENTS'] ?? body.etablissementId ?? body.etablissement_id;
                    if (rawEtab !== undefined) {
                        const candidate = Array.isArray(rawEtab) ? rawEtab[0] : rawEtab;
                        const etabId = await ensureRelatedRecord('ÉTABLISSEMENTS', candidate, ["Nom de l'établissement", 'Name']);
                        if (etabId) fields['ÉTABLISSEMENTS'] = [etabId]; else fields['ÉTABLISSEMENTS'] = [];
                    } else {
                        // Établissement obligatoire
                        return res.status(400).json({ error: 'Établissement obligatoire' });
                    }

                    const rawCat = body.categorie ?? body.category ?? body['Catégorie'] ?? body['CATÉGORIE'];
                    if (rawCat !== undefined) {
                        const values = Array.isArray(rawCat) ? rawCat.slice(0, 2) : [rawCat];
                        const ids: string[] = [];
                        for (const v of values) {
                            const id = await ensureRelatedRecord('Catégories', v, ['Name']);
                            if (id) ids.push(id);
                        }
                        fields['Catégorie'] = ids;
                    }

                    const rawVille = body.villeEpicu ?? body['Ville EPICU'] ?? body.ville ?? body.ville_epicu;
                    if (rawVille !== undefined) {
                        const candidate = Array.isArray(rawVille) ? rawVille[0] : rawVille;
                        const villeId = await ensureRelatedRecord('VILLES EPICU', candidate, ['Ville EPICU', 'Ville', 'Name']);
                        if (villeId) fields['Ville EPICU'] = [villeId]; else fields['Ville EPICU'] = [];
                    }
                } catch (e) {
                    console.warn('relations resolve error (PATCH publications)', e);
                }
                if (body.montantSponsorisation !== undefined) fields['Montant de la sponsorisation'] = body.montantSponsorisation;
                if (body['Montant de la sponsorisation'] !== undefined) fields['Montant de la sponsorisation'] = body['Montant de la sponsorisation'];
                if (body.datePublication !== undefined) fields['Date de publication'] = body.datePublication;
                if (body['Date de publication'] !== undefined) fields['Date de publication'] = body['Date de publication'];

                if (body.montantAddition !== undefined) fields['Montant de l\'addition'] = body.montantAddition;
                if (body['Montant de l\'addition'] !== undefined) fields['Montant de l\'addition'] = body['Montant de l\'addition'];

                if (body.nombreAbonnes !== undefined) fields['Nbre d\'abonnés fait gagner au client'] = body.nombreAbonnes;
                if (body['Nbre d\'abonnés fait gagner au client'] !== undefined) fields['Nbre d\'abonnés fait gagner au client'] = body['Nbre d\'abonnés fait gagner au client'];

                if (body.cadeauGerant !== undefined) fields['Cadeau du gérant pour le jeu concours'] = body.cadeauGerant;
                if (body['Cadeau du gérant pour le jeu concours'] !== undefined) fields['Cadeau du gérant pour le jeu concours'] = body['Cadeau du gérant pour le jeu concours'];

                if (body.montantCadeau !== undefined) fields['Montant du cadeau'] = body.montantCadeau;
                if (body['Montant du cadeau'] !== undefined) fields['Montant du cadeau'] = body['Montant du cadeau'];

                if (body.tirageEffectue !== undefined) fields['Tirage effectué'] = body.tirageEffectue;
                if (body['Tirage effectué'] !== undefined) fields['Tirage effectué'] = body['Tirage effectué'];

                if (body.commentaire !== undefined) fields['Commentaire'] = body.commentaire;
                if (body['Commentaire'] !== undefined) fields['Commentaire'] = body['Commentaire'];

                if (body.vues !== undefined) fields['📊 Nombre de vues'] = body.vues;
                if (body['📊 Nombre de vues'] !== undefined) fields['📊 Nombre de vues'] = body['📊 Nombre de vues'];

                if (body.likes !== undefined) fields['❤️ Likes'] = body.likes;
                if (body['❤️ Likes'] !== undefined) fields['❤️ Likes'] = body['❤️ Likes'];

                if (body.partages !== undefined) fields['🔁 Partages'] = body.partages;
                if (body['🔁 Partages'] !== undefined) fields['🔁 Partages'] = body['🔁 Partages'];

                if (body.enregistrements !== undefined) fields['📌 Enregistrements'] = body.enregistrements;
                if (body['📌 Enregistrements'] !== undefined) fields['📌 Enregistrements'] = body['📌 Enregistrements'];

                if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
                const updated = await base(TABLE_NAME).update([{ id, fields }]);
                return res.status(200).json({ id: updated[0].id, fields: updated[0].fields });
            } catch (err: any) {
                console.error('publications PATCH error', err);
                return res.status(500).json({ error: 'Erreur mise à jour publication', details: err?.message || String(err) });
            }
        }

        // GET: lister les publications pour un établissement
        if (req.method === 'GET') {
            try {
                const etab = (req.query.etablissement as string) || (req.query.etab as string) || (req.query.est as string) || '';
                if (!etab) return res.status(400).json({ error: 'Paramètre etablissement requis' });

                // Resolve etablissement id or name
                let etabId: string | null = null;
                if (/^rec/i.test(etab)) {
                    etabId = etab;
                } else {
                    // search by name in ÉTABLISSEMENTS
                    const esc = String(etab).replace(/"/g, '\\"');
                    const found = await base('ÉTABLISSEMENTS').select({ filterByFormula: `LOWER({Nom de l\'établissement}) = "${String(etab).toLowerCase().replace(/"/g, '\\"')}"`, maxRecords: 1 }).firstPage();
                    if (found && found.length > 0) etabId = found[0].id;
                }

                if (!etabId) return res.status(404).json({ error: 'Établissement introuvable' });

                // Récupérer publications liées (champ ÉTABLISSEMENTS contient l'id)
                const formula = `FIND("${etabId}", ARRAYJOIN({ÉTABLISSEMENTS}))`;
                const pubs = await base(TABLE_NAME).select({ view: VIEW_NAME, filterByFormula: formula, pageSize: 100 }).all();

                // Trier les publications par date de publication DESC
                const sortedPubs = Array.from(pubs).sort((a: any, b: any) => {
                    const dateA = a.get('Date de publication');
                    const dateB = b.get('Date de publication');
                    
                    // Si aucune date, mettre à la fin
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    
                    // Trier par date décroissante (plus récent en premier)
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });

                // For each publication, fetch related factures where PUBLICATIONS contains the pub id
                const results = await Promise.all(sortedPubs.map(async (p: any) => {
                    const pubId = p.id;
                    const pubFields: any = {
                        id: pubId,
                        nom: p.get('Nom publication'),
                        montantSponsorisation: p.get('Montant de la sponsorisation'),
                        datePublication: p.get('Date de publication'),
                        montantAddition: p.get("Montant de l'addition"),
                        nombreAbonnes: p.get('Nbre d\'abonnés fait gagner au client'),
                        cadeauGerant: p.get('Cadeau du gérant pour le jeu concours'),
                        montantCadeau: p.get('Montant du cadeau'),
                        tirageEffectue: p.get('Tirage effectué'),
                        commentaire: p.get('Commentaire'),
                        vues: p.get('📊 Nombre de vues'),
                        likes: p.get('❤️ Likes'),
                        partages: p.get('🔁 Partages'),
                        enregistrements: p.get('📌 Enregistrements'),
                        benefice: p.get('Bénéfice') ?? p.get('Bénéfice provenant de historique de publications') ?? p.get('Bénéfice provenant de historique de publications'),
                    };

                    // find invoices linked via PUBLICATIONS field
                    const factures = await base('FACTURES').select({ filterByFormula: `FIND("${pubId}", ARRAYJOIN({PUBLICATIONS}))`, fields: ['Date d\'échéance', 'Statut facture', 'Date d\'émission', 'Montant total brut', 'Montant total net', 'Montant payé', 'Restant dû', 'Date de paiement'], pageSize: 50 }).all();

                    const factList = (factures || []).map((f: any) => ({
                        id: f.id,
                        dateEcheance: f.get("Date d\'échéance"),
                        statut: f.get('Statut facture'),
                        dateEmission: f.get("Date d\'émission"),
                        montantTotalBrut: f.get('Montant total brut'),
                        montantTotalNet: f.get('Montant total net'),
                        montantPaye: f.get('Montant payé'),
                        restantDu: f.get('Restant dû'),
                        datePaiement: f.get('Date de paiement'),
                    }));

                    return { publication: pubFields, factures: factList };
                }));

                return res.status(200).json({ etablissement: etabId, results });
            } catch (err: any) {
                console.error('publications GET error', err);
                return res.status(500).json({ error: 'Erreur récupération publications', details: err?.message || String(err) });
            }
        }

        res.setHeader('Allow', ['POST', 'PATCH', 'GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error: any) {
        console.error('Airtable error (publications):', error?.message || error);
        res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
    }
}

