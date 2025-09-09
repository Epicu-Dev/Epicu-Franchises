"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import SlotSelectionModal from "./slot-selection-modal";

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

const SlotSelectionModalExample: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

    const handleSelectSlot = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        console.log("Créneau sélectionné:", slot);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Exemple d'utilisation du modal de sélection de créneaux</h2>
            
            <div className="space-y-2">
                <Button 
                    color="primary" 
                    onPress={handleOpenModal}
                >
                    Ouvrir le modal de sélection de créneaux
                </Button>
                
                {selectedSlot && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800">Créneau sélectionné :</h3>
                        <p className="text-green-700">
                            <strong>Date :</strong> {new Date(selectedSlot.DATE).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-green-700">
                            <strong>Heure :</strong> {selectedSlot.HEURE}
                        </p>
                        <p className="text-green-700">
                            <strong>Jour :</strong> {selectedSlot.JOUR}
                        </p>
                        <p className="text-green-700">
                            <strong>Statut :</strong> {selectedSlot.STATUT_DE_PUBLICATION}
                        </p>
                        {selectedSlot.CATEGORIE.length > 0 && (
                            <p className="text-green-700">
                                <strong>Catégories :</strong> {selectedSlot.CATEGORIE.join(', ')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <SlotSelectionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSelectSlot={handleSelectSlot}
                // Exemples de paramètres optionnels
                category="Restaurant" // Filtre par catégorie
                ville="Paris" // Filtre par ville
                // startDate non fourni = utilise la date du jour par défaut
            />
        </div>
    );
};

export default SlotSelectionModalExample;