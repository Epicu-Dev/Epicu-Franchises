import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'STATISTIQUES MENSUELLES';
const VIEW_NAME = 'Vue complète';

function escAirtable(s: string) {
	return s.replace(/"/g, '\\"');
}

function toNumber(v: any) {
	if (v === null || v === undefined || v === '') return 0;
	if (typeof v === 'number') return v;
	if (typeof v === 'string') {
		// remove spaces, non-breaking spaces, replace comma decimal
		const cleaned = v.replace(/\s+/g, '').replace(/,/g, '.');
		const n = parseFloat(cleaned);
		return isNaN(n) ? 0 : n;
	}
	return 0;
}

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
	try {
		const ville = (req.query.ville as string) || 'all';
		const date = (req.query.date as string) || '';

		// date format mm-yyyy
		const dateMatch = /^\d{2}-\d{4}$/.test(date);
		if (!dateMatch) {
			return res.status(400).json({ error: 'Paramètre date invalide. Format attendu: mm-yyyy' });
		}

		const fields = [
			'Mois-Année',
			'Ville EPICU',
			'📊 Total abonnés',
			'📊 Total vues',
			'📊 Prospects signés ds le mois',
			'📊 Prospects vus ds le mois',
			'📊 Tx de conversion',
		];

		// Construire filterByFormula selon ville
		let filterFormula: string | undefined;

		// Si le paramètre `ville` est un record id (ex: rec...), résoudre le nom
		// car ARRAYJOIN({Ville EPICU}) et les comparaisons sur {Ville EPICU} utilisent
		// le libellé (nom) de la ville et non le record id.
		let villeName: string | null = null;
		if (ville !== 'all' && typeof ville === 'string' && /^rec/i.test(ville)) {
			try {
				const cityRec = await base('VILLES EPICU').find(ville);
				const vn = cityRec.get('Ville EPICU');
				villeName = vn != null ? String(vn) : null;
			} catch (e) {
				console.warn('Impossible de récupérer le nom de la ville pour id', ville, e);
			}
		}

		if (ville === 'all') {
			filterFormula = `{Mois-Année} = "${escAirtable(date)}"`;
		} else if (villeName) {
			// Filtre par nom exact dans le champ linked records
			filterFormula = `AND({Mois-Année} = "${escAirtable(date)}", {Ville EPICU} = "${escAirtable(villeName)}")`;
		} else {
			// Fallback : tenter de chercher l'id dans ARRAYJOIN (ancien comportement)
			filterFormula = `AND({Mois-Année} = "${escAirtable(date)}", FIND("${escAirtable(ville)}", ARRAYJOIN({Ville EPICU})))`;
		}

		const selectOptions: any = {
			view: VIEW_NAME,
			fields,
			filterByFormula: filterFormula,
			pageSize: 100,
		};

		const records = await base(TABLE_NAME).select(selectOptions).all();

		if (ville === 'all') {
			// Récupérer l'utilisateur via access token et ses villes liées
			const userId = await requireValidAccessToken(req, res);
			if (!userId) return; // requireValidAccessToken a déjà répondu (403/500)

			// Récupérer le collaborateur pour lister ses villes Epicu (record ids)
			let linkedIds: string[] = [];
			try {
				const userRec = await base('COLLABORATEURS').find(userId);
				const linked = userRec.get('Ville EPICU');
				if (linked) {
					if (Array.isArray(linked)) linkedIds = linked;
					else if (typeof linked === 'string') linkedIds = [linked];
				}
			} catch (e) {
				console.error('Erreur récupération villes utilisateur:', e);
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
					tauxConversion: null,
					rawCount: 0,
				});
			}

			// Résoudre les linkedIds (record ids) vers leurs noms via la table VILLES EPICU
			let totalAbonnes = 0;
			let totalVues = 0;
			let totalProspectsSignes = 0;
			let totalProspectsVus = 0;
			let txValues: number[] = [];
			let totalRecords = 0;

			let cityNameById = new Map<string, string>();
			try {
				if (linkedIds.length > 0) {
					const formula = `OR(${linkedIds.map((id) => `RECORD_ID()="${escAirtable(id)}"`).join(',')})`;
					const cityRecs = await base('VILLES EPICU').select({ fields: ['Ville EPICU'], filterByFormula: formula }).all();
					cityRecs.forEach((cr: any) => {
						const n = cr.get('Ville EPICU');
						if (n != null) cityNameById.set(cr.id, String(n));
					});
				}
			} catch (e) {
				console.warn('Impossible de résoudre les noms des villes (VILLES EPICU)', e);
			}

			// Préparer la liste de noms à interroger (dans l'ordre des linkedIds)
			const cityNames: string[] = linkedIds.map(id => cityNameById.get(id)).filter((v): v is string => Boolean(v));

			if (cityNames.length > 0) {
				// Requêter par nom de ville (champ linked contient le libellé)
				await Promise.all(cityNames.map(async (name) => {
					const formula = `AND({Mois-Année} = "${escAirtable(date)}", {Ville EPICU} = "${escAirtable(name)}")`;
					const recs = await base(TABLE_NAME).select({ view: VIEW_NAME, fields, filterByFormula: formula, pageSize: 100 }).all();
					totalRecords += recs.length;
					recs.forEach((r: any) => {
						totalAbonnes += toNumber(r.get('📊 Total abonnés'));
						totalVues += toNumber(r.get('📊 Total vues'));
						totalProspectsSignes += toNumber(r.get('📊 Prospects signés ds le mois'));
						totalProspectsVus += toNumber(r.get('📊 Prospects vus ds le mois'));
						const tx = r.get('📊 Tx de conversion');
						if (tx !== undefined && tx !== null && tx !== '') txValues.push(toNumber(tx));
					});
				}));
			} else {
				// Fallback si aucun nom résolu : utilisation de l'ancien behaviour basé sur record id dans ARRAYJOIN
				await Promise.all(
					linkedIds.map(async (vid) => {
						const formula = `AND({Mois-Année} = "${escAirtable(date)}", FIND("${escAirtable(vid)}", ARRAYJOIN({Ville EPICU})))`;
						const recs = await base(TABLE_NAME)
							.select({ view: VIEW_NAME, fields, filterByFormula: formula, pageSize: 100 })
							.all();
						totalRecords += recs.length;
						recs.forEach((r: any) => {
							totalAbonnes += toNumber(r.get('📊 Total abonnés'));
							totalVues += toNumber(r.get('📊 Total vues'));
							totalProspectsSignes += toNumber(r.get('📊 Prospects signés ds le mois'));
							totalProspectsVus += toNumber(r.get('📊 Prospects vus ds le mois'));
							const tx = r.get('📊 Tx de conversion');
							if (tx !== undefined && tx !== null && tx !== '') txValues.push(toNumber(tx));
						});
					})
				);
			}

			// Calcul du taux de conversion agrégé
			let tauxConversion = null;
			if (totalProspectsVus > 0) {
				tauxConversion = +(totalProspectsSignes / totalProspectsVus * 100).toFixed(2);
			} else if (txValues.length > 0) {
				const sumTx = txValues.reduce((a, b) => a + b, 0);
				tauxConversion = +(sumTx / txValues.length).toFixed(2);
			}

			return res.status(200).json({
				date,
				ville: 'all',
				totalAbonnes,
				totalVues,
				totalProspectsSignes,
				totalProspectsVus,
				tauxConversion,
				rawCount: totalRecords,
			});
		}

		// cas ville = record id -> si plusieurs linked records possible, on renvoie la première correspondance
		if (records.length === 0) {
			return res.status(404).json({ error: 'Aucune statistique trouvée pour ce filtre' });
		}

		// On prend le premier record
		const r = records[0];

		const result = {
			id: r.id,
			moisAnnee: r.get('Mois-Année'),
			villeEpicu: r.get('Ville EPICU'),
			totalAbonnes: toNumber(r.get('📊 Total abonnés')),
			totalVues: toNumber(r.get('📊 Total vues')),
			prospectsSignesDsLeMois: toNumber(r.get('📊 Prospects signés ds le mois')),
			tauxDeConversion: (r.get('📊 Tx de conversion') ?? r.get('Taux de conversion')) || null,
		};

		return res.status(200).json(result);
	} catch (error: any) {
		console.error('Airtable error (data):', error?.message || error);
		return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
	}
}

