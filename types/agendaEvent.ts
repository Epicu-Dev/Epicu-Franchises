import { AgendaType } from "./agendaType";

export type AgendaEvent = {
    id: string;
    name: string;
    date: string;
    hour: string;
    type: AgendaType;
}