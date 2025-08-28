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
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { getValidAccessToken } from "../../utils/auth";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  category: "siege" | "franchise" | "prestataire";
}

interface AdminTeamMember {
  id: string;
  city: string;
  firstName: string;
  lastName: string;
  identifier: string;
  password: string;
  birthDate: string;
  personalEmail: string;
  franchiseEmail: string;
}



// Interface pour les données de l'API collaborateurs
interface Collaborateur {
  id: string;
  nomComplet: string;
  villes: string[];
}

export default function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [adminMembers, setAdminMembers] = useState<AdminTeamMember[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("tout");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");


  // Données d'exemple pour la vue tableau (admin) - gardées car pas d'API équivalente
  const mockAdminData: AdminTeamMember[] = [
    {
      id: "1",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
    {
      id: "2",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
    {
      id: "3",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
    {
      id: "4",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
    {
      id: "5",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
    {
      id: "6",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
    {
      id: "7",
      city: "Saint-Malo",
      firstName: "Sylvain",
      lastName: "Binouz",
      identifier: "s.binouz",
      password: "75QCmT87U8rfhc",
      birthDate: "04.04.1998",
      personalEmail: "sylvain.binouz@gmail.com",
      franchiseEmail: "saint-malo@epicu.fr",
    },
  ];

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

      if (viewMode === "grid") {
        const params = new URLSearchParams({
          limit: "100", // Récupérer plus de collaborateurs
          offset: "0",
        });

        if (searchTerm) {
          params.set('q', searchTerm);
        }

        const response = await authFetch(`/api/collaborateurs?${params}`);

        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération des membres de l'équipe"
          );
        }

        const data = await response.json();
        const collaborateurs: Collaborateur[] = data.results || [];

        // Transformer les données de l'API en format TeamMember
        const transformedMembers: TeamMember[] = collaborateurs.map((collab, index) => {
          // Déterminer la catégorie basée sur les villes ou l'index
          let category: "siege" | "franchise" | "prestataire" = "siege";

          if (index >= 10 && index < 25) category = "franchise";
          else if (index >= 25) category = "prestataire";

          // Déterminer le rôle basé sur la catégorie
          let role = "Collaborateur";

          if (category === "siege") role = "Collaborateur Siège";
          else if (category === "franchise") role = "Franchisé";
          else if (category === "prestataire") role = "Prestataire";

          // Déterminer la localisation
          let location = "Siège";

          if (category === "franchise" || category === "prestataire") {
            location = collab.villes && collab.villes.length > 0 ? collab.villes[0] : "Ville non définie";
          }

          return {
            id: collab.id,
            name: collab.nomComplet || `Collaborateur ${index + 1}`,
            role,
            location,
            avatar: `/api/placeholder/150/150`,
            category,
          };
        });

        // Filtrer par catégorie si sélectionnée
        let filteredMembers = transformedMembers;

        if (selectedCategory && selectedCategory !== "tout") {
          filteredMembers = transformedMembers.filter(member => member.category === selectedCategory);
        }

        setMembers(filteredMembers);
      } else {
        // Utiliser l'API des collaborateurs pour la vue tableau aussi
        const params = new URLSearchParams({
          limit: "100",
          offset: "0",
        });

        if (searchTerm) {
          params.set('q', searchTerm);
        }

        const response = await authFetch(`/api/collaborateurs?${params}`);

        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération des collaborateurs"
          );
        }

        const data = await response.json();
        const collaborateurs: Collaborateur[] = data.results || [];

        // Transformer les données de l'API en format AdminTeamMember
        const transformedAdminMembers: AdminTeamMember[] = collaborateurs.map((collab, index) => {
          // Extraire le prénom et nom du nom complet
          const nomComplet = collab.nomComplet || `Collaborateur ${index + 1}`;
          const nameParts = nomComplet.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Déterminer la ville (première ville de la liste ou ville par défaut)
          const city = collab.villes && collab.villes.length > 0 ? collab.villes[0] : "Ville non définie";

          // Générer un identifiant basé sur le nom
          const identifier = `${firstName.toLowerCase().charAt(0)}.${lastName.toLowerCase()}`;

          // Générer un mot de passe temporaire
          const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

          // Date de naissance par défaut (peut être modifiée plus tard)
          const birthDate = "01.01.1990";

          // Générer des emails basés sur le nom et la ville
          const personalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
          const franchiseEmail = `${city.toLowerCase().replace(/\s+/g, '-')}@epicu.fr`;

          return {
            id: collab.id,
            city,
            firstName,
            lastName,
            identifier,
            password,
            birthDate,
            personalEmail,
            franchiseEmail,
          };
        });

        setAdminMembers(transformedAdminMembers);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
      // En cas d'erreur, on garde les données existantes ou on vide la liste
      if (viewMode === "grid") {
        setMembers([]);
      } else {
        setAdminMembers([]);
      }
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

  const handleViewModeToggle = () => {
    setViewMode(viewMode === "grid" ? "table" : "grid");
  };

  const handleEdit = () => {
    // Ici vous pouvez ajouter la logique pour ouvrir un modal d'édition
  };


  return (
    <div className="w-full text-primary">
      <Card className="w-full" shadow="none">
        <CardBody className="p-6">
          {/* Header avec onglets, recherche et bouton de vue */}
          <div className="flex justify-between items-center mb-6">
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
                      "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white dark:bg-gray-800",
                  }}
                  endContent={
                    searchTerm && (
                      <XMarkIcon className="h-4 w-4 cursor-pointer" onClick={() => setSearchTerm("")} />
                    )
                  }
                  placeholder="Rechercher..."
                  startContent={<MagnifyingGlassIcon className="h-5 w-5 cursor-pointer" />}

                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
               
              </div>

              <Button
                isIconOnly
                className="text-gray-600 hover:text-gray-800"
                variant="light"
                onClick={handleViewModeToggle}
              >
                {viewMode === "grid" ? <Bars3Icon className="h-5 w-5" /> : <Squares2X2Icon className="h-5 w-5" />}

              </Button>
            </div>
          </div>

          {/* Contenu selon le mode de vue */}
          {viewMode === "grid" ? (
            // Vue grille (vue originale)
            loading ?
              <div className="flex justify-center items-center h-64">
                <Spinner className="text-black dark:text-white" size="lg" />
              </div>
              :
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="group relative flex flex-col items-center text-center cursor-pointer"
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
            // Vue tableau (vue admin)
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
                      <TableColumn className="font-light text-sm">Prénom</TableColumn>
                      <TableColumn className="font-light text-sm">Nom</TableColumn>
                      <TableColumn className="font-light text-sm">Identifiant</TableColumn>
                      <TableColumn className="font-light text-sm">Mot de passe</TableColumn>
                      <TableColumn className="font-light text-sm">Date de naissance</TableColumn>
                      <TableColumn className="font-light text-sm">Mail perso</TableColumn>
                      <TableColumn className="font-light text-sm">Mail franchisé</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {adminMembers.map((member) => (
                        <TableRow key={member.id} className="border-t border-gray-100  dark:border-gray-700">
                          <TableCell className="py-5 font-light">
                            <Tooltip content="Modifier">
                              <Button
                                isIconOnly
                                className="text-gray-600 hover:text-gray-800"
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
          )}



          {/* Message si aucun résultat */}
          {!loading && ((viewMode === "grid" && members.length === 0) ||
            (viewMode === "table" && adminMembers.length === 0)) &&
            searchTerm && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  Aucun membre trouvé pour &quot;{searchTerm}&quot;
                </div>
              </div>
            )}
        </CardBody>
      </Card>
    </div>
  );
}
