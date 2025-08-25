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
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import { Pagination } from "@heroui/pagination";
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [adminMembers, setAdminMembers] = useState<AdminTeamMember[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("tout");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Données d'exemple pour la vue tableau (admin)
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

  const fetchMembers = async () => {
    try {
      setLoading(true);

      if (viewMode === "grid") {
        const params = new URLSearchParams({
          category: selectedCategory,
          search: searchTerm,
          page: "1",
          limit: "35",
        });

        const response = await fetch(`/api/equipe?${params}`);

        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération des membres de l'équipe"
          );
        }

        const data = await response.json();

        setMembers(data.members);
      } else {
        // Simulation d'un appel API pour la vue tableau
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Filtrer les données selon le terme de recherche
        const filteredData = mockAdminData.filter(
          (member) =>
            member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.identifier.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setAdminMembers(filteredData);

        // Mettre à jour la pagination
        setPagination((prev) => ({
          ...prev,
          totalItems: filteredData.length,
          totalPages: Math.ceil(filteredData.length / prev.itemsPerPage),
          currentPage: 1,
        }));
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

  if (loading) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardBody className="p-6">
          {/* Header avec onglets, recherche et bouton de vue */}
          <div className="flex justify-between items-center mb-6">
            {viewMode === "grid" ? (
              <Tabs
                className="w-full"
                classNames={{
                  cursor: "w-[50px] left-[12px] h-1",
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
              <div className="w-full">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Gestion des membres
                </h2>
              </div>
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
                  placeholder="Rechercher..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>

              <Button
                isIconOnly
                className="text-gray-600 hover:text-gray-800"
                variant="light"
                onClick={handleViewModeToggle}
              >
                <Bars3Icon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Contenu selon le mode de vue */}
          {viewMode === "grid" ? (
            // Vue grille (vue originale)
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
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                    {member.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {member.role} {member.location}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // Vue tableau (vue admin)
            <>
              <div className="overflow-x-auto">
                <Table aria-label="Tableau des membres de l'équipe">
                  <TableHeader>
                    <TableColumn>Modifier</TableColumn>
                    <TableColumn>Ville</TableColumn>
                    <TableColumn>Prénom</TableColumn>
                    <TableColumn>Nom</TableColumn>
                    <TableColumn>Identifiant</TableColumn>
                    <TableColumn>Mot de passe</TableColumn>
                    <TableColumn>Date de naissance</TableColumn>
                    <TableColumn>Mail perso</TableColumn>
                    <TableColumn>Mail franchisé</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {adminMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
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
                        <TableCell>
                          <Chip
                            className="bg-gray-100 text-gray-800"
                            variant="flat"
                          >
                            {member.city}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-gray-100">
                            {member.firstName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-gray-100">
                            {member.lastName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-gray-100">
                            {member.identifier}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                            {member.password}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-gray-100">
                            {member.birthDate}
                          </span>
                        </TableCell>
                        <TableCell>
                          <a
                            className="text-blue-600 hover:text-blue-800 underline"
                            href={`mailto:${member.personalEmail}`}
                          >
                            {member.personalEmail}
                          </a>
                        </TableCell>
                        <TableCell>
                          <a
                            className="text-blue-600 hover:text-blue-800 underline"
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

              {/* Pagination pour la vue tableau */}
              <div className="flex justify-center mt-6">
                <Pagination
                  showControls
                  classNames={{
                    wrapper: "gap-2",
                    item: "w-8 h-8 text-sm",
                    cursor:
                      "bg-black text-white dark:bg-white dark:text-black font-bold",
                  }}
                  page={pagination.currentPage}
                  total={pagination.totalPages}
                  onChange={(page) =>
                    setPagination((prev) => ({ ...prev, currentPage: page }))
                  }
                />
              </div>
            </>
          )}

          {/* Informations sur le nombre de résultats */}
          {((viewMode === "grid" && members.length > 0) ||
            (viewMode === "table" && adminMembers.length > 0)) && (
            <div className="text-center mt-4 text-sm text-gray-500">
              {viewMode === "grid"
                ? `Affichage de ${members.length} membre(s)`
                : `Affichage de ${adminMembers.length} membre(s) sur ${pagination.totalItems} au total`}
            </div>
          )}

          {/* Message si aucun résultat */}
          {((viewMode === "grid" && members.length === 0) ||
            (viewMode === "table" && adminMembers.length === 0)) &&
            searchTerm && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  Aucun membre trouvé pour &ldquo;{searchTerm}&rdquo;
                </div>
              </div>
            )}
        </CardBody>
      </Card>
    </div>
  );
}
