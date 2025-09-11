import { Publication } from "./publication";
import { Invoice } from "./invoice";



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
    statut?: "actif" | "inactif" | "prospect";
    invoices: Invoice[];
    publications?: Publication[];
}