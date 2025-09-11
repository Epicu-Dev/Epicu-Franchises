export interface Todo {
    id: string;
    name: string;              // Nom de la tâche
    dueDate?: string;          // Date d'échéance (ISO | '')
    status: string;            // Statut
    type: string;              // Type de tâche
}