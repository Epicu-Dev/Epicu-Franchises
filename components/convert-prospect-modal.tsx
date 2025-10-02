"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { SelectItem } from "@heroui/select";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";

import { FormLabel } from "@/components";
import { StyledSelect } from "@/components/styled-select";
import { Prospect } from "@/types/prospect";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useToastContext } from "@/contexts/toast-context";

type ProspectStatus = "À contacter" | "Contacté" | "En discussion" | "Glacial" | "Client";

interface ConvertProspectModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    prospect: Prospect | null;
    onInteractionCreated?: (conversionData?: { prospectId: string; newStatus: string }) => void;
}

export default function ConvertProspectModal({
    isOpen,
    onOpenChange,
    prospect,
    onInteractionCreated
}: ConvertProspectModalProps) {
    const { authFetch } = useAuthFetch();
    const { showSuccess, showError } = useToastContext();
    const [status, setStatus] = useState<ProspectStatus | null>(null);
    const [comment, setComment] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fonction pour convertir le statut front vers API
    const convertStatusForAPI = (frontStatus: ProspectStatus): string => {
        if (frontStatus === "Glacial") {
            return "Pas intéressé";
        }
        return frontStatus;
    };

    const handleSubmit = async () => {
        if (!prospect || !status) {
            setError("Veuillez sélectionner un statut");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const interactionData = {
                etablissement: prospect.id,
                dateInteraction: new Date().toISOString().split('T')[0], // Date du jour
                statut: convertStatusForAPI(status),
                commentaire: comment,
                prochainRdv: null
            };

            const response = await authFetch('/api/interaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(interactionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || "Erreur lors de la création de l'interaction";
                showError(errorMessage);
                throw new Error(errorMessage);
            }

            // Afficher le toast de succès
            showSuccess('Prospect converti avec succès');

            // Préparer les données de conversion à retourner
            const conversionData = {
                prospectId: prospect.id,
                newStatus: convertStatusForAPI(status)
            };

            // Réinitialiser le formulaire
            setStatus(null);
            setComment("");
            onOpenChange(false);
            
            // Notifier le parent que l'interaction a été créée avec les données de conversion
            if (onInteractionCreated) {
                onInteractionCreated(conversionData);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStatus(null);
        setComment("");
        setError(null);
        onOpenChange(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            className="pb-20 md:pb-0"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                <ModalHeader className="flex justify-center">
                    Convertir le prospect
                </ModalHeader>

                <ModalBody className="max-h-[70vh] overflow-y-auto">
                    {prospect && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <FormLabel htmlFor="status" isRequired={true}>
                                    Statut
                                </FormLabel>
                                <StyledSelect
                                    isRequired
                                    id="status"
                                    placeholder="Sélectionner un statut"
                                    selectedKeys={status ? [status] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedStatus = Array.from(keys)[0] as ProspectStatus;
                                        setStatus(selectedStatus);
                                    }}
                                >
                                    <SelectItem key="À contacter">À contacter</SelectItem>
                                    <SelectItem key="Contacté">Contacté</SelectItem>
                                    <SelectItem key="En discussion">En discussion</SelectItem>
                                    <SelectItem key="Glacial">Glacial</SelectItem>
                                    <SelectItem key="Client">Client</SelectItem>
                                </StyledSelect>

                                <FormLabel htmlFor="comment" isRequired={false}>
                                    Commentaire
                                </FormLabel>
                                <Textarea
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="comment"
                                    minRows={4}
                                    placeholder="Ajouter un commentaire..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="flex flex-col gap-3">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center w-full">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}
                    <div className="flex justify-between gap-3">
                        <Button
                            className="flex-1 border-1"
                            color='primary'
                            isDisabled={isLoading}
                            variant="bordered"
                            onPress={handleClose}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            color='primary'
                            isDisabled={isLoading || !status}
                            isLoading={isLoading}
                            onPress={handleSubmit}
                        >
                            {isLoading ? 'Chargement...' : 'Basculer'}
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
