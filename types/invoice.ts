export interface Invoice {
    id: string;
    categorie: string;
    nomEtablissement: string;
    datePaiement?: string;
    dateEmission: string;
    montant: number;
    typePrestation: string;
    statut: string;
    commentaire?: string;
}