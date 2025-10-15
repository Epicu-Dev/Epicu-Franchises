export interface Prospect {
    id: string;
    nomEtablissement: string;
    ville: string;
    villeEpicu?: string;
    telephone: string;
    categorie: ("FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY")[];
    statut: "a_contacter" | "contacte" | "en_discussion" | "glacial";
    datePriseContact?: string;
    dateRelance: string;
    commentaires: string;
    suiviPar: string;
    email?: string;
    adresse?: string;
    recordIdFromInteractions?: string;
}