import { EstablishmentType } from "./establishmentType";

export type Customer = {
    id: string;
    type: EstablishmentType;
    name: string;
    companyName: string;
    signDate: string;
    comments: string;
}