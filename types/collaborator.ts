export type Collaborator = {
    id: string;
    nom: string;
    prenom: string;
    villeEpicu: string[];
    emailEpicu: string | null;
    role: string | null;
    etablissements: string[];
    trombi: any[] | null;
    // Champs additionnels pour les admins
    dateNaissance?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    siret?: string | null;
    dateDIP?: string | null;
    dateSignatureContrat?: string | null;
    dateSignatureAttestation?: string | null;
}