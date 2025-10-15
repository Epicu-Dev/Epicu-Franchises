"use client";

import React from "react";
import { Input } from "@heroui/input";
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
import { Switch } from "@heroui/switch";

import { FormLabel, StyledSelect } from "@/components";
import { Publication } from "@/types/publication";
import { useAuthFetch } from "@/hooks/use-auth-fetch";


interface PublicationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onPublicationAdded: (newPublication?: Publication) => void;
    editingPublication?: Publication | null;
    etablissementId?: string;
}

export default function PublicationModal({
    isOpen,
    onOpenChange,
    onPublicationAdded,
    editingPublication,
    etablissementId
}: PublicationModalProps) {
    const { authFetch } = useAuthFetch();
    const [formData, setFormData] = React.useState({
        datePublication: "",
        montantSponsorisation: "",
        montantAddition: "",
        benefice: "",
        cadeauGerant: "",
        montantCadeau: "",
        tirageEffectue: false,
        nombreVues: 0,
        nombreAbonnes: 0,
        commentaire: ""
    });
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    // Fonction de validation des champs requis
    const validateRequiredFields = () => {
        const requiredFields = [
            'datePublication'
        ];

        const fieldsValid = requiredFields.every(field => {
            const value = formData[field as keyof typeof formData];

            return value !== "" && value !== 0;
        });

        // Vérifier que l'établissement est fourni
        const etablissementValid = !!etablissementId;

        return fieldsValid && etablissementValid;
    };

    // Initialiser le formulaire avec les données de la publication en cours d'édition
    React.useEffect(() => {
        if (editingPublication) {
            setFormData({
                datePublication: editingPublication.datePublication || "",
                montantSponsorisation: editingPublication.montantSponsorisation || "",
                montantAddition: editingPublication.montantAddition || "",
                benefice: editingPublication.benefice || "",
                cadeauGerant: editingPublication.cadeauGerant || "",
                montantCadeau: editingPublication.montantCadeau || "",
                tirageEffectue: editingPublication.tirageEffectue || false,
                nombreVues: editingPublication.nombreVues || 0,
                nombreAbonnes: editingPublication.nombreAbonnes || 0,
                commentaire: editingPublication.commentaire || ""
            });
        } else {
            // Reset form pour nouvelle publication
            setFormData({
                datePublication: "",
                montantSponsorisation: "",
                montantAddition: "",
                benefice: "",
                cadeauGerant: "",
                montantCadeau: "",
                tirageEffectue: false,
                nombreVues: 0,
                nombreAbonnes: 0,
                commentaire: ""
            });
        }
        setError(null);
    }, [editingPublication, isOpen]);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Validation complète avant soumission
            if (!validateRequiredFields()) {
                if (!etablissementId) {
                    setError("L'établissement est obligatoire");
                } else {
                    setError("Veuillez remplir tous les champs requis");
                }
                setIsLoading(false);

                return;
            }

            // Fonction pour nettoyer les montants (enlever € et convertir en nombre)
            const cleanAmount = (value: string | number | undefined): number | null => {
                if (!value) return null;

                // Convertir en chaîne si c'est un nombre
                const stringValue = String(value);

                if (stringValue.trim() === '') return null;

                const cleaned = stringValue.replace(/[€\s,]/g, '').replace(',', '.');
                const num = parseFloat(cleaned);

                return isNaN(num) ? null : num;
            };

            // Adapter les données pour l'API
            const publicationData: Record<string, any> = {
                datePublication: formData.datePublication,
                montantSponsorisation: cleanAmount(formData.montantSponsorisation),
                montantAddition: cleanAmount(formData.montantAddition),
                nombreAbonnes: cleanAmount(formData.nombreAbonnes),
                cadeauGerant: formData.cadeauGerant,
                montantCadeau: cleanAmount(formData.montantCadeau),
                tirageEffectue: formData.tirageEffectue,
                commentaire: formData.commentaire,
                vues: formData.nombreVues,
                // Ajouter l'établissement si fourni
                ...(etablissementId && { etablissementId: etablissementId }),
                // Note: L'API ne semble pas gérer tous les champs de facturation
                // Ces champs pourraient nécessiter une table séparée ou une extension de l'API
            };

            let url: string;
            let method: string;

            if (editingPublication) {
                // Mise à jour - utiliser l'API avec PATCH
                url = `/api/publications?id=${encodeURIComponent(editingPublication.id)}`;
                method = "PATCH";
            } else {
                // Création - utiliser l'API
                url = "/api/publications";
                method = "POST";
            }

            const response = await authFetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(publicationData),
            });

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(errorData.error || `Erreur lors de ${editingPublication ? 'la modification' : 'l\'ajout'} de la publication`);
            }

            const responseData = await response.json();
            
            // Créer l'objet Publication à partir de la réponse
            const publication: Publication = {
                id: responseData.id,
                datePublication: formData.datePublication,
                montantSponsorisation: formData.montantSponsorisation,
                montantAddition: formData.montantAddition,
                benefice: formData.benefice,
                cadeauGerant: formData.cadeauGerant,
                montantCadeau: formData.montantCadeau,
                tirageEffectue: formData.tirageEffectue,
                nombreVues: formData.nombreVues,
                nombreAbonnes: formData.nombreAbonnes,
                commentaire: formData.commentaire,
                nom: `${formData.datePublication} Publication`
            };

            // Réinitialiser le formulaire et fermer le modal
            setFormData({
                datePublication: "",
                montantSponsorisation: "",
                montantAddition: "",
                benefice: "",
                cadeauGerant: "",
                montantCadeau: "",
                tirageEffectue: false,
                nombreVues: 0,
                nombreAbonnes: 0,
                commentaire: ""
            });
            setError(null);
            setIsLoading(false);
            onOpenChange(false);
            onPublicationAdded(publication);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setError(null);
        setFormData({
            datePublication: "",
            montantSponsorisation: "",
            montantAddition: "",
            benefice: "",
            cadeauGerant: "",
            montantCadeau: "",
            tirageEffectue: false,
            nombreVues: 0,
            nombreAbonnes: 0,
            commentaire: ""
        });
        onOpenChange(false);
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            className="pb-20 md:pb-0"
            onOpenChange={onOpenChange}
        >
                <ModalContent>
                    <ModalHeader className="flex justify-center">
                        {editingPublication ? "Modifier la publication" : "Ajouter une publication"}
                    </ModalHeader>

                    <ModalBody className="max-h-[70vh] overflow-y-auto">
                        <div className="space-y-6">
                            {/* Date de publication */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="datePublication" isRequired={true}>
                                    Date de publication
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg hover:!bg-page-bg focus-within:!bg-page-bg data-[focus=true]:!bg-page-bg data-[hover=true]:!bg-page-bg",
                                        input: formData.datePublication ? "text-black" : "text-gray-300"
                                    }}
                                    color={formData.datePublication ? "default" : "danger"}
                                    id="datePublication"
                                    type="date"
                                    value={formData.datePublication}
                                    onChange={(e) =>
                                        setFormData({ ...formData, datePublication: e.target.value })
                                    }
                                />
                            </div>

                            {/* Montant de la sponsorisation */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="montantSponsorisation" isRequired={false}>
                                    Montant de la sponsorisation
                                </FormLabel>
                                <Input
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantSponsorisation"
                                    placeholder="150€"
                                    value={formData.montantSponsorisation}
                                    onChange={(e) =>
                                        setFormData({ ...formData, montantSponsorisation: e.target.value })
                                    }
                                />
                            </div>

                            {/* Montant de l'addition */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="montantAddition" isRequired={false}>
                                    Montant de l&apos;addition
                                </FormLabel>
                                <Input
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantAddition"
                                    placeholder="100€"
                                    value={formData.montantAddition}
                                    onChange={(e) =>
                                        setFormData({ ...formData, montantAddition: e.target.value })
                                    }
                                />
                            </div>


                            {/* Cadeau du gérant pour le jeu concours */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="cadeauGerant" isRequired={false}>
                                    Cadeau du gérant pour le jeu concours
                                </FormLabel>
                                <Textarea
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="cadeauGerant"
                                    minRows={3}
                                    placeholder="—"
                                    value={formData.cadeauGerant}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cadeauGerant: e.target.value })
                                    }
                                />
                            </div>

                            {/* Montant du cadeau */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="montantCadeau" isRequired={false}>
                                    Montant du cadeau
                                </FormLabel>
                                <Input
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantCadeau"
                                    placeholder="150€"
                                    value={formData.montantCadeau}
                                    onChange={(e) =>
                                        setFormData({ ...formData, montantCadeau: e.target.value })
                                    }
                                />
                            </div>

                            {/* Tirage au sort effectué */}
                            <div className="flex items-center justify-between">
                                <span className="text-base">Tirage au sort effectué</span>
                                <Switch
                                    isSelected={formData.tirageEffectue}
                                    onValueChange={(checked) =>
                                        setFormData({ ...formData, tirageEffectue: checked })
                                    }
                                />
                            </div>

                            {/* Nombre de vues */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="nombreVues" isRequired={false}>
                                    Nombre de vues à 30 jours
                                </FormLabel>
                                <Input
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="nombreVues"
                                    placeholder="139.973"
                                    type="number"
                                    value={(formData.nombreVues || 0).toString()}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombreVues: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>

                            {/* Nombre d'abonnés fait gagnés aux gérants */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="nombreAbonnes" isRequired={false}>
                                    Nombre d&apos;abonnés fait gagnés aux gérants à 30 jours
                                </FormLabel>
                                <Input
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="nombreAbonnes"
                                    placeholder="139.973"
                                    type="number"
                                    value={(formData.nombreAbonnes || 0).toString()}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombreAbonnes: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>

                            {/* Commentaire */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="commentaire" isRequired={false}>
                                    Commentaire
                                </FormLabel>
                                <Textarea
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="commentaire"
                                    minRows={3}
                                    placeholder="—"
                                    value={formData.commentaire}
                                    onChange={(e) =>
                                        setFormData({ ...formData, commentaire: e.target.value })
                                    }
                                />
                            </div>

                            
                        </div>
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
                                onPress={handleCancel}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1"
                                color='primary'
                                isDisabled={isLoading || !validateRequiredFields()}
                                isLoading={isLoading}
                                onPress={handleSubmit}
                            >
                                {isLoading ? 'Chargement...' : (editingPublication ? "Modifier" : "Ajouter")}
                            </Button>
                        </div>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </>
    );
}
