
export interface Publication {
    id: string;
    nom?: string;
    datePublication?: string;
    dateEnvoiFactureCreation?: string;
    montantFactureTournage?: string;
    factureTournage?: "Payée" | "En attente" | "En retard";
    dateEnvoiFacturePublication?: string;
    montantFacturePublication?: string;
    facturePublication?: "Payée" | "En attente" | "En retard";
    montantSponsorisation?: string | number;
    montantAddition?: string | number;
    benefice?: string | number;
    cadeauGerant?: string;
    montantCadeau?: string | number;
    tirageEffectue?: boolean;
    nombreVues?: number;
    nombreAbonnes?: number;
    commentaire?: string;
    likes?: number;
    partages?: number;
    enregistrements?: number;
}