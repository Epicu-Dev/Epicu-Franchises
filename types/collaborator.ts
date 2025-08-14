import { City } from "./city";

export type Collaborator = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    city: Array<City>;
}