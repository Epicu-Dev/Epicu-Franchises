"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Avatar } from "@heroui/avatar";
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
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { getValidAccessToken } from "../../utils/auth";
import { TeamMemberModal } from "../../components/team-member-modal";
import { FranchiseTeamModal } from "../../components/franchise-team-modal";
import { useUser } from "../../contexts/user-context";

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




// Interface pour les données de l'API équipe
interface CollaborateurEquipe {
  id: string;
  nom: string;
  prenom: string;
  villeEpicu: string[];
  emailEpicu: string | null;
  role: string | null;
  etablissements: string[];
}

export default function EquipePage() {
  const { userProfile, userType } = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("tout");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFranchiseTeamModalOpen, setIsFranchiseTeamModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);



  // Wrapper fetch avec authentification
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getValidAccessToken();

    if (!token) throw new Error('No access token');
    const headers = new Headers((init?.headers as HeadersInit) || {});

    headers.set('Authorization', `Bearer ${token}`);
    const merged: RequestInit = { ...init, headers };

    return fetch(input, merged);
  };

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

      const collaborateurs: CollaborateurEquipe[] = data.results || [];

      // Transformer les données de l'API en format TeamMember
      const transformedMembers: TeamMember[] = collaborateurs.map((collab) => {
        // Déterminer la catégorie basée sur le rôle
        let category: "siege" | "franchise" | "prestataire" = "siege";
        const roleLower = (collab.role || "").toLowerCase();
        
        if (roleLower.includes("franchise") || roleLower.includes("franchisé")) {
          category = "franchise";
        } else if (roleLower.includes("prestataire")) {
          category = "prestataire";
        }

        // Utiliser le rôle de l'API ou définir un rôle par défaut
        let role = collab.role || "Collaborateur";
        
        if (!collab.role) {
          if (category === "siege") role = "Collaborateur Siège";
          else if (category === "franchise") role = "Franchisé";
          else if (category === "prestataire") role = "Prestataire";
        }

        // Déterminer la localisation
        let location = "Siège";

        if (category === "franchise" || category === "prestataire") {
          location = collab.villeEpicu && collab.villeEpicu.length > 0 ? collab.villeEpicu[0] : "Ville non définie";
        }

        // Utiliser les vrais prénom et nom de l'API
        const firstName = collab.prenom || '';
        const lastName = collab.nom || '';
        const fullName = `${firstName} ${lastName}`.trim() || `Collaborateur ${collab.id}`;

        // Déterminer la ville (première ville de la liste ou ville par défaut)
        const city = collab.villeEpicu && collab.villeEpicu.length > 0 ? collab.villeEpicu[0] : "Ville non définie";

        // Générer un identifiant basé sur le nom
        const identifier = `${firstName.toLowerCase().charAt(0)}.${lastName.toLowerCase()}`;

        // Générer un mot de passe temporaire
        const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Date de naissance par défaut (peut être modifiée plus tard)
        const birthDate = "01.01.1990";

        // Utiliser l'email EPICU de l'API ou générer des emails basés sur le nom et la ville
        const personalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
        const franchiseEmail = collab.emailEpicu || `${city.toLowerCase().replace(/\s+/g, '-')}@epicu.fr`;

        // Générer des données pour les nouveaux champs
        const phone = "0648596769"; // Téléphone par défaut
        const postalAddress = "1 place de Mairie, Tourcoing"; // Adresse par défaut
        const siret = "87450934562398"; // SIRET par défaut
        const dipSignatureDate = "12.07.2024"; // Date signature DIP par défaut
        const franchiseContractSignatureDate = "02.12.2024"; // Date signature contrat par défaut
        const trainingCertificateSignatureDate = "02.12.2024"; // Date signature attestation par défaut

        return {
          id: collab.id,
          name: fullName,
          role,
          location,
          avatar: `/api/placeholder/150/150`,
          category,
          city,
          firstName,
          lastName,
          identifier,
          password,
          birthDate,
          personalEmail,
          franchiseEmail,
          phone,
          postalAddress,
          siret,
          dipSignatureDate,
          franchiseContractSignatureDate,
          trainingCertificateSignatureDate,
        };
      });

      // Filtrer par catégorie si sélectionnée
      let filteredMembers = transformedMembers;

      if (selectedCategory && selectedCategory !== "tout") {
        filteredMembers = transformedMembers.filter(member => member.category === selectedCategory);
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

  const handleEdit = () => {
    // Ici vous pouvez ajouter la logique pour ouvrir un modal d'édition
  };

  const handleAddMember = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleMemberAdded = () => {
    // Rafraîchir la liste des membres
    fetchMembers();
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsFranchiseTeamModalOpen(true);
  };

  const handleFranchiseTeamModalClose = () => {
    setIsFranchiseTeamModalOpen(false);
    setSelectedMember(null);
  };


  return (
    <div className="w-full text-primary">
      <Card className="w-full" shadow="none">
        <CardBody className="p-6">
          {/* Header avec onglets, recherche et bouton de vue */}
          <div className="flex justify-between items-center mb-6">
            {/* Bouton de changement de vue - visible uniquement pour les admins */}
            {isAdmin() && (
              <Button
                isIconOnly
                variant="light"
                onClick={handleViewModeToggle}
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
                  cursor: "w-[50px]  left-[12px] h-1   rounded",
                  tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
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

            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  className="w-64 pr-4 pl-10"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    aria-label={`Voir l'équipe de ${member.name} à ${member.city}`}
                    className="group relative flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleMemberClick(member)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMemberClick(member)}
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
                    <h3 className="font-semibold  text-sm mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm font-light ">
                      {member.role}
                    </p>
                    <p className="text-xs font-light ">
                      {member.location}
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
                    <Table aria-label="Tableau des membres de l'équipe">
                      <TableHeader>
                        <TableColumn className="font-light text-sm">Modifier</TableColumn>
                        <TableColumn className="font-light text-sm">Ville</TableColumn>
                        <TableColumn className="font-light text-sm">Rôle</TableColumn>
                        <TableColumn className="font-light text-sm">Prénom</TableColumn>
                        <TableColumn className="font-light text-sm">Nom</TableColumn>
                        <TableColumn className="font-light text-sm">Identifiant</TableColumn>
                        <TableColumn className="font-light text-sm">Mot de passe</TableColumn>
                        <TableColumn className="font-light text-sm">Date de naissance</TableColumn>
                        <TableColumn className="font-light text-sm">Mail perso</TableColumn>
                        <TableColumn className="font-light text-sm">Mail franchisé</TableColumn>
                        <TableColumn className="font-light text-sm">Téléphone</TableColumn>
                        <TableColumn className="font-light text-sm">Adresse postale</TableColumn>
                        <TableColumn className="font-light text-sm">SIRET</TableColumn>
                        <TableColumn className="font-light text-sm">Date signature du DIP</TableColumn>
                        <TableColumn className="font-light text-sm">Date signature du contrat de franchise</TableColumn>
                        <TableColumn className="font-light text-sm">Date signature de l&apos;attestation de formation initiale</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id} className="border-t border-gray-100  dark:border-gray-700">
                            <TableCell className="py-5 font-light">
                              <Tooltip content="Modifier">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onClick={() => handleEdit()}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="font-light">
                              {member.city}
                            </TableCell>
                            <TableCell className="font-light">
                              <span className="font-light">
                                {member.role}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.firstName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.lastName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.identifier}
                              </span>
                            </TableCell>
                            <TableCell className="font-light">
                              <span >
                                {member.password}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.birthDate}
                              </span>
                            </TableCell>
                            <TableCell>
                              <a
                                className="font-light underline"
                                href={`mailto:${member.personalEmail}`}
                              >
                                {member.personalEmail}
                              </a>
                            </TableCell>
                            <TableCell>
                              <a
                                className="font-light underline"
                                href={`mailto:${member.franchiseEmail}`}
                              >
                                {member.franchiseEmail}
                              </a>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.phone}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.postalAddress}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.siret}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.dipSignatureDate}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.franchiseContractSignatureDate}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-light">
                                {member.trainingCertificateSignatureDate}
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
                  Aucun membre trouvé pour &quot;{searchTerm}&quot;
                </div>
              </div>
            )}
        </CardBody>
      </Card>

      {/* Modal pour ajouter/modifier un membre - visible uniquement pour les admins */}
      {isAdmin() && (
        <TeamMemberModal
          isEditing={false}
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
    </div>
  );
}
