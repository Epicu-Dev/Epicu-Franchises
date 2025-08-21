import { Collaborator } from "airtable";

import { Establishment } from "./establishment";

export type Prospects = {
    establishmennt: Establishment;
    dateRelaunch: string;
    followedBy: Collaborator;
    comments: string;
}