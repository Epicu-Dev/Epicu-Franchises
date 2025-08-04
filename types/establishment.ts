import { EstablishmentType } from "./establishmentType";

export type Establishment = {
    id: string;
    name: string;
    category: EstablishmentType;
}