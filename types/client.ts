
export interface Client {

    id: string;
    raisonSociale: string;
    ville: string;
    categorie: string;
    telephone: string;
    nomEtablissement: string;
    email: string;
    adresse?: string;
    codePostal: string;
    siret: string;
    description: string;
    villeEpicu: string;
    commentaires: string;
  
  
    dateSignatureContrat: string;
    datePublicationContenu: string;
    datePublicationFacture: string;
    statutPaiementContenu: "Payée" | "En attente" | "En retard";
    montantFactureContenu: string;
    montantPaye: string;
    dateReglementFacture: string;
    restantDu: string;
    montantSponsorisation: string;
    montantAddition: string;
    factureContenu: string;
    facturePublication: string;
    commentaire: string;
    commentaireCadeauGerant: string;
    montantCadeau: string;
    tirageAuSort: boolean;
    statut?: "actif" | "inactif" | "prospect";
    nombreVues?: number;
    nombreAbonnes?: number;
    faitGagnes?: string;
    FACTURES?: any[];
  }