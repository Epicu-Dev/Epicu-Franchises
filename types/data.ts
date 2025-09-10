export interface Data {
  // Données de base de l'API
  id?: string;
  date: string;
  ville: string;
  totalAbonnes: number;
  totalVues: number;
  totalProspectsSignes: number;
  totalProspectsVus: number;
  tauxConversion: number | null;
  rawCount: number;
  moisAnnee?: string;
  villeEpicu?: string;
  prospectsSignesDsLeMois?: number;
  tauxDeConversion?: number | null;
  
  // Données détaillées par catégorie
  viewsFood?: number;
  abonnesFood?: number;
  abonnesShop?: number;
  vuesShop?: number;
  abonnesTravel?: number;
  vuesTravel?: number;
  abonnesFun?: number;
  vuesFun?: number;
  abonnesBeauty?: number;
  vuesBeauty?: number;
  
  // Données supplémentaires
  postsPublies?: number;
  cumulMontantCadeau?: number;
}

