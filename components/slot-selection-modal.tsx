"use client";

import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";


interface TimeSlot {
    id: string;
    date: string;
    time: string;
    isAvailable: boolean;
}

interface SlotSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSlot: (slot: TimeSlot) => void;
}

// Données factices pour les créneaux
const generateFakeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const today = new Date();

    // Générer des créneaux pour les 30 prochains jours
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);

        date.setDate(today.getDate() + i);
        
        // Générer 2-3 créneaux par jour
        const slotsPerDay = Math.floor(Math.random() * 2) + 2;
        
        for (let j = 0; j < slotsPerDay; j++) {
            const hour = 14 + j * 2; // 14h, 16h, 18h
            const isAvailable = Math.random() > 0.3; // 70% de chance d'être disponible
            
            slots.push({
                id: `${date.toISOString().split('T')[0]}-${hour}`,
                date: date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: `${hour}h00 - ${hour + 1}h00`,
                isAvailable
            });
        }
    }
    
    return slots;
};

const SlotSelectionModal: React.FC<SlotSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelectSlot
}) => {
    const [slots] = React.useState<TimeSlot[]>(generateFakeSlots());

    const handleSlotClick = (slot: TimeSlot) => {
        if (slot.isAvailable) {
            onSelectSlot(slot);
            onClose();
        }
    };

    const formatSlotDate = (slot: TimeSlot) => {
        return `${slot.date} - ${slot.time}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
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
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {slots.map((slot) => (
                            <div
                                key={slot.id}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                    slot.isAvailable
                                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                }`}
                                onClick={() => handleSlotClick(slot)}
                                role="button"
                                tabIndex={slot.isAvailable ? 0 : -1}
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
                                        className={`w-3 h-3 rounded-full ${
                                            slot.isAvailable ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    />
                                    <span className="text-sm text-gray-600">
                                        {slot.isAvailable ? 'Disponible' : 'Indisponible'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ModalBody>
                
                <ModalFooter>
                    <Button
                        color="default"
                        variant="light"
                        onPress={onClose}
                    >
                        Annuler
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SlotSelectionModal;
