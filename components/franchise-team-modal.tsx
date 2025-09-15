"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";

import { useAuthFetch } from "../hooks/use-auth-fetch";
import { Collaborator } from "../types/collaborator";

interface FranchiseTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedMember: Collaborator | null;
}

export function FranchiseTeamModal({ isOpen, onClose, selectedMember }: FranchiseTeamModalProps) {
    const { authFetch } = useAuthFetch();
    const [teamMembers, setTeamMembers] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTeamMembers = async () => {
        if (!selectedMember?.villeEpicu || selectedMember.villeEpicu.length === 0) return;

        try {
            setLoading(true);
            setError(null);

            const response = await authFetch(`/api/equipe?limit=100&offset=0`);

            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des membres de l'équipe");
            }

            const data = await response.json();
            const collaborateurs = data.results || [];

            // Utiliser directement les données de l'API et filtrer par ville
            const transformedMembers: Collaborator[] = collaborateurs
                .filter((collab: any) => {
                    const collabVilles = collab.villeEpicu || [];
                    const selectedVilles = selectedMember.villeEpicu || [];

                    return collabVilles.some((ville: string) => selectedVilles.includes(ville));
                })
                .map((collab: any): Collaborator => ({
                    id: collab.id,
                    nom: collab.nom || '',
                    prenom: collab.prenom || '',
                    villeEpicu: collab.villeEpicu || [],
                    emailEpicu: collab.emailEpicu || null,
                    emailPerso: collab.emailPerso || null,
                    role: collab.role || null,
                    etablissements: collab.etablissements || [],
                    trombi: collab.trombi || null,
                }));

            setTeamMembers(transformedMembers);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Erreur lors de la récupération des membres:', error);
            setError("Erreur lors de la récupération des membres de l'équipe");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && selectedMember) {
            fetchTeamMembers();
        }
    }, [isOpen, selectedMember]);

    const handleClose = () => {
        setTeamMembers([]);
        setError(null);
        onClose();
    };

    if (!selectedMember) return null;

    return (
        <Modal
            isOpen={isOpen}
            scrollBehavior="inside"
            size="3xl"
            onClose={handleClose}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <h2 className="text-xl font-semibold">Équipe de {selectedMember.villeEpicu && selectedMember.villeEpicu.length > 0 ? selectedMember.villeEpicu[0] : "Ville non définie"}</h2>
                            <p className="text-sm text-gray-500">
                                Membres de l&apos;équipe basés à {selectedMember.villeEpicu && selectedMember.villeEpicu.length > 0 ? selectedMember.villeEpicu[0] : "Ville non définie"}
                            </p>
                        </div>

                    </div>
                </ModalHeader>

                <ModalBody>
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <Spinner className="text-primary" size="lg" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-500 mb-4">{error}</div>
                            <Button color="primary" onPress={fetchTeamMembers}>
                                Réessayer
                            </Button>
                        </div>
                    ) : teamMembers.filter(member => member.id !== selectedMember.id).length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500">
                                Aucune équipe
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Profil principal du membre sélectionné */}
                            <div className="flex flex-col items-center text-center">
                                <Avatar
                                    className="w-20 h-20 mb-4"
                                    classNames={{
                                        base: "ring-2 ring-gray-200 dark:ring-gray-700",
                                        img: "object-cover",
                                    }}
                                    name={`${selectedMember.prenom} ${selectedMember.nom}`}
                                    src={selectedMember.trombi?.[0]?.url}
                                />
                                <h3 className="font-semibold text-lg mb-1">
                                    {selectedMember.prenom} {selectedMember.nom}
                                </h3>
                                <p className="text-sm font-light text-gray-600 dark:text-gray-400 mb-1">
                                    {selectedMember.role}
                                </p>
                                <p className="text-sm font-light text-gray-500 dark:text-gray-500">
                                    {selectedMember.villeEpicu && selectedMember.villeEpicu.length > 0 ? selectedMember.villeEpicu[0] : "Ville non définie"}
                                </p>
                            </div>

                            {/* Séparateur */}
                            <div className="border-t border-gray-200 dark:border-gray-700" />

                            {/* Grille des membres de l'équipe */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {teamMembers
                                    .filter(member => member.id !== selectedMember.id) // Exclure le membre principal
                                    .map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex flex-col items-center text-center"
                                        >
                                            <Avatar
                                                className="w-16 h-16 mb-3"
                                                classNames={{
                                                    base: "ring-2 ring-gray-200 dark:ring-gray-700",
                                                    img: "object-cover",
                                                }}
                                                name={`${member.prenom} ${member.nom}`}
                                                src={member.trombi?.[0]?.url}
                                            />
                                            <h3 className="font-semibold text-sm mb-1">
                                                {member.prenom} {member.nom}
                                            </h3>
                                            <p className="text-sm font-light text-gray-600 dark:text-gray-400 mb-1">
                                                {member.role}
                                            </p>
                                            <p className="text-xs font-light text-gray-500 dark:text-gray-500">
                                                {member.villeEpicu && member.villeEpicu.length > 0 ? member.villeEpicu[0] : "Ville non définie"}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter />
            </ModalContent>
        </Modal>
    );
}
