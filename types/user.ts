export interface VilleEpicu {
  id: string;
  ville: string;
}

export interface TrombiAttachment {
  filename: string;
  height: number;
  id: string;
  size: number;
  thumbnails: {
    small: { url: string; width: number; height: number };
    large: { url: string; width: number; height: number };
    full: { url: string; width: number; height: number };
  };
  type: string;
  url: string;
  width: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  villes: VilleEpicu[];
  // Champs optionnels qui peuvent exister dans Airtable
  telephone?: string;
  identifier?: string;
  trombi?: TrombiAttachment[]; // Tableau d'objets pièces jointes Airtable avec l'URL de la photo de profil
}

export type UserType = "admin" | "franchise";
