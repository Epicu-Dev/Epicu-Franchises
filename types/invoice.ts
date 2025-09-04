export interface Invoice {
    id: string;
    categorie: string;
    nomEtablissement: string;
    date: string;
    montant: number;
    typePrestation: string;
    statut: string;
    commentaire?: string;
}