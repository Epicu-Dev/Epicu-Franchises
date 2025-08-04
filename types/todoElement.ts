import { TodoType } from "./todoType";

export type TodoElement = {
    id: string;
    name: string;
    date: string;
    type: TodoType;
}