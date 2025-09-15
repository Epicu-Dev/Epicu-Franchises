import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';
import { Data } from '../../../types/data';

const TABLE_NAME = 'STATISTIQUES MENSUELLES';
const VIEW_NAME = 'Vue complète';

function escAirtable(s: string) {
	return s.replace(/"/g, '\\"');
}

function canonicalFirstOfMonth(date: string) {
	// Accepts formats: mm-yyyy, mm/yyyy, yyyy-mm-01, yyyy-mm
	if (/^[0-9]{2}-[0-9]{4}$/.test(date)) {
		const [mm, yyyy] = date.split('-');
		return `${yyyy}-${mm}-01`;
	}
	if (/^[0-9]{2}\/([0-9]{4})$/.test(date)) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const method = req.method || 'GET';

		if (method === 'PATCH') {
			const body = req.body || {};
			const ville = (body.ville as string) || (req.query.ville as string) || '';
			const date = (body.date as string) || (req.query.date as string) || '';

			if (!ville || ville === 'all') {
				return res.status(400).json({ error: 'Paramètre ville requis et ne peut pas être "all" pour PATCH' });
			}

			const canonical = canonicalFirstOfMonth(date);
			if (!canonical) {
				return res.status(400).json({ error: 'Paramètre date invalide. Format attendu: mm-yyyy' });
			}

			const userId = await requireValidAccessToken(req, res);
			if (!userId) return;
			const FIELD_MAP: Record<string, string> = {
				viewsFood: '📊 Vues 🟠 FOOD',
				abonnesFood: '📊 Abonnés 🟠 FOOD',
				abonnesShop: '📊 Abonnés 🟣 SHOP',
				vuesShop: '📊 Vues 🟣 SHOP',
				abonnesTravel: '📊 Abonnés 🟢 TRAVEL',
				vuesTravel: '📊 Vues 🟢 TRAVEL',
				abonnesFun: '📊 Abonnés 🔴 FUN',
				vuesFun: '📊 Vues 🔴 FUN',
				abonnesBeauty: '📊 Abonnés 🩷 BEAUTY',
				vuesBeauty: '📊 Vues 🩷 BEAUTY',
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

			let villeName: string | null = null;
			if (/^rec/i.test(ville)) {
				try {
					const cityRec = await base('VILLES EPICU').find(ville);
					const vn = cityRec.get('Ville EPICU');
					villeName = vn != null ? String(vn) : null;
				} catch (e) {
					console.warn('Impossible de récupérer le nom de la ville pour id', ville, e);
				}
			}

			const dateFormula = `{Mois-Année} = "${escAirtable(canonical)}"`;
			const filterFormula = villeName
				? `AND(${dateFormula}, {Ville EPICU} = "${escAirtable(villeName)}")`
				: `AND(${dateFormula}, FIND("${escAirtable(ville)}", ARRAYJOIN({Ville EPICU})))`;

			const found = await base(TABLE_NAME).select({ view: VIEW_NAME, filterByFormula: filterFormula, pageSize: 1 }).all();
			if (!found || found.length === 0) return res.status(404).json({ error: 'Aucune statistique trouvée pour ce mois/ville' });

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

		const fields = [
			'Mois-Année', 
			'Ville EPICU', 
			'📊 Total abonnés', 
			'📊 Total vues', 
			'📊 Prospects signés ds le mois', 
			'📊 Prospects vus ds le mois', 
			'📊 Tx de conversion',
			'📊 Vues 🟠 FOOD',
			'📊 Abonnés 🟠 FOOD',
			'📊 Abonnés 🟣 SHOP',
			'📊 Vues 🟣 SHOP',
			'📊 Abonnés 🟢 TRAVEL',
			'📊 Vues 🟢 TRAVEL',
			'📊 Abonnés 🔴 FUN',
			'📊 Vues 🔴 FUN',
			'📊 Abonnés 🩷 BEAUTY',
			'📊 Vues 🩷 BEAUTY',
			'Posts publiés',
			'Cumul de Montant du cadeau (à partir de HISTORIQUE DE PUBLICATIONS)'
		];

		let villeName: string | null = null;
		if (ville !== 'all' && /^rec/i.test(ville)) {
			try {
				const cityRec = await base('VILLES EPICU').find(ville);
				const vn = cityRec.get('Ville EPICU');
				villeName = vn != null ? String(vn) : null;
			} catch (e) {
				console.warn('Impossible de récupérer le nom de la ville pour id', ville, e);
			}
		}

		const dateFormula = `{Mois-Année} = "${escAirtable(canonical)}"`;
		const filterFormula =
			ville === 'all'
				? dateFormula
				: villeName
					? `AND(${dateFormula}, {Ville EPICU} = "${escAirtable(villeName)}")`
					: `AND(${dateFormula}, FIND("${escAirtable(ville)}", ARRAYJOIN({Ville EPICU})))`;

		const records = await base(TABLE_NAME).select({ view: VIEW_NAME, fields, filterByFormula: filterFormula, pageSize: 100 }).all();

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
				console.error('Erreur récupération villes utilisateur:', e);
				return res.status(500).json({ error: 'Impossible de récupérer les villes de l\'utilisateur' });
			}

			if (linkedIds.length === 0) {
				return res.status(200).json({ date, ville: 'all', totalAbonnes: 0, totalVues: 0, totalProspectsSignes: 0, totalProspectsVus: 0, tauxConversion: null, rawCount: 0 });
			}

			let totalAbonnes = 0;
			let totalVues = 0;
			let totalProspectsSignes = 0;
			let totalProspectsVus = 0;
			const txValues: number[] = [];
			let totalRecords = 0;
			
			// Données détaillées par catégorie
			let viewsFood = 0;
			let abonnesFood = 0;
			let abonnesShop = 0;
			let vuesShop = 0;
			let abonnesTravel = 0;
			let vuesTravel = 0;
			let abonnesFun = 0;
			let vuesFun = 0;
			let abonnesBeauty = 0;
			let vuesBeauty = 0;
			
			// Données supplémentaires
			let postsPublies = 0;
			let cumulMontantCadeau = 0;

			const cityNameById = new Map<string, string>();
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

			const cityNames: string[] = linkedIds.map((id) => cityNameById.get(id)).filter((v): v is string => Boolean(v));

			if (cityNames.length > 0) {
				await Promise.all(
					cityNames.map(async (name) => {
						const formula = `AND(${dateFormula}, {Ville EPICU} = "${escAirtable(name)}")`;
						const recs = await base(TABLE_NAME).select({ view: VIEW_NAME, fields, filterByFormula: formula, pageSize: 100 }).all();
						totalRecords += recs.length;
						recs.forEach((r: any) => {
							totalAbonnes += toNumber(r.get('📊 Total abonnés'));
							totalVues += toNumber(r.get('📊 Total vues'));
							totalProspectsSignes += toNumber(r.get('📊 Prospects signés ds le mois'));
							totalProspectsVus += toNumber(r.get('📊 Prospects vus ds le mois'));
							const tx = r.get('📊 Tx de conversion');
							if (tx !== undefined && tx !== null && tx !== '') txValues.push(toNumber(tx));
							
							// Agrégation des données détaillées par catégorie
							viewsFood += toNumber(r.get('📊 Vues 🟠 FOOD'));
							abonnesFood += toNumber(r.get('📊 Abonnés 🟠 FOOD'));
							abonnesShop += toNumber(r.get('📊 Abonnés 🟣 SHOP'));
							vuesShop += toNumber(r.get('📊 Vues 🟣 SHOP'));
							abonnesTravel += toNumber(r.get('📊 Abonnés 🟢 TRAVEL'));
							vuesTravel += toNumber(r.get('📊 Vues 🟢 TRAVEL'));
							abonnesFun += toNumber(r.get('📊 Abonnés 🔴 FUN'));
							vuesFun += toNumber(r.get('📊 Vues 🔴 FUN'));
							abonnesBeauty += toNumber(r.get('📊 Abonnés 🩷 BEAUTY'));
							vuesBeauty += toNumber(r.get('📊 Vues 🩷 BEAUTY'));
							
							// Agrégation des données supplémentaires
							postsPublies += toNumber(r.get('📊 Posts publiés'));
							cumulMontantCadeau += toNumber(r.get('📊 Cumul de Montant du cadeau (à partir de HISTORIQUE DE PUBLICATIONS)'));
						});
					})
				);
			} else {
				await Promise.all(
					linkedIds.map(async (vid) => {
						const formula = `AND(${dateFormula}, FIND("${escAirtable(vid)}", ARRAYJOIN({Ville EPICU})))`;
						const recs = await base(TABLE_NAME).select({ view: VIEW_NAME, fields, filterByFormula: formula, pageSize: 100 }).all();
						totalRecords += recs.length;
						recs.forEach((r: any) => {
							totalAbonnes += toNumber(r.get('📊 Total abonnés'));
							totalVues += toNumber(r.get('📊 Total vues'));
							totalProspectsSignes += toNumber(r.get('📊 Prospects signés ds le mois'));
							totalProspectsVus += toNumber(r.get('📊 Prospects vus ds le mois'));
							const tx = r.get('📊 Tx de conversion');
							if (tx !== undefined && tx !== null && tx !== '') txValues.push(toNumber(tx));
							
							// Agrégation des données détaillées par catégorie
							viewsFood += toNumber(r.get('📊 Vues 🟠 FOOD'));
							abonnesFood += toNumber(r.get('📊 Abonnés 🟠 FOOD'));
							abonnesShop += toNumber(r.get('📊 Abonnés 🟣 SHOP'));
							vuesShop += toNumber(r.get('📊 Vues 🟣 SHOP'));
							abonnesTravel += toNumber(r.get('📊 Abonnés 🟢 TRAVEL'));
							vuesTravel += toNumber(r.get('📊 Vues 🟢 TRAVEL'));
							abonnesFun += toNumber(r.get('📊 Abonnés 🔴 FUN'));
							vuesFun += toNumber(r.get('📊 Vues 🔴 FUN'));
							abonnesBeauty += toNumber(r.get('📊 Abonnés 🩷 BEAUTY'));
							vuesBeauty += toNumber(r.get('📊 Vues 🩷 BEAUTY'));
							
							// Agrégation des données supplémentaires
							postsPublies += toNumber(r.get('📊 Posts publiés'));
							cumulMontantCadeau += toNumber(r.get('📊 Cumul de Montant du cadeau (à partir de HISTORIQUE DE PUBLICATIONS)'));
						});
					})
				);
			}

			let tauxConversion: number | null = null;
			if (totalProspectsVus > 0) {
				tauxConversion = +(totalProspectsSignes / totalProspectsVus * 100).toFixed(2);
			} else if (txValues.length > 0) {
				const sumTx = txValues.reduce((a, b) => a + b, 0);
				tauxConversion = +(sumTx / txValues.length).toFixed(2);
			}

			const responseData: Partial<Data> = { 
				date, 
				ville: 'all', 
				totalAbonnes, 
				totalVues, 
				totalProspectsSignes, 
				totalProspectsVus, 
				tauxConversion, 
				rawCount: totalRecords,
				viewsFood,
				abonnesFood,
				abonnesShop,
				vuesShop,
				abonnesTravel,
				vuesTravel,
				abonnesFun,
				vuesFun,
				abonnesBeauty,
				vuesBeauty,
				postsPublies,
				cumulMontantCadeau
			};
			return res.status(200).json(responseData);
		}

		if (!records || records.length === 0) return res.status(404).json({ error: 'Aucune statistique trouvée pour ce filtre' });

		const r = records[0];
		const result: Partial<Data> = {
			id: r.id,
			date,
			ville,
			moisAnnee: String(r.get('Mois-Année') || ''),
			villeEpicu: String(r.get('Ville EPICU') || ''),
			totalAbonnes: toNumber(r.get('📊 Total abonnés')),
			totalVues: toNumber(r.get('📊 Total vues')),
			totalProspectsSignes: toNumber(r.get('📊 Prospects signés ds le mois')),
			totalProspectsVus: toNumber(r.get('📊 Prospects vus ds le mois')),
			tauxConversion: toNumber(r.get('📊 Tx de conversion')),
			prospectsSignesDsLeMois: toNumber(r.get('📊 Prospects signés ds le mois')),
			tauxDeConversion: toNumber(r.get('📊 Tx de conversion')),
			viewsFood: toNumber(r.get('📊 Vues 🟠 FOOD')),
			abonnesFood: toNumber(r.get('📊 Abonnés 🟠 FOOD')),
			abonnesShop: toNumber(r.get('📊 Abonnés 🟣 SHOP')),
			vuesShop: toNumber(r.get('📊 Vues 🟣 SHOP')),
			abonnesTravel: toNumber(r.get('📊 Abonnés 🟢 TRAVEL')),
			vuesTravel: toNumber(r.get('📊 Vues 🟢 TRAVEL')),
			abonnesFun: toNumber(r.get('📊 Abonnés 🔴 FUN')),
			vuesFun: toNumber(r.get('📊 Vues 🔴 FUN')),
			abonnesBeauty: toNumber(r.get('📊 Abonnés 🩷 BEAUTY')),
			vuesBeauty: toNumber(r.get('📊 Vues 🩷 BEAUTY')),
			postsPublies: toNumber(r.get('📊 Posts publiés')),
			cumulMontantCadeau: toNumber(r.get('📊 Cumul de Montant du cadeau (à partir de HISTORIQUE DE PUBLICATIONS)')),
		};

		return res.status(200).json(result);
	} catch (error: any) {
		console.error('Airtable error (data):', error?.message || error);
		return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
	}
}

