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
 * Obtient le champ de date et la formule de recherche selon la table
 */
function getDateFieldAndFormula(table: string, date: string, ville: string, villeName: string | null): { dateField: string, filterFormula: string } {
	const canonical = canonicalFirstOfMonth(date);
	if (!canonical) {
		throw new Error(`Paramètre date invalide: "${date}". Format attendu: mm-yyyy`);
	}

	let dateField: string;
	let dateFormula: string;

	switch (table) {
		case 'STATISTIQUES MENSUELLES VILLE':
			dateField = 'Date - ville EPICU';
			// Format: MM/YYYY - Ville EPICU
			const monthYear = `${String(new Date(canonical).getMonth() + 1).padStart(2, '0')}/${new Date(canonical).getFullYear()}`;
			if (villeName) {
				dateFormula = `{Date - ville EPICU} = "${escAirtable(monthYear + ' - ' + villeName)}"`;
			} else {
				dateFormula = `FIND("${escAirtable(monthYear)}", {Date - ville EPICU})`;
			}
			break;

		case 'STATISTIQUES ANNUELLES VILLE':
			dateField = 'Année-Ville';
			// Format: YYYY - Ville EPICU
			const year = new Date(canonical).getFullYear().toString();
			if (villeName) {
				dateFormula = `{Année-Ville} = "${escAirtable(year + ' - ' + villeName)}"`;
			} else {
				dateFormula = `FIND("${escAirtable(year)}", {Année-Ville})`;
			}
			break;

		case 'STATISTIQUES CREATION VILLE':
			dateField = 'Name';
			// Format: Nom de la ville EPICU
			if (villeName) {
				dateFormula = `{Name} = "${escAirtable(villeName)}"`;
			} else {
				dateFormula = `FIND("${escAirtable(ville)}", {Name})`;
			}
			break;

		case 'STATISTIQUES MENSUELLES FRANCE':
			dateField = 'Période';
			// Format: MM/YYYY
			const monthYear2 = `${String(new Date(canonical).getMonth() + 1).padStart(2, '0')}/${new Date(canonical).getFullYear()}`;
			dateFormula = `{Période} = "${escAirtable(monthYear2)}"`;
			break;

		case 'STATISTIQUES ANNUELLES FRANCE':
			dateField = 'Année';
			// Format: YYYY
			const year2 = new Date(canonical).getFullYear().toString();
			dateFormula = `{Année} = "${escAirtable(year2)}"`;
			break;

		case 'STATISTIQUES CREATION FRANCE':
			dateField = 'Pays';
			// Format: France
			dateFormula = `{Pays} = "France"`;
			break;

		default:
			// Fallback pour les anciennes tables
			dateField = 'Mois-Année';
			dateFormula = `{Mois-Année} = DATETIME_PARSE("${escAirtable(canonical)}", "YYYY-MM-DD")`;
	}

	return { dateField, filterFormula: dateFormula };
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

	// Déterminer les champs à récupérer selon le type de statistique et la table
	const fields = getFieldsForStatistic(statisticType, mapping.table);

	let villeName: string | null = null;
	if (ville !== 'all') {
		if (/^rec/i.test(ville)) {
			// Si c'est un ID Airtable, récupérer le nom de la ville
			try {
				const cityRec = await base('VILLES EPICU').find(ville);
				const vn = cityRec.get('Ville EPICU');
				villeName = vn != null ? String(vn) : null;
			} catch (e) {
				console.warn('Impossible de récupérer le nom de la ville pour id', ville, e);
			}
		} else {
			// Si c'est déjà un nom de ville, l'utiliser directement
			villeName = ville;
		}
	}

	// Obtenir le bon champ de date et la formule selon la table
	const { dateField, filterFormula } = getDateFieldAndFormula(mapping.table, date, ville, villeName);
	
	// Debug: log la formule de filtre
	console.log(`[DEBUG] fetchStatisticsWithMapping: ${statisticType} pour ${ville}`);
	console.log(`[DEBUG] Table: ${mapping.table}, Vue: ${mapping.view}`);
	console.log(`[DEBUG] Formule: ${filterFormula}`);

	const records = await base(mapping.table).select({ 
		view: mapping.view, 
		fields, 
		filterByFormula: filterFormula, 
		pageSize: 100 
	}).all();

	return records;
}

/**
 * Détermine les champs à récupérer selon le type de statistique et la table
 */
function getFieldsForStatistic(statisticType: StatisticType, table?: string): string[] {
	// Champs de base selon la table
	let baseFields: string[] = [];
	
	if (table) {
		switch (table) {
			case 'STATISTIQUES MENSUELLES VILLE':
				baseFields = ['Date - ville EPICU'];
				break;
			case 'STATISTIQUES ANNUELLES VILLE':
				baseFields = ['Année-Ville'];
				break;
			case 'STATISTIQUES CREATION VILLE':
				baseFields = ['Name'];
				break;
			case 'STATISTIQUES MENSUELLES FRANCE':
				baseFields = ['Période'];
				break;
			case 'STATISTIQUES ANNUELLES FRANCE':
				baseFields = ['Année'];
				break;
			case 'STATISTIQUES CREATION FRANCE':
				baseFields = ['Pays'];
				break;
			default:
				baseFields = ['Mois-Année'];
		}
	} else {
		// Fallback si pas de table spécifiée
		baseFields = ['Mois-Année'];
	}

	// Ajouter le champ spécifique à la statistique
	switch (statisticType) {
		case 'chiffre-affaires-global':
			return [...baseFields, 'CA total'];
		case 'clients-signes':
			return [...baseFields, 'Clients signés'];
		case 'franchises':
			return [...baseFields, 'Franchises existantes'];
		case 'abonnes-en-plus':
			return [...baseFields, 'Progression abonnés'];
		case 'vues':
			return [...baseFields, 'Total vues'];
		case 'taux-conversion':
			return [...baseFields, 'Tx de conversion'];
		case 'prospects':
			return [...baseFields, 'Prospects vus'];
		case 'posts-publies':
			return [...baseFields, 'Posts publiés'];
		case 'prestations-studio':
			return [...baseFields, 'Prestations studio'];
		case 'ca-studio':
			return [...baseFields, 'CA studio'];
		default:
			return baseFields;
	}
}

/**
 * Traite les données récupérées selon le type de statistique
 */
async function processStatisticsData(records: any[], statisticType: StatisticType, timeFilter: TimeFilter, locationFilter: LocationFilter, date: string, cityName?: string): Promise<any> {
	if (!records || records.length === 0) {
		return null;
	}

	const record = records[0];
	const mapping = getStatisticsMapping(statisticType, timeFilter, locationFilter);
	
	if (!mapping) {
		return null;
	}

	let value: number;

	// Traitement spécial pour le taux de conversion
	if (statisticType === 'taux-conversion' && cityName) {
		// Calculer le taux de conversion manuellement pour une ville spécifique
		value = await calculateConversionRateForCity(cityName, timeFilter, locationFilter, date);
	} else {
		// Extraire la valeur selon le chemin spécifié pour les autres statistiques
		value = extractValueByPath(record, mapping.path);
		
		// Traitement spécial pour le taux de conversion en mode national
		// Si la valeur est en décimal (entre 0 et 1), la multiplier par 100
		if (statisticType === 'taux-conversion' && value > 0 && value <= 1) {
			value = value * 100;
		}
	}
	
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
 * Calcule le taux de conversion pour une ville spécifique
 */
async function calculateConversionRateForCity(
	cityName: string,
	timeFilter: TimeFilter,
	locationFilter: LocationFilter,
	date: string
): Promise<number> {
	try {
		// Récupérer les clients signés
		const clientsRecords = await fetchStatisticsWithMapping(
			'clients-signes',
			timeFilter,
			locationFilter,
			date,
			cityName
		);
		
		// Récupérer les prospects
		const prospectsRecords = await fetchStatisticsWithMapping(
			'prospects',
			timeFilter,
			locationFilter,
			date,
			cityName
		);
		
		let totalClients = 0;
		let totalProspects = 0;
		
		if (clientsRecords && clientsRecords.length > 0) {
			clientsRecords.forEach((record: any) => {
				const mapping = getStatisticsMapping('clients-signes', timeFilter, locationFilter);
				if (mapping) {
					totalClients += extractValueByPath(record, mapping.path);
				}
			});
		}
		
		if (prospectsRecords && prospectsRecords.length > 0) {
			prospectsRecords.forEach((record: any) => {
				const mapping = getStatisticsMapping('prospects', timeFilter, locationFilter);
				if (mapping) {
					totalProspects += extractValueByPath(record, mapping.path);
				}
			});
		}
		
		// Calculer le taux de conversion
		return totalProspects > 0 ? (totalClients / totalProspects) * 100 : 0;
	} catch (error) {
		console.error(`Erreur lors du calcul du taux de conversion pour ${cityName}:`, error);
		return 0;
	}
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
	// IMPORTANT: Forcer l'utilisation du filtre 'ville' pour chaque ville individuelle
	const cityLocationFilter: LocationFilter = 'ville';
	
	// Debug: log les informations d'agrégation
	console.log(`[DEBUG] aggregateUserStatistics: ${statisticType} pour ${cityNames.length} villes: ${cityNames.join(', ')}`);
	
	// Traitement spécial pour le taux de conversion
	if (statisticType === 'taux-conversion') {
		// Pour le taux de conversion, on doit calculer le taux global
		// en récupérant les clients signés et les prospects de chaque ville
		let totalClients = 0;
		let totalProspects = 0;
		
		if (cityNames.length > 0) {
			await Promise.all(
				cityNames.map(async (name) => {
					// Récupérer les clients signés
					const clientsRecords = await fetchStatisticsWithMapping(
						'clients-signes',
						timeFilter,
						cityLocationFilter,
						date,
						name
					);
					
					// Récupérer les prospects (si disponible)
					const prospectsRecords = await fetchStatisticsWithMapping(
						'prospects',
						timeFilter,
						cityLocationFilter,
						date,
						name
					);
					
					if (clientsRecords && clientsRecords.length > 0) {
						clientsRecords.forEach((record: any) => {
							const mapping = getStatisticsMapping('clients-signes', timeFilter, cityLocationFilter);
							if (mapping) {
								totalClients += extractValueByPath(record, mapping.path);
							}
						});
					}
					
					if (prospectsRecords && prospectsRecords.length > 0) {
						prospectsRecords.forEach((record: any) => {
							const mapping = getStatisticsMapping('prospects', timeFilter, cityLocationFilter);
							if (mapping) {
								totalProspects += extractValueByPath(record, mapping.path);
							}
						});
					}
				})
			);
		}
		
		// Calculer le taux de conversion global
		totalValue = totalProspects > 0 ? (totalClients / totalProspects) * 100 : 0;
		totalRecords = cityNames.length;
	} else {
		// Pour les autres statistiques, faire la somme normale
		if (cityNames.length > 0) {
			await Promise.all(
				cityNames.map(async (name) => {
					console.log(`[DEBUG] Récupération ${statisticType} pour ${name}...`);
					const records = await fetchStatisticsWithMapping(
						statisticType,
						timeFilter,
						cityLocationFilter, // Utiliser 'ville' au lieu de 'pays'
						date,
						name
					);
					
					console.log(`[DEBUG] ${name}: ${records?.length || 0} enregistrements trouvés`);
					
					if (records && records.length > 0) {
						totalRecords += records.length;
						records.forEach((record: any) => {
							const mapping = getStatisticsMapping(statisticType, timeFilter, cityLocationFilter);
							if (mapping) {
								const value = extractValueByPath(record, mapping.path);
								console.log(`[DEBUG] ${name}: ${mapping.path} = ${value}`);
								totalValue += value;
							}
						});
					}
				})
			);
		}
	}

	console.log(`[DEBUG] Résultat final ${statisticType}: ${totalValue} (${totalRecords} enregistrements)`);
	
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
			const filterFormula = dateFormula;

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

		// Caching côté serveur: le contenu est spécifique à la combinaison des query params,
		// peu volatile; on autorise un cache court + revalidation sur le client/CDN
		// S-MaxAge pour CDN, stale-while-revalidate pour latence
		res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
		
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
		const result = await processStatisticsData(records, statisticType, timeFilter, locationFilter, date, ville);
		
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

		// Pour 'national', on utilise directement les données des tables FRANCE
		// Le résultat est déjà traité par processStatisticsData
		return res.status(200).json(result);
	} catch (error: any) {
		console.error('Airtable error (data):', error?.message || error);
		return res.status(500).json({ error: 'Erreur Airtable', details: error?.message || String(error) });
	}
}

