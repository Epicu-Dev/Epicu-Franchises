import React from 'react';

// Fonction pour obtenir la couleur du badge de statut
export const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case "En attente":
            return "bg-yellow-100 text-yellow-800";
        case "Payée":
            return "bg-green-100 text-green-800";
        case "En retard":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Fonction pour obtenir la couleur du badge de catégorie
export const getCategoryBadgeColor = (category: string) => {
    switch (category) {
        case "FOOD":
            return "bg-custom-orange-food/10 text-custom-orange-food ";
        case "SHOP":
            return "bg-custom-purple-shop/10 text-custom-purple-shop";
        case "TRAVEL":
            return "bg-custom-blue-beauty/10 text-custom-blue-beauty";
        case "FUN":
            return "bg-custom-green-travel/10 text-custom-green-travel";
        case "BEAUTY":
            return "bg-custom-blue-beauty/10 text-custom-blue-beauty";
        default:
            return "bg-gray-50/10 text-gray-300 border-gray-200";
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
            className={`px-6 py-1 text-xs font-light rounded  ${getCategoryBadgeColor(category.toUpperCase())} ${className}`}
        >
            {category.toUpperCase()}
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
            className={`px-2 py-1 text-xs font-light rounded-full ${getStatusBadgeColor(status)} ${className}`}
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
    let baseClasses = "px-2 py-1 text-xs font-light";

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
        console.log(type);

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
            className={`px-6 py-1 rounded text-xs font-light ml-2 flex-shrink-0 ${getAgendaBadgeColor(type)} ${className}`}
        >
            {type}
        </span>
    );
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
    const getTodoBadgeColor = (status: string) => {
        switch (status) {
            case "En cours":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "En retard":
                return "bg-red-50 text-red-700 border-red-200";
            case "Terminé":
                return "bg-green-50 text-green-700 border-green-200";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <span
            className={`px-6 py-1 rounded text-xs font-normal ml-2 flex-shrink-0 ${getTodoBadgeColor(status)} ${className}`}
        >
            {status}
        </span>
    );
};
