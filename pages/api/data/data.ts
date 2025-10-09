import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';
import { Data } from '../../../types/data';
import { 
  getStatisticsMapping, 
  convertFrontendFilters, 
  StatisticType, 
  TimeFilter, 
  LocationFilter 
} from '../../../utils/statistics-mapping';

// Configuration par défaut pour la compatibilité
const DEFAULT_TABLE_NAME = 'STATISTIQUES MENSUELLES';
const DEFAULT_VIEW_NAME = 'Vue complète';

function escAirtable(s: string) {
	return s.replace(/"/g, '\\"');
}

function canonicalFirstOfMonth(date: string) {
	// Accepts formats: mm-yyyy, mm/yyyy, yyyy-mm-01, yyyy-mm, yyyy
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
	if (/^[0-9]{4}$/.test(date)) {
		// Format yyyy - utilise janvier de cette année
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

/**
 * Récupère les statistiques en utilisant le mapping dynamique
 */
async function fetchStatisticsWithMapping(
	statisticType: StatisticType,
	timeFilter: TimeFilter,
	locationFilter: LocationFilter,
	date: string,
	ville: string
): Promise<any> {
	const mapping = getStatisticsMapping(statisticType, timeFilter, locationFilter);
	
	if (!mapping || !mapping.available) {
		return null;
	}

	const canonical = canonicalFirstOfMonth(date);
	if (!canonical) {
		throw new Error('Paramètre date invalide. Format attendu: mm-yyyy');
	}

	// Déterminer les champs à récupérer selon le type de statistique
	const fields = getFieldsForStatistic(statisticType);

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

	const dateFormula = `{Mois-Année} = DATETIME_PARSE("${escAirtable(canonical)}", "YYYY-MM-DD")`;
	const filterFormula =
		ville === 'all'
			? dateFormula
			: villeName
				? `AND(${dateFormula}, {Ville EPICU} = "${escAirtable(villeName)}")`
				: `AND(${dateFormula}, FIND("${escAirtable(ville)}", ARRAYJOIN({Ville EPICU})))`;

	const records = await base(mapping.table).select({ 
		view: mapping.view, 
		fields, 
		filterByFormula: filterFormula, 
		pageSize: 100 
	}).all();

	return records;
}

/**
 * Détermine les champs à récupérer selon le type de statistique
 */
function getFieldsForStatistic(statisticType: StatisticType): string[] {
	const baseFields = [
		'Mois-Année', 
		'Ville EPICU'
	];

	switch (statisticType) {
		case 'chiffre-affaires-global':
			return [...baseFields, 'CA TOTAL', 'CA depuis la création', 'CA France', 'CA FRANCE'];
		case 'clients-signes':
			return [...baseFields, '📊 Prospects signés ds le mois', 'Prospects signés depuis la création'];
		case 'franchises':
			return [...baseFields, 'Franchises existantes', 'Franchises créées'];
		case 'abonnes-en-plus':
			return [...baseFields, '📊 Total abonnés', 'Total abonnés gagnés /M-1', 'Total abonnés gagnés /A-1'];
		case 'vues':
			return [...baseFields, '📊 Total vues', '📊 Total vues depuis la création', '📊 Total vues annuel'];
		case 'taux-conversion':
			return [...baseFields, '📊 Tx de conversion', '📊 Tx de conversion depuis la création'];
		case 'prospects':
			return [...baseFields, '📊 Prospects vus ds le mois', 'Prospects vus depuis la création'];
		case 'posts-publies':
			return [...baseFields, 'Posts publiés', 'Nbre publications ds le mois'];
		case 'prestations-studio':
			return [...baseFields, 'Prestations studio'];
		default:
			return baseFields;
	}
}

/**
 * Traite les données récupérées selon le type de statistique
 */
function processStatisticsData(records: any[], statisticType: StatisticType, timeFilter: TimeFilter, locationFilter: LocationFilter): any {
	if (!records || records.length === 0) {
		return null;
	}

	const record = records[0];
	const mapping = getStatisticsMapping(statisticType, timeFilter, locationFilter);
	
	if (!mapping) {
		return null;
	}

	// Extraire la valeur selon le chemin spécifié
	const value = extractValueByPath(record, mapping.path);
	
	return {
		statisticType,
		timeFilter,
		locationFilter,
		value,
		path: mapping.path,
		table: mapping.table,
		view: mapping.view,
		record: record.fields
	};
}

/**
 * Extrait une valeur d'un enregistrement selon le chemin spécifié
 */
function extractValueByPath(record: any, path: string): number {
	const fieldValue = record.get(path);
	return toNumber(fieldValue);
}

/**
 * Agrège les statistiques pour toutes les villes d'un utilisateur
 */
async function aggregateUserStatistics(
	userId: string,
	statisticType: StatisticType,
	timeFilter: TimeFilter,
	locationFilter: LocationFilter,
	date: string
): Promise<any> {
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
		return { error: 'Impossible de récupérer les villes de l\'utilisateur' };
	}

	if (linkedIds.length === 0) {
		return { 
			date, 
			ville: 'all', 
			statisticType,
			value: 0, 
			rawCount: 0 
		};
	}

	let totalValue = 0;
	let totalRecords = 0;

	// Récupérer les noms des villes
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

	// Agrégation des données pour chaque ville
	if (cityNames.length > 0) {
		await Promise.all(
			cityNames.map(async (name) => {
				const records = await fetchStatisticsWithMapping(
					statisticType,
					timeFilter,
					locationFilter,
					date,
					name
				);
				
				if (records && records.length > 0) {
					totalRecords += records.length;
					records.forEach((record: any) => {
						const mapping = getStatisticsMapping(statisticType, timeFilter, locationFilter);
						if (mapping) {
							totalValue += extractValueByPath(record, mapping.path);
						}
					});
				}
			})
		);
	}

	return {
		date,
		ville: 'all',
		statisticType,
		value: totalValue,
		rawCount: totalRecords
	};
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

			const dateFormula = `{Mois-Année} = DATETIME_PARSE("${escAirtable(canonical)}", "YYYY-MM-DD")`;
			const filterFormula = villeName
				? `AND(${dateFormula}, {Ville EPICU} = "${escAirtable(villeName)}")`
				: `AND(${dateFormula}, FIND("${escAirtable(ville)}", ARRAYJOIN({Ville EPICU})))`;

			const found = await base(DEFAULT_TABLE_NAME).select({ view: DEFAULT_VIEW_NAME, filterByFormula: filterFormula, pageSize: 1 }).all();
			if (!found || found.length === 0) return res.status(404).json({ error: 'Aucune statistique trouvée pour ce mois/ville' });

			const record = found[0];
			const updated = await base(DEFAULT_TABLE_NAME).update([{ id: record.id, fields: fieldsToUpdate }]);
			if (!updated || updated.length === 0) return res.status(500).json({ error: 'Échec mise à jour Airtable' });

			const u = updated[0];
			return res.status(200).json({ id: u.id, fields: u.fields });
		}

		// GET
		const ville = (req.query.ville as string) || 'all';
		const date = (req.query.date as string) || '';
		const statisticType = (req.query.statisticType as StatisticType) || 'abonnes-en-plus';
		const periodType = (req.query.periodType as string) || 'month';
		const isSinceCreation = (req.query.isSinceCreation as string) === 'true';
		const isCustomDate = (req.query.isCustomDate as string) === 'true';
		
		const canonical = canonicalFirstOfMonth(date);
		if (!canonical) {
			return res.status(400).json({ error: 'Paramètre date invalide. Format attendu: mm-yyyy' });
		}

		// Convertir les filtres du frontend
		const { timeFilter, locationFilter } = convertFrontendFilters(
			periodType,
			isSinceCreation,
			isCustomDate,
			ville
		);

		// Utiliser le nouveau système de mapping pour récupérer les données
		const records = await fetchStatisticsWithMapping(
			statisticType,
			timeFilter,
			locationFilter,
			date,
			ville
		);

		if (!records) {
			return res.status(404).json({ error: 'Statistique non disponible pour cette configuration' });
		}

		// Traitement des données selon le type de statistique
		const result = processStatisticsData(records, statisticType, timeFilter, locationFilter);
		
		if (ville === 'all') {
			const userId = await requireValidAccessToken(req, res);
			if (!userId) return;

			// Pour 'all', on agrège les données de toutes les villes de l'utilisateur
			const aggregatedResult = await aggregateUserStatistics(
				userId,
				statisticType,
				timeFilter,
				locationFilter,
				date
			);
			
			return res.status(200).json(aggregatedResult);
		}

		// Retourner le résultat traité
		return res.status(200).json(result);
	} catch (error: any) {
		console.error('Airtable error (data):', error?.message || error);
		return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
	}
}

