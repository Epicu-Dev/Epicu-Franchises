export interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  dateAdded: string;
  category: ResourceCategory;
  icon: string;
  tags?: string[];
  fileSize?: string;
  lastModified?: string;
  author?: string;
}

export type ResourceCategory = 
  | "liens-importants"
  | "bibliotheque"
  | "ressources-canva"
  | "materiel";

export interface ResourceFilter {
  category?: ResourceCategory;
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ResourceSort {
  field: keyof Resource;
  direction: "asc" | "desc";
}
