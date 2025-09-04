
export interface Publication {
    id: string;
    datePublication: string;
    dateEnvoiFactureCreation: string;
    montantFactureTournage: string;
    factureTournage: "Payée" | "En attente" | "En retard";
    dateEnvoiFacturePublication: string;
    montantFacturePublication: string;
    facturePublication: "Payée" | "En attente" | "En retard";
    montantSponsorisation: string;
    montantAddition: string;
    benefice: string;
    cadeauGerant: string;
    montantCadeau: string;
    tirageEffectue: boolean;
    nombreVues: number;
    nombreAbonnes: number;
    commentaire?: string;
}