// Fichier de données partagé pour les clients
// Ceci simule une base de données en mémoire

export interface Client {
  id: string;
  raisonSociale: string;
  ville?: string;
  categorie?: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
  telephone?: string;
  email?: string;
  numeroSiret?: string;
  dateSignatureContrat?: string;
  datePublicationContenu?: string;
  datePublicationFacture?: string;
  statutPaiementContenu?: "Payée" | "En attente" | "En retard";
  montantFactureContenu?: string;
  montantPaye?: string;
  dateReglementFacture?: string;
  restantDu?: string;
  montantSponsorisation?: string;
  montantAddition?: string;
  factureContenu?: string;
  facturePublication?: string;
  commentaire?: string;
  commentaireCadeauGerant?: string;
  montantCadeau?: string;
  tirageAuSort?: boolean;
  adresse?: string;
  statut?: "actif" | "inactif" | "prospect";
}

// Données mock initiales
const initialMockClients: Client[] = [
  {
    id: '1',
    raisonSociale: 'La petite gourmandise',
    ville: 'Paris',
    categorie: 'FOOD',
    telephone: '01 23 45 67 89',
    email: 'contact@lapetitegourmandise.fr',
    numeroSiret: '12345678901234',
    dateSignatureContrat: '2025-06-08',
    datePublicationContenu: '2025-07-12',
    datePublicationFacture: '2025-07-15',
    statutPaiementContenu: 'En attente',
    montantFactureContenu: '1750',
    montantPaye: '750',
    dateReglementFacture: '2025-08-01',
    restantDu: '1000',
    montantSponsorisation: '500',
    montantAddition: '250',
    factureContenu: '12.07.2025',
    facturePublication: 'En attente',
    commentaire: 'Client fidèle depuis 2 ans',
    commentaireCadeauGerant: 'Bon d\'achat de 50€ pour le restaurant',
    montantCadeau: '50',
    tirageAuSort: false,
    adresse: '123 Rue de la Gastronomie, 75001 Paris',
    statut: 'actif'
  },
  {
    id: '2',
    raisonSociale: 'Boulangerie du Marché',
    ville: 'Lyon',
    categorie: 'FOOD',
    telephone: '01 98 76 54 32',
    email: 'info@boulangeriedumarche.fr',
    numeroSiret: '98765432109876',
    dateSignatureContrat: '2025-05-15',
    datePublicationContenu: '2025-06-20',
    datePublicationFacture: '2025-06-25',
    statutPaiementContenu: 'Payée',
    montantFactureContenu: '1200',
    montantPaye: '1200',
    dateReglementFacture: '2025-07-01',
    restantDu: '0',
    montantSponsorisation: '300',
    montantAddition: '150',
    factureContenu: '20.06.2025',
    facturePublication: 'Payée',
    commentaire: 'Nouveau client, très satisfait',
    commentaireCadeauGerant: 'Panier gourmand',
    montantCadeau: '75',
    tirageAuSort: true,
    adresse: '45 Place du Marché, 69001 Lyon',
    statut: 'actif'
  },
  {
    id: '3',
    raisonSociale: 'Pâtisserie Artisanale',
    ville: 'Marseille',
    categorie: 'FOOD',
    telephone: '04 56 78 90 12',
    email: 'contact@patisserieartisanale.fr',
    numeroSiret: '11122334455667',
    dateSignatureContrat: '2025-04-22',
    datePublicationContenu: '2025-05-30',
    datePublicationFacture: '2025-06-05',
    statutPaiementContenu: 'En retard',
    montantFactureContenu: '2000',
    montantPaye: '500',
    dateReglementFacture: '2025-07-15',
    restantDu: '1500',
    montantSponsorisation: '600',
    montantAddition: '300',
    factureContenu: '30.05.2025',
    facturePublication: 'En retard',
    commentaire: 'Paiement en retard, relance nécessaire',
    commentaireCadeauGerant: 'Gâteau personnalisé',
    montantCadeau: '100',
    tirageAuSort: false,
    adresse: '78 Avenue des Délices, 13001 Marseille',
    statut: 'actif'
  },
  {
    id: '4',
    raisonSociale: 'Café Central',
    ville: 'Nantes',
    categorie: 'FOOD',
    telephone: '02 34 56 78 90',
    email: 'reservation@cafecentral.fr',
    numeroSiret: '77788899900111',
    dateSignatureContrat: '2025-03-10',
    datePublicationContenu: '2025-04-15',
    datePublicationFacture: '2025-04-20',
    statutPaiementContenu: 'Payée',
    montantFactureContenu: '1500',
    montantPaye: '1500',
    dateReglementFacture: '2025-05-01',
    restantDu: '0',
    montantSponsorisation: '400',
    montantAddition: '200',
    factureContenu: '15.04.2025',
    facturePublication: 'Payée',
    commentaire: 'Client régulier, commandes mensuelles',
    commentaireCadeauGerant: 'Menu dégustation',
    montantCadeau: '80',
    tirageAuSort: true,
    adresse: '12 Place Centrale, 44000 Nantes',
    statut: 'actif'
  },
  {
    id: '5',
    raisonSociale: 'Restaurant Le Gourmet',
    ville: 'Toulouse',
    categorie: 'FOOD',
    telephone: '03 45 67 89 01',
    email: 'contact@legourmet.fr',
    numeroSiret: '55566677788899',
    dateSignatureContrat: '2025-02-05',
    datePublicationContenu: '2025-03-10',
    datePublicationFacture: '2025-03-15',
    statutPaiementContenu: 'Payée',
    montantFactureContenu: '2500',
    montantPaye: '2500',
    dateReglementFacture: '2025-04-01',
    restantDu: '0',
    montantSponsorisation: '800',
    montantAddition: '400',
    factureContenu: '10.03.2025',
    facturePublication: 'Payée',
    commentaire: 'Restaurant gastronomique, client premium',
    commentaireCadeauGerant: 'Dîner gastronomique pour 2 personnes',
    montantCadeau: '150',
    tirageAuSort: true,
    adresse: '56 Rue de la Gastronomie, 31000 Toulouse',
    statut: 'actif'
  },
  {
    id: '6',
    raisonSociale: 'Boutique Mode & Style',
    ville: 'Nice',
    categorie: 'SHOP',
    telephone: '04 93 12 34 56',
    email: 'contact@modestyle.fr',
    numeroSiret: '12312312312312',
    dateSignatureContrat: '2025-01-15',
    datePublicationContenu: '2025-02-20',
    datePublicationFacture: '2025-02-25',
    statutPaiementContenu: 'Payée',
    montantFactureContenu: '1800',
    montantPaye: '1800',
    dateReglementFacture: '2025-03-01',
    restantDu: '0',
    montantSponsorisation: '600',
    montantAddition: '300',
    factureContenu: '20.02.2025',
    facturePublication: 'Payée',
    commentaire: 'Client boutique de mode, très satisfait',
    commentaireCadeauGerant: 'Bon d\'achat mode 100€',
    montantCadeau: '100',
    tirageAuSort: true,
    adresse: '78 Promenade des Anglais, 06000 Nice',
    statut: 'actif'
  },
  {
    id: '7',
    raisonSociale: 'Salon de Beauté Élégance',
    ville: 'Cannes',
    categorie: 'BEAUTY',
    telephone: '04 92 98 76 54',
    email: 'info@salonelegance.fr',
    numeroSiret: '98798798798798',
    dateSignatureContrat: '2025-03-01',
    datePublicationContenu: '2025-04-05',
    datePublicationFacture: '2025-04-10',
    statutPaiementContenu: 'En attente',
    montantFactureContenu: '2200',
    montantPaye: '1000',
    dateReglementFacture: '2025-05-01',
    restantDu: '1200',
    montantSponsorisation: '700',
    montantAddition: '350',
    factureContenu: '05.04.2025',
    facturePublication: 'En attente',
    commentaire: 'Salon haut de gamme, clientèle exigeante',
    commentaireCadeauGerant: 'Soin visage premium',
    montantCadeau: '120',
    tirageAuSort: false,
    adresse: '45 Boulevard de la Croisette, 06400 Cannes',
    statut: 'actif'
  }
];

// Utiliser globalThis pour persister les données en développement
declare global {
  var clientsCache: Client[] | undefined;
}

// Initialiser ou récupérer les données du cache global
if (!globalThis.clientsCache) {
  globalThis.clientsCache = JSON.parse(JSON.stringify(initialMockClients));
}

// Fonctions utilitaires pour manipuler les données
export const getAllClients = (): Client[] => {
  return globalThis.clientsCache || [];
};

export const getClientById = (id: string): Client | undefined => {
  return globalThis.clientsCache?.find(c => c.id === id);
};

export const updateClient = (id: string, updatedData: Partial<Client>): Client | null => {
  if (!globalThis.clientsCache) return null;
  
  const clientIndex = globalThis.clientsCache.findIndex(c => c.id === id);

  if (clientIndex === -1) return null;
  
  globalThis.clientsCache[clientIndex] = { 
    ...globalThis.clientsCache[clientIndex], 
    ...updatedData, 
    id 
  };

  return globalThis.clientsCache[clientIndex];
};

export const addClient = (client: Omit<Client, 'id'>): Client => {
  if (!globalThis.clientsCache) {
    globalThis.clientsCache = [];
  }
  
  const newId = (globalThis.clientsCache.length + 1).toString();
  const newClient = { ...client, id: newId };

  globalThis.clientsCache.push(newClient);

  return newClient;
};

export const deleteClient = (id: string): Client | null => {
  if (!globalThis.clientsCache) return null;
  
  const clientIndex = globalThis.clientsCache.findIndex(c => c.id === id);

  if (clientIndex === -1) return null;
  
  return globalThis.clientsCache.splice(clientIndex, 1)[0];
};
