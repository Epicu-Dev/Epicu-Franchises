export interface Prospect {
    id: string;
    nomEtablissement: string;
    ville: string;
    telephone: string;
    categorie1: "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY";
    categorie2?: "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY" | undefined;
    statut: "a_contacter" | "en_discussion" | "glacial";
    datePriseContact: string;
    dateRelance: string;
    commentaires: string;
    suiviPar: string;
    email?: string;
    adresse?: string;
}