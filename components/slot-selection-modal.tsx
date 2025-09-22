"use client";

import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";

import { useAuthFetch } from "../hooks/use-auth-fetch";

// Helper pour convertir les IDs de statut en texte lisible
const getStatusText = (statusId: string): string => {
    switch (statusId) {
        case 'recfExTXxcNivX1i4':
            return '🟩 Libre';
        case 'recsdyl2X41rpj7LG':
            return '🟥 Indisponible';
        default:
            return statusId; // Retourner l'ID si on ne le reconnaît pas
    }
};

interface TimeSlot {
    id: string;
    DATE: string;
    CATEGORIE: string[];
    JOUR: string;
    DATE_DE_PUBLICATION: string;
    HEURE: string;
    STATUT_DE_PUBLICATION: string;
    isAvailable: boolean;
}

interface SlotSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSlot: (slot: TimeSlot) => void;
    category?: string;
    ville?: string;
    startDate?: string;
}

// Fonction pour récupérer les créneaux depuis l'API
const fetchSlots = async (authFetch: any, category?: string, ville?: string, startDate?: string): Promise<TimeSlot[]> => {
    try {
        const params = new URLSearchParams();

        if (category) params.set('categorie', category);
        if (ville) params.set('ville', ville);

        // Utiliser la date fournie ou la date du jour par défaut
        const dateToUse = startDate || new Date().toISOString().split('T')[0];

        params.set('start', dateToUse);
        params.set('limit', '100'); // Récupérer plus de créneaux

        const response = await authFetch(`/api/publications/creneaux?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();

        // Transformer les données de l'API en format TimeSlot
        return data.results?.map((slot: any) => ({
            id: slot.id,
            DATE: slot.DATE,
            CATEGORIE: slot.CATEGORIE || [],
            JOUR: slot.JOUR,
            DATE_DE_PUBLICATION: slot.DATE_DE_PUBLICATION,
            HEURE: slot.HEURE,
            STATUT_DE_PUBLICATION: slot.STATUT_DE_PUBLICATION,
            isAvailable: slot.STATUT_DE_PUBLICATION[0] == 'recfExTXxcNivX1i4' // Libre
        })) || [];
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erreur lors de la récupération des créneaux:', error);

        return [];
    }
};

const SlotSelectionModal: React.FC<SlotSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelectSlot,
    category,
    ville,
    startDate
}) => {
    const { authFetch } = useAuthFetch();
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Charger les créneaux quand le modal s'ouvre
    useEffect(() => {
        if (isOpen) {
            loadSlots();
        }
    }, [isOpen, category, ville, startDate]);

    const loadSlots = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedSlots = await fetchSlots(authFetch, category, ville, startDate);

            setSlots(fetchedSlots);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des créneaux');
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (slot: TimeSlot) => {
        if (slot.isAvailable) {
            onSelectSlot(slot);
            onClose();
        }
    };

    const formatSlotDate = (slot: TimeSlot) => {
        // Formater la date depuis le format ISO
        const date = new Date(slot.DATE);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `${formattedDate} - ${slot.HEURE}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            className="pb-20 md:pb-0"
            onClose={onClose}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">Sélectionner un créneau</h3>
                    <p className="text-sm text-gray-600">
                        Choisissez un créneau disponible pour la publication
                    </p>
                </ModalHeader>

                <ModalBody>
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-gray-600">Chargement des créneaux...</div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="text-red-800 text-sm">{error}</div>
                            <Button
                                className="mt-2"
                                color="danger"
                                size="sm"
                                variant="light"
                                onPress={loadSlots}
                            >
                                Réessayer
                            </Button>
                        </div>
                    )}

                    {!loading && !error && slots.length === 0 && (
                        <div className="text-center py-8 text-gray-600">
                            Aucun créneau disponible pour les critères sélectionnés.
                        </div>
                    )}

                    {!loading && !error && slots.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {slots.map((slot) => (
                                <div
                                    key={slot.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${slot.isAvailable
                                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                        }`}
                                    role="button"
                                    tabIndex={slot.isAvailable ? 0 : -1}
                                    onClick={() => handleSlotClick(slot)}
                                    onKeyDown={(e) => {
                                        if (slot.isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            handleSlotClick(slot);
                                        }
                                    }}
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {formatSlotDate(slot)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${slot.isAvailable ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                        />
                                        <span className="text-sm text-gray-600">
                                            {slot.isAvailable ? 'Disponible' : 'Indisponible'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ModalBody>

                <ModalFooter>
                    <div className="flex justify-between w-full">
                        <Button
                            color="default"
                            isLoading={loading}
                            variant="light"
                            onPress={loadSlots}
                        >
                            Rafraîchir
                        </Button>
                        <Button
                            color="default"
                            variant="light"
                            onPress={onClose}
                        >
                            Annuler
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SlotSelectionModal;
