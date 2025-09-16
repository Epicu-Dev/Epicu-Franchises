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
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";

import PublicationModal from "./publication-modal";

import { FormLabel, CategoryBadge } from "@/components";
import { StyledSelect } from "@/components/styled-select";
import { Client } from "@/types/client";
import { Publication } from "@/types/publication";

interface ClientModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingClient: Client | null;
    setEditingClient: React.Dispatch<React.SetStateAction<Client | null>>;
    categories: Array<{ id: string, name: string }>;
    onUpdateClient: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export default function ClientModal({
    isOpen,
    onOpenChange,
    editingClient,
    setEditingClient,
    categories,
    onUpdateClient,
    isLoading,
    error
}: ClientModalProps) {
    const [isPublicationModalOpen, setIsPublicationModalOpen] = React.useState(false);
    const [publications, setPublications] = React.useState<Publication[]>(editingClient?.publications || []);
    const [editingPublication, setEditingPublication] = React.useState<Publication | null>(null);

    // Fonction de validation des champs requis
    const validateRequiredFields = () => {
        if (!editingClient) return false;

        const requiredFields = [
            'categorie',
            'nomEtablissement',
            'raisonSociale',
            'siret',
            'ville',
            'telephone',
            'email',
        ];

        return requiredFields.every(field => {
            const value = editingClient[field as keyof Client];

            return value !== "" && value !== null && value !== undefined;
        });
    };

    // Mettre à jour les publications quand editingClient change
    React.useEffect(() => {
        setPublications(editingClient?.publications || []);
    }, [editingClient]);


    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                <ModalHeader className="flex justify-center">
                    Modifier le client
                </ModalHeader>

                <ModalBody className="max-h-[70vh] overflow-y-auto">
                    {editingClient && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                Informations générales
                            </h3>
                            <FormLabel htmlFor="categorie" isRequired={true}>
                                Catégorie
                            </FormLabel>
                            <StyledSelect
                                isRequired
                                id="categorie"
                                placeholder="Sélectionner une catégorie"
                                selectedKeys={
                                    editingClient.categorie ? [editingClient.categorie] : []
                                }
                                onSelectionChange={(keys) =>
                                    setEditingClient(
                                        editingClient
                                            ? {
                                                ...editingClient,
                                                categorie: Array.from(keys)[0] as string,
                                            }
                                            : null
                                    )
                                }
                            >
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <SelectItem key={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem key="loading">Chargement...</SelectItem>
                                )}
                            </StyledSelect>

                            <FormLabel htmlFor="nomEtablissement" isRequired={true}>
                                Nom établissement
                            </FormLabel>
                            <Input
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-page-bg",
                                }}
                                id="nomEtablissement"
                                placeholder="Nom de l'établissement"
                                value={editingClient.nomEtablissement}
                                onChange={(e) =>
                                    setEditingClient(
                                        editingClient ? { ...editingClient, nomEtablissement: e.target.value } : null
                                    )
                                }
                            />

                            <FormLabel htmlFor="raisonSociale" isRequired={true}>
                                Raison sociale
                            </FormLabel>
                            <Input
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-page-bg",
                                }}
                                id="raisonSociale"
                                placeholder="Raison sociale"
                                value={editingClient.raisonSociale || ""}
                                onChange={(e) =>
                                    setEditingClient(
                                        editingClient ? { ...editingClient, raisonSociale: e.target.value } : null
                                    )
                                }
                            />

                            <FormLabel htmlFor="numeroSiret" isRequired={true}>
                                Numéro de SIRET
                            </FormLabel>
                            <Input
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-page-bg",
                                }}
                                id="numeroSiret"
                                placeholder="12345678901234"
                                value={editingClient.siret || ""}
                                onChange={(e) =>
                                    setEditingClient(
                                        editingClient ? { ...editingClient, siret: e.target.value } : null
                                    )
                                }
                            />

                            <FormLabel htmlFor="ville" isRequired={true}>
                                Ville
                            </FormLabel>
                            <Input
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-page-bg",
                                }}
                                id="ville"
                                placeholder="Paris"
                                value={editingClient.ville || ""}
                                onChange={(e) =>
                                    setEditingClient(
                                        editingClient ? { ...editingClient, ville: e.target.value } : null
                                    )
                                }
                            />

                            <FormLabel htmlFor="telephone" isRequired={true}>
                                Téléphone
                            </FormLabel>
                            <Input
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-page-bg",
                                }}
                                id="telephone"
                                placeholder="01 23 45 67 89"
                                value={editingClient.telephone || ""}
                                onChange={(e) =>
                                    setEditingClient(
                                        editingClient ? { ...editingClient, telephone: e.target.value } : null
                                    )
                                }
                            />

                            <FormLabel htmlFor="email" isRequired={true}>
                                Mail
                            </FormLabel>
                            <Input
                                isRequired
                                classNames={{
                                    inputWrapper: "bg-page-bg",
                                }}
                                id="email"
                                placeholder="contact@etablissement.fr"
                                type="email"
                                value={editingClient.email || ""}
                                onChange={(e) =>
                                    setEditingClient(
                                        editingClient ? { ...editingClient, email: e.target.value } : null
                                    )
                                }
                            />

                         

                            {/* Publications */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Publications
                                </h3>

                                {/* Liste des publications existantes */}
                                {publications.map((publication, index) => (
                                    <div
                                        key={publication.id}
                                        className="bg-page-bg p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            // Ouvrir le modal d'édition de publication
                                            setEditingPublication(publication);
                                            setIsPublicationModalOpen(true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setEditingPublication(publication);
                                                setIsPublicationModalOpen(true);
                                            }
                                        }}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {(() => {
                                                        const nom = publication.nom || `Publication ${index + 1}`;
                                                        // Si le nom commence par une date au format yyyy-MM-dd, la formater
                                                        const dateMatch = nom.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
                                                        if (dateMatch) {
                                                            const [, dateStr, rest] = dateMatch;
                                                            const formattedDate = new Date(dateStr).toLocaleDateString('fr-FR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            }).replace(/\//g, '.');
                                                            return `${formattedDate} ${rest}`;
                                                        }
                                                        return nom;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <div>Date de publication: {new Date(publication.datePublication).toLocaleDateString('fr-FR')}</div>
                                                
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 " />
                                    </div>
                                ))}

                                {/* Bouton pour ajouter une publication */}
                                <Button
                                    className="border-1"
                                    color="primary"
                                    variant="bordered"
                                    onPress={() => {
                                        setEditingPublication(null);
                                        setIsPublicationModalOpen(true);
                                    }}
                                >

                                    Ajouter une publication
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                </Button>
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
                            onPress={() => {
                                onOpenChange(false);
                                setEditingClient(null);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            color='primary'
                            isDisabled={isLoading || !validateRequiredFields()}
                            isLoading={isLoading}
                            onPress={onUpdateClient}
                        >
                            {isLoading ? 'Chargement...' : (editingClient?.id ? 'Modifier' : 'Ajouter')}
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>

            {/* Modal pour ajouter une publication */}
            <PublicationModal
                editingPublication={editingPublication}
                etablissementId={editingClient?.id}
                isOpen={isPublicationModalOpen}
                onOpenChange={setIsPublicationModalOpen}
                onPublicationAdded={() => {
                    // Rafraîchir les données du client après ajout de publication
                    onUpdateClient();
                }}
            />


        </Modal>
    );
}
