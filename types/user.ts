export interface VilleEpicu {
  id: string;
  ville: string;
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
}

export type UserType = "admin" | "franchise";
