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
            return "bg-orange-50 text-orange-700 border-orange-200";
        case "SHOP":
            return "bg-purple-50 text-purple-700 border-purple-200";
        case "TRAVEL":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "FUN":
            return "bg-green-50 text-green-700 border-green-200";
        case "BEAUTY":
            return "bg-pink-50 text-pink-700 border-pink-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
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
            className={`px-6 py-1 text-xs font-medium rounded  ${getCategoryBadgeColor(category.toUpperCase())} ${className}`}
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
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(status)} ${className}`}
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
    let baseClasses = "px-2 py-1 text-xs font-medium";

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
