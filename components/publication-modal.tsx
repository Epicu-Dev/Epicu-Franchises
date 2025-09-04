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


interface PublicationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAddPublication: (publication: Omit<Publication, 'id'>) => void;
    onUpdatePublication?: (publication: Publication) => void;
    editingPublication?: Publication | null;
    isLoading?: boolean;
}

export default function PublicationModal({
    isOpen,
    onOpenChange,
    onAddPublication,
    onUpdatePublication,
    editingPublication,
    isLoading = false
}: PublicationModalProps) {
    const [formData, setFormData] = React.useState({
        datePublication: "",
        dateEnvoiFactureCreation: "",
        montantFactureTournage: "",
        factureTournage: "En attente" as "Payée" | "En attente" | "En retard",
        dateEnvoiFacturePublication: "",
        montantFacturePublication: "",
        facturePublication: "En attente" as "Payée" | "En attente" | "En retard",
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

    // Fonction de validation des champs requis
    const validateRequiredFields = () => {
        const requiredFields = [
            'datePublication',
            'dateEnvoiFactureCreation',
            'montantFactureTournage',
            'dateEnvoiFacturePublication',
            'montantFacturePublication',
            'montantSponsorisation',
            'montantAddition',
            'benefice',
            'montantCadeau'
        ];

        return requiredFields.every(field => {
            const value = formData[field as keyof typeof formData];

            return value !== "" && value !== 0;
        });
    };

    // Initialiser le formulaire avec les données de la publication en cours d'édition
    React.useEffect(() => {
        if (editingPublication) {
            setFormData({
                datePublication: editingPublication.datePublication,
                dateEnvoiFactureCreation: editingPublication.dateEnvoiFactureCreation,
                montantFactureTournage: editingPublication.montantFactureTournage,
                factureTournage: editingPublication.factureTournage,
                dateEnvoiFacturePublication: editingPublication.dateEnvoiFacturePublication,
                montantFacturePublication: editingPublication.montantFacturePublication,
                facturePublication: editingPublication.facturePublication,
                montantSponsorisation: editingPublication.montantSponsorisation,
                montantAddition: editingPublication.montantAddition,
                benefice: editingPublication.benefice,
                cadeauGerant: editingPublication.cadeauGerant,
                montantCadeau: editingPublication.montantCadeau,
                tirageEffectue: editingPublication.tirageEffectue,
                nombreVues: editingPublication.nombreVues,
                nombreAbonnes: editingPublication.nombreAbonnes,
                commentaire: editingPublication.commentaire || ""
            });
        } else {
            // Reset form pour nouvelle publication
            setFormData({
                datePublication: "",
                dateEnvoiFactureCreation: "",
                montantFactureTournage: "",
                factureTournage: "En attente",
                dateEnvoiFacturePublication: "",
                montantFacturePublication: "",
                facturePublication: "En attente",
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
    }, [editingPublication, isOpen]);

    const handleSubmit = () => {
        if (editingPublication && onUpdatePublication) {
            // Mode édition
            const updatedPublication: Publication = {
                ...editingPublication,
                ...formData
            };

            onUpdatePublication(updatedPublication);
        } else {
            // Mode création
            onAddPublication(formData);
        }

        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
        // Reset form
        setFormData({
            datePublication: "",
            dateEnvoiFactureCreation: "",
            montantFactureTournage: "",
            factureTournage: "En attente",
            dateEnvoiFacturePublication: "",
            montantFacturePublication: "",
            facturePublication: "En attente",
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
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                scrollBehavior="inside"
                size="2xl"
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
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="datePublication"
                                    type="date"
                                    value={formData.datePublication}
                                    onChange={(e) =>
                                        setFormData({ ...formData, datePublication: e.target.value })
                                    }
                                />
                            </div>

                            {/* Date d'envoi facture création de contenu */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="dateEnvoiFactureCreation" isRequired={true}>
                                    Date d&apos;envoi facture création de contenu
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="dateEnvoiFactureCreation"
                                    type="date"
                                    value={formData.dateEnvoiFactureCreation}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dateEnvoiFactureCreation: e.target.value })
                                    }
                                />
                            </div>

                            {/* Montant de la facture (tournage) */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="montantFactureTournage" isRequired={true}>
                                    Montant de la facture (tournage)
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantFactureTournage"
                                    placeholder="500€"
                                    value={formData.montantFactureTournage}
                                    onChange={(e) =>
                                        setFormData({ ...formData, montantFactureTournage: e.target.value })
                                    }
                                />
                            </div>

                            {/* Facture du tournage */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="factureTournage" isRequired={true}>
                                    Facture du tournage
                                </FormLabel>
                                <StyledSelect
                                    isRequired
                                    id="factureTournage"
                                    selectedKeys={[formData.factureTournage]}
                                    onSelectionChange={(keys) =>
                                        setFormData({
                                            ...formData,
                                            factureTournage: Array.from(keys)[0] as "Payée" | "En attente" | "En retard"
                                        })
                                    }
                                >
                                    <SelectItem key="Payée">Payée</SelectItem>
                                    <SelectItem key="En attente">En attente</SelectItem>
                                    <SelectItem key="En retard">En retard</SelectItem>
                                </StyledSelect>
                            </div>

                            {/* Date d'envoi facture de publication */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="dateEnvoiFacturePublication" isRequired={true}>
                                    Date d&apos;envoi facture de publication
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="dateEnvoiFacturePublication"
                                    type="date"
                                    value={formData.dateEnvoiFacturePublication}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dateEnvoiFacturePublication: e.target.value })
                                    }
                                />
                            </div>

                            {/* Montant de la facture (publication) */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="montantFacturePublication" isRequired={true}>
                                    Montant de la facture (publication)
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="montantFacturePublication"
                                    placeholder="750€"
                                    value={formData.montantFacturePublication}
                                    onChange={(e) =>
                                        setFormData({ ...formData, montantFacturePublication: e.target.value })
                                    }
                                />
                            </div>

                            {/* Facture de publication */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="facturePublication" isRequired={true}>
                                    Facture de publication
                                </FormLabel>
                                <StyledSelect
                                    isRequired
                                    id="facturePublication"
                                    selectedKeys={[formData.facturePublication]}
                                    onSelectionChange={(keys) =>
                                        setFormData({
                                            ...formData,
                                            facturePublication: Array.from(keys)[0] as "Payée" | "En attente" | "En retard"
                                        })
                                    }
                                >
                                    <SelectItem key="Payée">Payée</SelectItem>
                                    <SelectItem key="En attente">En attente</SelectItem>
                                    <SelectItem key="En retard">En retard</SelectItem>
                                </StyledSelect>
                            </div>

                            {/* Montant de la sponsorisation */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="montantSponsorisation" isRequired={true}>
                                    Montant de la sponsorisation
                                </FormLabel>
                                <Input
                                    isRequired
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
                                <FormLabel htmlFor="montantAddition" isRequired={true}>
                                    Montant de l&apos;addition
                                </FormLabel>
                                <Input
                                    isRequired
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

                            {/* Bénéfice */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="benefice" isRequired={true}>
                                    Bénéfice
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="benefice"
                                    placeholder="1000€"
                                    value={formData.benefice}
                                    onChange={(e) =>
                                        setFormData({ ...formData, benefice: e.target.value })
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
                                <FormLabel htmlFor="montantCadeau" isRequired={true}>
                                    Montant du cadeau
                                </FormLabel>
                                <Input
                                    isRequired
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
                                <FormLabel htmlFor="nombreVues" isRequired={true}>
                                    Nombre de vues
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="nombreVues"
                                    placeholder="139.973"
                                    type="number"
                                    value={formData.nombreVues.toString()}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombreVues: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>

                            {/* Nombre d'abonnés fait gagnés aux gérants */}
                            <div className="space-y-4">
                                <FormLabel htmlFor="nombreAbonnes" isRequired={true}>
                                    Nombre d&apos;abonnés fait gagnés aux gérants
                                </FormLabel>
                                <Input
                                    isRequired
                                    classNames={{
                                        inputWrapper: "bg-page-bg",
                                    }}
                                    id="nombreAbonnes"
                                    placeholder="139.973"
                                    type="number"
                                    value={formData.nombreAbonnes.toString()}
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
                                {editingPublication ? "Modifier" : "Ajouter"}
                            </Button>
                        </div>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </>
    );
}
