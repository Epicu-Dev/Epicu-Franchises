import React from 'react';

// Fonction pour obtenir la couleur du badge de statut
export const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case "Attente":
            return "bg-custom-orange-food/10 text-custom-orange-food";
        case "Payée":
            return "bg-custom-green-success/10 text-custom-green-success";
        case "En retard":
            return "bg-custom-red-retard/10 text-custom-red-retard";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Fonction pour obtenir la couleur du badge de catégorie
export const getCategoryBadgeColor = (category?: string) => {
    if (category === undefined) {
        return "bg-gray-50/10 text-gray-300 border-gray-200";
    }
    // Utiliser une approche dynamique pour les catégories
    const categoryLower = category?.toLowerCase();

    // Mapper les catégories communes à des couleurs
    if (categoryLower.includes('restaurant') || categoryLower.includes('food') || categoryLower.includes('café')) {
        return "bg-custom-orange-food/10 text-custom-orange-food";
    } else if (categoryLower.includes('shop') || categoryLower.includes('boutique') || categoryLower.includes('magasin')) {
        return "bg-custom-purple-shop/10 text-custom-purple-shop";
    } else if (categoryLower.includes('travel') || categoryLower.includes('hôtel') || categoryLower.includes('voyage')) {
        return "bg-custom-green-travel/10 text-custom-green-travel";
    } else if (categoryLower.includes('fun') || categoryLower.includes('loisir') || categoryLower.includes('divertissement')) {
        return "bg-custom-red-fun/10 text-custom-red-fun";
    } else if (categoryLower.includes('beauty') || categoryLower.includes('beauté') || categoryLower.includes('esthétique')) {
        return "bg-custom-blue-beauty/10 text-custom-blue-beauty";
    } else {
        // Couleur par défaut pour les nouvelles catégories
        return "bg-gray-50/10 text-gray-300 border-gray-200";
    }
};

// Fonction pour obtenir la couleur d'un événement basée sur les catégories d'établissement
export const getEventColorFromEstablishmentCategories = (establishmentCategories?: string[]) => {
    if (!establishmentCategories || establishmentCategories.length === 0) {
        return "bg-gray-100 text-gray-800";
    }

    // Prendre la première catégorie pour déterminer la couleur
    const firstCategory = establishmentCategories[0];
    return getCategoryBadgeColor(firstCategory);
};

// Fonction pour obtenir la couleur du badge de statut de facture
export const getInvoiceStatusBadgeColor = (status: string) => {
    switch (status) {
        case "Validée":
            return "bg-custom-green-success/10 text-custom-green-success";
        case "En attente":
            return "bg-custom-red-retard/10 text-custom-red-retard";
        case "En retard":
            return "bg-custom-red-error/10 text-custom-red-error";
        default:
            return "bg-gray-50/10 text-gray-600";
    }
};

// Composant Badge de catégorie
interface CategoryBadgeProps {
    category: string;
    className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
    category,
    className = ""
}) => {
    return (
        <span
            className={`px-3 py-1 text-xs font-light rounded  ${getCategoryBadgeColor(category)} ${className}`}
        >
            {category}
        </span>
    );
};

// Composant Badge de statut
interface StatusBadgeProps {
    status: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    className = ""
}) => {
    return (
        <span
            className={`px-3 py-1 text-xs font-light rounded ${getStatusBadgeColor(status)} ${className}`}
        >
            {status}
        </span>
    );
};

// Composant Badge de statut de facture (même design que CategoryBadge)
interface InvoiceStatusBadgeProps {
    status: string;
    className?: string;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({
    status,
    className = ""
}) => {
    return (
        <span
            className={`px-3 py-1 text-xs font-light rounded ${getInvoiceStatusBadgeColor(status)} ${className}`}
        >
            {status}
        </span>
    );
};

// Composant Badge générique avec style personnalisable
interface BadgeProps {
    text: string;
    variant?: 'category' | 'status' | 'custom';
    className?: string;
    rounded?: 'rounded' | 'rounded-full';
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'custom',
    className = "",
    rounded = 'rounded'
}) => {
    let baseClasses = "px-3 py-1 text-xs font-light";

    if (variant === 'category') {
        baseClasses += ` ${getCategoryBadgeColor(text)} border`;
    } else if (variant === 'status') {
        baseClasses += ` ${getStatusBadgeColor(text)}`;
    }

    return (
        <span className={`${baseClasses} ${rounded} ${className}`}>
            {text}
        </span>
    );
};

// Composant Badge pour les événements d'agenda
interface AgendaBadgeProps {
    type: string;
    className?: string;
}

export const AgendaBadge: React.FC<AgendaBadgeProps> = ({
    type,
    className = ""
}) => {
    const getAgendaBadgeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "tournage":
                return "bg-custom-rose/14 text-custom-rose";
            case "rendez-vous":
                return "bg-custom-blue-rdv/14 text-custom-blue-rdv";
            case "publication":
                return "bg-custom-blue-pub/14 text-custom-blue-pub";
            case "evenement":
            case "évenement":
            case "evènement":
                return "bg-custom-orange-event/14 text-custom-orange-event";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <span
            className={`px-3 py-1 rounded text-xs font-light ml-2 flex-shrink-0 ${getAgendaBadgeColor(type)} ${className}`}
        >
            {type}
        </span>
    );
};

// Fonction pour obtenir le label du statut de todo
export const getTodoStatutLabel = (statut: string) => {
    switch (statut) {
        case "À faire":
            return "Pas commencé";
        case "En attente":
            return "En attente";
        case "Terminé":
            return "Terminé";

        default:
            return statut;
    }
};

// Fonction pour obtenir la classe CSS du badge de statut de todo
export const getTodoStatutBadgeClass = (statut: string) => {
    switch (statut) {
        case "Terminé":
            return "bg-custom-green-success/10 text-custom-green-success";
        case "En attente":
            return "bg-blue-100 text-blue-800";
        case "Terminé":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
};

// Composant Badge pour les statuts de todo
interface TodoBadgeProps {
    status: string;
    className?: string;
}

export const TodoBadge: React.FC<TodoBadgeProps> = ({
    status,
    className = ""
}) => {
    return (
        <span
            className={`px-3 py-1 rounded text-xs font-light ${getTodoStatutBadgeClass(status)} ${className}`}
        >
            {getTodoStatutLabel(status)}
        </span>
    );
};
