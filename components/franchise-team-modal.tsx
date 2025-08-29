"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getValidAccessToken } from "../utils/auth";

// Interface TeamMember pour la compatibilité avec la page équipe
interface TeamMember {
    id: string;
    name: string;
    role: string;
    location: string;
    avatar: string;
    category: "siege" | "franchise" | "prestataire";
    city: string;
    firstName: string;
    lastName: string;
    identifier: string;
    password: string;
    birthDate: string;
    personalEmail: string;
    franchiseEmail: string;
    phone: string;
    postalAddress: string;
    siret: string;
    dipSignatureDate: string;
    franchiseContractSignatureDate: string;
    trainingCertificateSignatureDate: string;
}

interface FranchiseTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedMember: TeamMember | null;
}

export function FranchiseTeamModal({ isOpen, onClose, selectedMember }: FranchiseTeamModalProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Wrapper fetch avec authentification
    const authFetch = async (input: RequestInfo, init?: RequestInit) => {
        const token = await getValidAccessToken();
        if (!token) throw new Error('No access token');

        const headers = new Headers((init?.headers as HeadersInit) || {});
        headers.set('Authorization', `Bearer ${token}`);
        const merged: RequestInit = { ...init, headers };

        return fetch(input, merged);
    };

    const fetchTeamMembers = async () => {
        if (!selectedMember?.city) return;

        try {
            setLoading(true);
            setError(null);

            const response = await authFetch(`/api/collaborateurs?limit=100&offset=0`);

            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des membres de l'équipe");
            }

            const data = await response.json();
            const collaborateurs = data.results || [];

            // Transformer les données et filtrer par ville
            const transformedMembers: TeamMember[] = collaborateurs
                .map((collab: any, index: number): TeamMember => {
                    const nomComplet = collab.nomComplet || `Collaborateur ${index + 1}`;
                    const nameParts = nomComplet.split(' ');
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';
                    const city = collab.villes && collab.villes.length > 0 ? collab.villes[0] : "Ville non définie";

                    // Déterminer la catégorie et le rôle
                    let category: "siege" | "franchise" | "prestataire" = "siege";
                    if (index >= 10 && index < 25) category = "franchise";
                    else if (index >= 25) category = "prestataire";

                    let role = "Collaborateur";
                    if (category === "siege") role = "Collaborateur Siège";
                    else if (category === "franchise") role = "Franchisé";
                    else if (category === "prestataire") role = "Prestataire";

                    return {
                        id: collab.id,
                        name: nomComplet,
                        role,
                        location: city,
                        avatar: `/api/placeholder/150/150`,
                        category,
                        city,
                        firstName,
                        lastName,
                        identifier: `${firstName.toLowerCase().charAt(0)}.${lastName.toLowerCase()}`,
                        password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                        birthDate: "01.01.1990",
                        phone: "0648596769",
                        personalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
                        franchiseEmail: `${city.toLowerCase().replace(/\s+/g, '-')}@epicu.fr`,
                        postalAddress: "1 place de Mairie, Tourcoing",
                        siret: "87450934562398",
                        dipSignatureDate: "12.07.2024",
                        franchiseContractSignatureDate: "02.12.2024",
                        trainingCertificateSignatureDate: "02.12.2024",
                    };
                })
                .filter((member: TeamMember) => member.city === selectedMember.city);

            setTeamMembers(transformedMembers);
        } catch (error) {
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
            onClose={handleClose}
            size="3xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <h2 className="text-xl font-semibold">Équipe de {selectedMember.city}</h2>
                            <p className="text-sm text-gray-500">
                                Membres de l&apos;équipe basés à {selectedMember.city}
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
                    ) : teamMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500">
                                Aucun autre membre trouvé dans cette ville
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
                                    name={selectedMember.name}
                                    src={selectedMember.avatar}
                                />
                                <h3 className="font-semibold text-lg mb-1">
                                    {selectedMember.name}
                                </h3>
                                <p className="text-sm font-light text-gray-600 dark:text-gray-400 mb-1">
                                    {selectedMember.role}
                                </p>
                                <p className="text-sm font-light text-gray-500 dark:text-gray-500">
                                    {selectedMember.city}
                                </p>
                            </div>

                            {/* Séparateur */}
                            <div className="border-t border-gray-200 dark:border-gray-700"></div>

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
                                                name={member.name}
                                                src={member.avatar}
                                            />
                                            <h3 className="font-semibold text-sm mb-1">
                                                {member.name}
                                            </h3>
                                            <p className="text-sm font-light text-gray-600 dark:text-gray-400 mb-1">
                                                {member.role}
                                            </p>
                                            <p className="text-xs font-light text-gray-500 dark:text-gray-500">
                                                {member.city}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter>

                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
