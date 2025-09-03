export interface Prospect {
    id: string;
    nomEtablissement: string;
    ville: string;
    telephone: string;
    categorie: "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY";
    statut: "a_contacter" | "en_discussion" | "glacial";
    datePriseContact: string;
    dateRelance: string;
    commentaires: string;
    suiviPar: string;
    email?: string;
    adresse?: string;
}