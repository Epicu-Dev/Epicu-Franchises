"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Avatar } from "@heroui/avatar";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  PencilIcon,
  Squares2X2Icon,
  XMarkIcon,
  PlusIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { useAuthFetch } from "../../hooks/use-auth-fetch";
import { TeamMemberModal } from "../../components/team-member-modal";
import { FranchiseTeamModal } from "../../components/franchise-team-modal";
import { useUser } from "../../contexts/user-context";
import { Collaborator } from "../../types/collaborator";





export default function EquipePage() {
  const { userProfile, userType } = useUser();
  const { authFetch } = useAuthFetch();
  const [members, setMembers] = useState<Collaborator[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("tout");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFranchiseTeamModalOpen, setIsFranchiseTeamModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Collaborator | null>(null);
  const [editingMember, setEditingMember] = useState<Collaborator | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [tokenMember, setTokenMember] = useState<Collaborator | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);




  const fetchMembers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: "100", // Récupérer plus de collaborateurs
        offset: "0",
      });

      if (searchTerm) {
        params.set('q', searchTerm);
      }

      const response = await authFetch(`/api/equipe?${params}`);

      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des membres de l'équipe"
        );
      }

      const data = await response.json();

      // Utiliser directement les données de l'API
      const members: Collaborator[] = data.results || [];

      // Filtrer par catégorie si sélectionnée
      let filteredMembers = members;

      if (selectedCategory && selectedCategory !== "tout") {
        filteredMembers = members.filter(member => {
          const roleLower = (member.role || "").toLowerCase();

          if (selectedCategory === "siege") {
            return !roleLower.includes("franchise") && !roleLower.includes("franchisé") && !roleLower.includes("prestataire");
          } else if (selectedCategory === "franchise") {
            return roleLower.includes("franchise") || roleLower.includes("franchisé");
          } else if (selectedCategory === "prestataire") {
            return roleLower.includes("prestataire");
          }

          return true;
        });
      }

      setMembers(filteredMembers);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la récupération des membres:', error);
      // En cas d'erreur, on garde les données existantes ou on vide la liste
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedCategory, searchTerm, viewMode]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Fonction pour déterminer si l'utilisateur est admin
  const isAdmin = () => {
    // Vérifier d'abord le userType (admin/franchise)
    if (userType === "admin") return true;

    // Vérifier aussi le rôle dans le profil utilisateur
    if (userProfile?.role) {
      const role = userProfile.role.toLowerCase();

      return role.includes('admin') || role.includes('administrateur') || role.includes('gestionnaire');
    }

    return false;
  };

  const handleViewModeToggle = () => {
    // Seuls les admins peuvent passer en vue tableau
    if (isAdmin()) {
      setViewMode(viewMode === "grid" ? "table" : "grid");
    }
  };

  const handleEdit = (member: Collaborator) => {
    setEditingMember(member);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setIsEditing(false);
  };

  const handleMemberAdded = () => {
    // Rafraîchir la liste des membres
    fetchMembers();
  };

  const handleMemberClick = (member: Collaborator) => {
    setSelectedMember(member);
    setIsFranchiseTeamModalOpen(true);
  };

  const handleFranchiseTeamModalClose = () => {
    setIsFranchiseTeamModalOpen(false);
    setSelectedMember(null);
  };

  const handleGenerateToken = async (member: Collaborator) => {
    try {
      setIsGeneratingToken(true);
      setTokenMember(member);

      const response = await authFetch("/api/collaborateurs/config_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaboratorId: member.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de la génération du token");
      }

      const data = await response.json();

      setGeneratedToken(data.token);
      setIsTokenModalOpen(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors de la génération du token:", error);
      // Ici on pourrait afficher un toast d'erreur
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleTokenModalClose = () => {
    setIsTokenModalOpen(false);
    setGeneratedToken("");
    setTokenMember(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Ici on pourrait afficher un toast de succès
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors de la copie:", error);
    }
  };


  return (
    <div className="w-full text-primary">
      <Card className="w-full" shadow="none">
        <CardBody className="p-2 sm:p-6">
          {/* Header avec onglets, recherche et bouton de vue */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-6 gap-4">
            {/* Bouton de changement de vue - visible uniquement pour les admins */}
            {isAdmin() && (
              <Button
                isIconOnly
                variant="light"
                onClick={handleViewModeToggle}
                className="self-start"
              >
                {viewMode === "grid" ? <Bars3Icon className="h-5 w-5" /> : <Squares2X2Icon className="h-5 w-5" />}
              </Button>
            )}

            {/* Espaceur si pas de bouton de vue */}
            {!isAdmin() && <div />}

            {viewMode === "grid" ? (
              <Tabs
                className="w-full pt-3"
                classNames={{
                  cursor: "w-[50px] left-[12px] h-1 rounded",
                  tab: "pb-6 data-[selected=true]:font-semibold text-base font-light",
                }}
                selectedKey={selectedCategory}
                variant="underlined"
                onSelectionChange={(key) => handleCategoryChange(key as string)}
              >
                <Tab key="tout" title="Tout" />
                <Tab key="siege" title="Siège" />
                <Tab key="franchise" title="Franchisés" />
                <Tab key="prestataire" title="Prestataires" />
              </Tabs>
            ) : (
              <div />
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Input
                  className="w-full pr-0 pl-0 sm:pr-4 sm:pl-10"
                  classNames={{
                    input:
                      "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                    inputWrapper:
                      "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-page-bg",
                  }}
                  endContent={
                    searchTerm && (
                      <XMarkIcon className="h-4 w-4 cursor-pointer" onClick={() => setSearchTerm("")} />
                    )
                  }
                  placeholder="Rechercher..."
                  startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Bouton "Ajouter un membre" - visible uniquement pour les admins */}
              {isAdmin() && (
                <Button
                  color='primary'
                  endContent={<PlusIcon className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                  onPress={handleAddMember}
                >
                  Ajouter un membre
                </Button>
              )}
            </div>
          </div>

          {/* Contenu selon le mode de vue */}
          {viewMode === "grid" ? (
            // Vue grille (vue originale) - accessible à tous
            loading ?
              <div className="flex justify-center items-center h-64">
                <Spinner className="text-black dark:text-white" size="lg" />
              </div>
              :
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    aria-label={`Voir l'équipe de ${member.prenom} ${member.nom} à ${member.villeEpicu && member.villeEpicu.length > 0 ? member.villeEpicu[0] : "Ville non définie"}`}
                    className="group relative flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleMemberClick(member)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMemberClick(member)}
                  >
                    <Avatar
                      className="w-12 h-12 sm:w-16 sm:h-16 mb-3"
                      classNames={{
                        base: "ring-2 ring-gray-200 dark:ring-gray-700",
                        img: "object-cover",
                      }}
                      name={`${member.prenom} ${member.nom}`}
                      src={member.trombi?.[0]?.url}
                    />
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">
                      {member.prenom} {member.nom}
                    </h3>
                    <p className="text-xs sm:text-sm font-light">
                      {member.role}
                    </p>
                    <p className="text-xs font-light">
                      {member.villeEpicu && member.villeEpicu.length > 0 ? member.villeEpicu[0] : "Ville non définie"}
                    </p>
                  </div>
                ))}
              </div>
          ) : (
            // Vue tableau (vue admin) - accessible uniquement aux admins
            isAdmin() ? (
              loading ?
                <div className="flex justify-center items-center h-64">
                  <Spinner className="text-black dark:text-white" size="lg" />
                </div>
                :
                <>
                  <div className="overflow-x-auto">
                    <Table aria-label="Tableau des membres de l'équipe" classNames={{
                      wrapper: "min-w-full",
                      table: "min-w-[1200px]"
                    }}>
                      <TableHeader>
                        <TableColumn className="font-light text-sm min-w-[100px]">Modifier</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[120px]">Ville</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[120px]">Rôle</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[100px]">Prénom</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[100px]">Nom</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[150px]">Identifiant</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[120px]">Date de naissance</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[150px]">Mail perso</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[150px]">Mail franchisé</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[120px]">Téléphone</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[200px]">Adresse postale</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[120px]">SIRET</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[120px]">Date signature du DIP</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[150px]">Date signature du contrat de franchise</TableColumn>
                        <TableColumn className="font-light text-sm min-w-[180px]">Date signature de l&apos;attestation de formation initiale</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id} className="border-t border-gray-100  dark:border-gray-700">
                            <TableCell className="py-5 font-light">
                              <div className="flex gap-2">
                                <Tooltip content="Générer un lien d'inscription">
                                  <Button
                                    isIconOnly
                                    isLoading={isGeneratingToken && tokenMember?.id === member.id}
                                    size="sm"
                                    variant="light"
                                    onClick={() => handleGenerateToken(member)}
                                  >
                                    <KeyIcon className="h-4 w-4" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Modifier">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onClick={() => handleEdit(member)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                </Tooltip>

                              </div>
                            </TableCell>
                            <TableCell className="font-light text-xs sm:text-sm">
                              {member.villeEpicu && member.villeEpicu.length > 0 ? member.villeEpicu[0] : "Ville non définie"}
                            </TableCell>
                            <TableCell className="font-light text-xs sm:text-sm">
                              <span className="font-light">
                                {member.role}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.prenom}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.nom}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.emailEpicu || ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.dateNaissance ? new Date(member.dateNaissance).toLocaleDateString('fr-FR') : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <a
                                className="font-light underline"
                                href={`mailto:${member.emailPerso || ""}`}
                              >
                                {member.emailPerso || ""}
                              </a>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <a
                                className="font-light underline"
                                href={`mailto:${member.emailEpicu || ""}`}
                              >
                                {member.emailEpicu || ""}
                              </a>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.telephone || ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.adresse || ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.siret || ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.dateDIP ? new Date(member.dateDIP).toLocaleDateString('fr-FR') : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.dateSignatureContrat ? new Date(member.dateSignatureContrat).toLocaleDateString('fr-FR') : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <span className="font-light">
                                {member.dateSignatureAttestation ? new Date(member.dateSignatureAttestation).toLocaleDateString('fr-FR') : ""}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
            ) : (
              // Si l'utilisateur n'est pas admin mais est en vue tableau, on le remet en vue grille
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Accès non autorisé à cette vue
                  </p>
                  <Button
                    color="primary"
                    onClick={() => setViewMode("grid")}
                  >
                    Retour à la vue grille
                  </Button>
                </div>
              </div>
            )
          )}

          {/* Message si aucun résultat */}
          {!loading && ((viewMode === "grid" && members.length === 0) ||
            (viewMode === "table" && members.length === 0)) &&
            searchTerm && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  Aucun membre trouvé pour &ldquo;{searchTerm}&rdquo;
                </div>
              </div>
            )}
        </CardBody>
      </Card>

      {/* Modal pour ajouter/modifier un membre - visible uniquement pour les admins */}
      {isAdmin() && (
        <TeamMemberModal
          editingMember={editingMember}
          isEditing={isEditing}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onMemberAdded={handleMemberAdded}
        />
      )}

      {/* Modal pour afficher l'équipe du franchisé */}
      <FranchiseTeamModal
        isOpen={isFranchiseTeamModalOpen}
        selectedMember={selectedMember}
        onClose={handleFranchiseTeamModalClose}
      />

      {/* Modal pour afficher le lien d'inscription généré */}
      <Modal 
        isOpen={isTokenModalOpen} 
        placement="center"
        size="md"
        classNames={{
          base: "mx-4 sm:mx-0",
          body: "py-6",
          header: "px-6 pt-6 pb-2",
          footer: "px-6 pb-6 pt-2"
        }}
        onClose={handleTokenModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-lg sm:text-xl font-semibold">Lien d&apos;inscription généré</span>
          </ModalHeader>
          <ModalBody>
            {tokenMember && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Lien d&apos;inscription pour <strong>{tokenMember.prenom} {tokenMember.nom}</strong>
                </p>
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-xs sm:text-sm font-mono break-all">
                    https://franchise.epicu.fr/signup?q={generatedToken}
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              className="w-full sm:w-auto order-2 sm:order-1"
              variant="light"
              onPress={handleTokenModalClose}
            >
              Fermer
            </Button>
            <Button
              className="w-full sm:w-auto order-1 sm:order-2"
              color="primary"
              onPress={() => copyToClipboard(`https://franchise.epicu.fr/signup?q=${generatedToken}`)}
            >
              Copier le lien
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
