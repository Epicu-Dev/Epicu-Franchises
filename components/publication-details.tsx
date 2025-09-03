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
import { Publication } from "@/types/client";

interface PublicationDetailsProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    publication: Publication | null;
    categorie: string;
}

export default function PublicationDetails({
    isOpen,
    onOpenChange,
    publication,
    categorie
}: PublicationDetailsProps) {
    if (!publication) return null;

    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="2xl"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                <ModalHeader className="flex justify-center">
                    Détails de la publication
                </ModalHeader>

                <ModalBody className="max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                        {/* Informations de base */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date de publication
                                </label>
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                    {new Date(publication.datePublication).toLocaleDateString('fr-FR')}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Catégorie
                                </label>
                                <div className="bg-orange-100 text-orange-800 text-sm px-3 py-2 rounded-full inline-block">
                                    {categorie}
                                </div>
                            </div>
                        </div>

                        {/* Factures */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                Factures
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date d'envoi facture création
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {new Date(publication.dateEnvoiFactureCreation).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Montant facture tournage
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {publication.montantFactureTournage}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Statut facture tournage
                                    </label>
                                    <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                                        publication.factureTournage === 'Payée' ? 'bg-green-100 text-green-800' :
                                        publication.factureTournage === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {publication.factureTournage}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date d'envoi facture publication
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {new Date(publication.dateEnvoiFacturePublication).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Montant facture publication
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {publication.montantFacturePublication}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Statut facture publication
                                    </label>
                                    <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                                        publication.facturePublication === 'Payée' ? 'bg-green-100 text-green-800' :
                                        publication.facturePublication === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {publication.facturePublication}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Montants et bénéfices */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                Montants et bénéfices
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Montant sponsorisation
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {publication.montantSponsorisation}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Montant addition
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {publication.montantAddition}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bénéfice
                                    </label>
                                    <div className="bg-green-100 text-green-800 p-3 rounded-lg font-semibold">
                                        {publication.benefice}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Montant cadeau
                                    </label>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {publication.montantCadeau}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cadeau du gérant */}
                        {publication.cadeauGerant && (
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Cadeau du gérant
                                </h4>
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                    {publication.cadeauGerant}
                                </div>
                            </div>
                        )}

                        {/* Statistiques */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                Statistiques
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nombre de vues
                                    </label>
                                    <div className="bg-blue-100 text-blue-800 p-3 rounded-lg font-semibold">
                                        {publication.nombreVues.toLocaleString('fr-FR')}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nombre d'abonnés gagnés
                                    </label>
                                    <div className="bg-purple-100 text-purple-800 p-3 rounded-lg font-semibold">
                                        {publication.nombreAbonnes.toLocaleString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tirage au sort */}
                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                                Tirage au sort effectué
                            </span>
                            <div className={`px-3 py-2 rounded-full text-sm font-medium ${
                                publication.tirageEffectue ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {publication.tirageEffectue ? 'Oui' : 'Non'}
                            </div>
                        </div>

                        {/* Commentaire */}
                        {publication.commentaire && (
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Commentaire
                                </h4>
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                    {publication.commentaire}
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="primary"
                        variant="bordered"
                        onPress={() => onOpenChange(false)}
                    >
                        Fermer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
