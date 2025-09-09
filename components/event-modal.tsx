"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

import { FormLabel } from "./form-label";
import { useUser } from "@/contexts/user-context";

interface Event {
    id: string;
    title: string;
    type: "rendez-vous" | "tournage" | "publication" | "evenement";
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
    category: "siege" | "franchises" | "prestataires";
}

interface EventModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onEventAdded?: () => void;
}

export function EventModal({
    isOpen,
    onOpenChange,
    onEventAdded,
}: EventModalProps) {
    const { userProfile } = useUser();
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const [newEvent, setNewEvent] = useState({
        eventName: "",
        eventType: "",
        eventFor: "",
        eventDate: "",
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        description: "",
    });

    // Fonction utilitaire pour calculer l'heure de fin (+1h)
    const calculateEndTime = (startTime: string): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();

        startDate.setHours(hours, minutes, 0, 0);

        // Ajouter 1 heure
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        // Formatter en HH:MM
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

        return `${endHours}:${endMinutes}`;
    };

    // Fonctions de validation
    const validateField = (fieldName: string, value: any) => {
        const errors = { ...fieldErrors };

        switch (fieldName) {
            case 'eventName':
                if (!value || !value.trim()) {
                    errors[fieldName] = 'Le nom de l\'événement est requis';
                } else {
                    delete errors[fieldName];
                }
                break;
            case 'eventType':
                if (!value || !value.trim()) {
                    errors[fieldName] = 'Le type d\'événement est requis';
                } else {
                    delete errors[fieldName];
                }
                break;
            case 'eventFor':
                if (!value || !value.trim()) {
                    errors[fieldName] = 'Le destinataire est requis';
                } else {
                    delete errors[fieldName];
                }
                break;
            case 'eventDate':
                if (!value) {
                    errors[fieldName] = 'La date de l\'événement est requise';
                } else {
                    delete errors[fieldName];
                }
                break;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateAllFields = () => {
        let isValid = true;
        const fields = ['eventName', 'eventType', 'eventFor', 'eventDate'];

        fields.forEach(field => {
            const fieldValid = validateField(field, newEvent[field as keyof typeof newEvent]);
            if (!fieldValid) isValid = false;
        });

        return isValid;
    };

    const handleAddEvent = async () => {
        try {
            // Validation complète avant soumission
            if (!validateAllFields()) {
                setError("Veuillez corriger les erreurs dans le formulaire");
                return;
            }

            // Créer l'événement
            const eventData = {
                title: newEvent.eventName,
                type: "evenement" as Event["type"],
                date: newEvent.eventDate,
                startTime: newEvent.startTime,
                endTime: newEvent.endTime,
                location: newEvent.location || undefined,
                description: newEvent.description || undefined,
                category: "siege" as Event["category"], // Par défaut, peut être modifié selon eventFor
                collaborator: userProfile?.id,
            };

            const response = await fetch("/api/agenda", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'ajout de l'événement");
            }

            // Réinitialiser le formulaire
            setNewEvent({
                eventName: "",
                eventType: "",
                eventFor: "",
                eventDate: "",
                startTime: "09:00",
                endTime: "10:00",
                location: "",
                description: "",
            });
            onOpenChange(false);
            setError(null);
            setFieldErrors({});
            onEventAdded?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        }
    };

    const handleCancel = () => {
        setNewEvent({
            eventName: "",
            eventType: "",
            eventFor: "",
            eventDate: "",
            startTime: "09:00",
            endTime: "10:00",
            location: "",
            description: "",
        });
        setError(null);
        setFieldErrors({});
        onOpenChange(false);
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader className="flex justify-center">Ajouter un événement</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <FormLabel htmlFor="eventName" isRequired={false}>
                            Nom de l&apos;événement
                        </FormLabel>
                        <Input
                            isRequired
                            errorMessage={fieldErrors['eventName']}
                            id="eventName"
                            isInvalid={!!fieldErrors['eventName']}
                            placeholder="Nom de l'événement"
                            value={newEvent.eventName}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNewEvent((prev) => ({
                                    ...prev,
                                    eventName: value,
                                }));
                                validateField('eventName', value);
                            }}
                        />

                        <FormLabel htmlFor="eventType" isRequired={true}>
                            Type d&apos;événement
                        </FormLabel>
                        <Select
                            isRequired
                            errorMessage={fieldErrors['eventType']}
                            isInvalid={!!fieldErrors['eventType']}
                            placeholder="Sélectionner un type"
                            selectedKeys={newEvent.eventType ? [newEvent.eventType] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setNewEvent((prev) => ({
                                    ...prev,
                                    eventType: value,
                                }));
                                validateField('eventType', value);
                            }}
                        >
                            <SelectItem key="brunch">Brunch</SelectItem>
                            <SelectItem key="seminaire">Séminaire</SelectItem>
                            <SelectItem key="formation">Formation</SelectItem>
                            <SelectItem key="reunion">Réunion</SelectItem>
                            <SelectItem key="autre">Autre</SelectItem>
                        </Select>

                        <FormLabel htmlFor="eventFor" isRequired={true}>
                            Pour qui
                        </FormLabel>
                        <Select
                            isRequired
                            errorMessage={fieldErrors['eventFor']}
                            isInvalid={!!fieldErrors['eventFor']}
                            placeholder="Sélectionner un destinataire"
                            selectedKeys={newEvent.eventFor ? [newEvent.eventFor] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setNewEvent((prev) => ({
                                    ...prev,
                                    eventFor: value,
                                }));
                                validateField('eventFor', value);
                            }}
                        >
                            <SelectItem key="franchises">Franchisés</SelectItem>
                            <SelectItem key="sieges">Sièges</SelectItem>
                            <SelectItem key="partenaires">Partenaires</SelectItem>
                        </Select>

                        <FormLabel htmlFor="eventDate" isRequired={true}>
                            Date de l&apos;événement
                        </FormLabel>
                        <Input
                            isRequired
                            errorMessage={fieldErrors['eventDate']}
                            id="eventDate"
                            isInvalid={!!fieldErrors['eventDate']}
                            type="date"
                            value={newEvent.eventDate}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNewEvent((prev) => ({
                                    ...prev,
                                    eventDate: value,
                                }));
                                validateField('eventDate', value);
                            }}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                isRequired
                                type="time"
                                value={newEvent.startTime}
                                onChange={(e) => {
                                    const startTime = e.target.value;
                                    const endTime = calculateEndTime(startTime);
                                    setNewEvent((prev) => ({
                                        ...prev,
                                        startTime: startTime,
                                        endTime: endTime,
                                    }));
                                }}
                            />
                            <Input
                                isRequired
                                type="time"
                                value={newEvent.endTime}
                                onChange={(e) =>
                                    setNewEvent((prev) => ({
                                        ...prev,
                                        endTime: e.target.value,
                                    }))
                                }
                            />
                        </div>


                    </div>
                </ModalBody>
                <ModalFooter className="flex justify-between">
                    <Button
                        className="flex-1 border-1"
                        color='primary'
                        variant="bordered"
                        onPress={handleCancel}
                    >
                        Annuler l&apos;événement
                    </Button>
                    <Button
                        className="flex-1"
                        color='primary'
                        isDisabled={
                            Object.keys(fieldErrors).length > 0 ||
                            !newEvent.eventName ||
                            !newEvent.eventType ||
                            !newEvent.eventFor ||
                            !newEvent.eventDate
                        }
                        onPress={handleAddEvent}
                    >
                        Ajouter l&apos;événement
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
