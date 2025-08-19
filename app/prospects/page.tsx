"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import {
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

interface Prospect {
  id: string;
  siret: string;
  nomEtablissement: string;
  ville: string;
  telephone: string;
  categorie: "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY";
  statut: "a_contacter" | "en_discussion" | "glacial";
  datePremierRendezVous: string;
  dateRelance: string;
  vientDeRencontrer: boolean;
  commentaire: string;
  suiviPar: string;
  email?: string;
  adresse?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSuiviPar, setSelectedSuiviPar] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedTab, setSelectedTab] = useState("a_contacter");
  const [newProspect, setNewProspect] = useState({
    siret: "",
    nomEtablissement: "",
    ville: "",
    telephone: "",
    categorie: "FOOD" as "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY",
    statut: "a_contacter" as "a_contacter" | "en_discussion" | "glacial",
    datePremierRendezVous: "",
    dateRelance: "",
    vientDeRencontrer: false,
    commentaire: "",
    suiviPar: "",
    email: "",
    adresse: "",
  });

  const fetchProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        suiviPar: selectedSuiviPar,
        statut: selectedTab,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      const response = await fetch(`/api/prospects?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des prospects");
      }

      const data = await response.json();

      setProspects(data.prospects);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [
    pagination.currentPage,
    searchTerm,
    selectedCategory,
    selectedSuiviPar,
    selectedTab,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddProspect = async () => {
    try {
      const response = await fetch("/api/prospects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProspect),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du prospect");
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewProspect({
        siret: "",
        nomEtablissement: "",
        ville: "",
        telephone: "",
        categorie: "FOOD" as "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY",
        statut: "a_contacter" as "a_contacter" | "en_discussion" | "glacial",
        datePremierRendezVous: "",
        dateRelance: "",
        vientDeRencontrer: false,
        commentaire: "",
        suiviPar: "",
        email: "",
        adresse: "",
      });
      setIsAddModalOpen(false);

      // Recharger les prospects
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setIsEditModalOpen(true);
  };

  const handleUpdateProspect = async () => {
    if (!editingProspect) return;

    try {
      const response = await fetch(`/api/prospects/${editingProspect.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProspect),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du prospect");
      }

      // Fermer le modal et recharger les prospects
      setIsEditModalOpen(false);
      setEditingProspect(null);
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleConvertToClient = async (prospectId: string) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la conversion en client");
      }

      // Recharger les prospects
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "FOOD":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "SHOP":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "TRAVEL":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "FUN":
        return "bg-green-50 text-green-700 border-green-200";
      case "BEAUTY":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading && prospects.length === 0) {
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

  if (error) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Erreur: {error}</div>
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
          {/* Tabs */}
          <Tabs
            className="mb-6"
            classNames={{
              cursor: "w-[50px] left-[12px] h-1",
            }}
            selectedKey={selectedTab}
            variant="underlined"
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab key="a_contacter" title="À contacter" />
            <Tab key="en_discussion" title="En discussion" />
            <Tab key="glacial" title="Glacial" />
          </Tabs>

          {/* Header with filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select
                className="w-48"
                placeholder="Catégorie"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="FOOD">FOOD</SelectItem>
                <SelectItem key="SHOP">SHOP</SelectItem>
                <SelectItem key="TRAVEL">TRAVEL</SelectItem>
                <SelectItem key="FUN">FUN</SelectItem>
                <SelectItem key="BEAUTY">BEAUTY</SelectItem>
              </Select>

              <Select
                className="w-48"
                placeholder="Suivi par"
                selectedKeys={selectedSuiviPar ? [selectedSuiviPar] : []}
                onSelectionChange={(keys) =>
                  setSelectedSuiviPar(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="nom">Nom</SelectItem>
                <SelectItem key="prenom">Prénom</SelectItem>
              </Select>

              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsAddModalOpen(true)}
              >
                Ajouter un prospect
              </Button>
            </div>

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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Table */}
          <Table aria-label="Tableau des prospects">
            <TableHeader>
              <TableColumn>Nom établissement</TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("categorie")}
                >
                  Catégorie
                  {sortField === "categorie" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Ville</TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("dateRelance")}
                >
                  Date de relance
                  {sortField === "dateRelance" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("suiviPar")}
                >
                  Suivi par
                  {sortField === "suiviPar" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Commentaire</TableColumn>
              <TableColumn>Modifier</TableColumn>
              <TableColumn>Basculer en client</TableColumn>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">
                    {prospect.nomEtablissement}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getCategoryBadgeColor(prospect.categorie)}`}
                    >
                      {prospect.categorie}
                    </span>
                  </TableCell>
                  <TableCell>{prospect.ville}</TableCell>
                  <TableCell>{prospect.dateRelance}</TableCell>
                  <TableCell>{prospect.suiviPar}</TableCell>
                  <TableCell>{prospect.commentaire}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      className="text-gray-600 hover:text-gray-800"
                      size="sm"
                      variant="light"
                      onPress={() => handleEditProspect(prospect)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      color="secondary"
                      size="sm"
                      variant="flat"
                      onPress={() => handleConvertToClient(prospect.id)}
                    >
                      Convertir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
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

          {/* Info sur le nombre total d'éléments */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Affichage de {prospects.length} prospect(s) sur{" "}
            {pagination.totalItems} au total
          </div>
        </CardBody>
      </Card>

      {/* Modal d'ajout de prospect */}
      <Modal
        isOpen={isAddModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={setIsAddModalOpen}
      >
        <ModalContent>
          <ModalHeader>Ajouter un nouveau prospect</ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <Input
                isRequired
                label="N° SIRET*"
                placeholder="12345678901234"
                value={newProspect.siret}
                onChange={(e) =>
                  setNewProspect((prev) => ({ ...prev, siret: e.target.value }))
                }
              />
              <Input
                isRequired
                label="Nom établissement*"
                placeholder="Nom de l'établissement"
                value={newProspect.nomEtablissement}
                onChange={(e) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    nomEtablissement: e.target.value,
                  }))
                }
              />
              <Input
                isRequired
                label="Ville*"
                placeholder="Paris"
                value={newProspect.ville}
                onChange={(e) =>
                  setNewProspect((prev) => ({ ...prev, ville: e.target.value }))
                }
              />
              <Input
                isRequired
                label="Téléphone*"
                placeholder="01 23 45 67 89"
                value={newProspect.telephone}
                onChange={(e) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    telephone: e.target.value,
                  }))
                }
              />
              <Select
                isRequired
                label="Catégorie*"
                selectedKeys={[newProspect.categorie]}
                onSelectionChange={(keys) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    categorie: Array.from(keys)[0] as
                      | "FOOD"
                      | "SHOP"
                      | "TRAVEL"
                      | "FUN"
                      | "BEAUTY",
                  }))
                }
              >
                <SelectItem key="FOOD">FOOD</SelectItem>
                <SelectItem key="SHOP">SHOP</SelectItem>
                <SelectItem key="TRAVEL">TRAVEL</SelectItem>
                <SelectItem key="FUN">FUN</SelectItem>
                <SelectItem key="BEAUTY">BEAUTY</SelectItem>
              </Select>
              <Select
                label="Statut*"
                selectedKeys={[newProspect.statut]}
                onSelectionChange={(keys) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    statut: Array.from(keys)[0] as
                      | "a_contacter"
                      | "en_discussion"
                      | "glacial",
                  }))
                }
              >
                <SelectItem key="a_contacter">À contacter</SelectItem>
                <SelectItem key="en_discussion">En discussion</SelectItem>
                <SelectItem key="glacial">Glacial</SelectItem>
              </Select>
              <Input
                isRequired
                label="Date du premier rendez-vous*"
                type="date"
                value={newProspect.datePremierRendezVous}
                onChange={(e) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    datePremierRendezVous: e.target.value,
                  }))
                }
              />
              <Input
                isRequired
                label="Date de la relance*"
                type="date"
                value={newProspect.dateRelance}
                onChange={(e) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    dateRelance: e.target.value,
                  }))
                }
              />
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  Je viens de le rencontrer
                </span>
                <input
                  checked={newProspect.vientDeRencontrer}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  type="checkbox"
                  onChange={(e) =>
                    setNewProspect((prev) => ({
                      ...prev,
                      vientDeRencontrer: e.target.checked,
                    }))
                  }
                />
              </div>
              <Textarea
                label="Commentaire"
                placeholder="..."
                value={newProspect.commentaire}
                onChange={(e) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    commentaire: e.target.value,
                  }))
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleAddProspect}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de modification de prospect */}
      <Modal
        isOpen={isEditModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={setIsEditModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2>Modifier le prospect</h2>
            <p className="text-sm text-gray-500 font-normal">
              {editingProspect?.nomEtablissement}
            </p>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            {editingProspect && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Informations générales
                  </h3>

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="N° SIRET*"
                    placeholder="12345678901234"
                    value={editingProspect.siret || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, siret: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Nom établissement*"
                    placeholder="Nom de l'établissement"
                    value={editingProspect.nomEtablissement}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev
                          ? { ...prev, nomEtablissement: e.target.value }
                          : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Ville*"
                    placeholder="Paris"
                    value={editingProspect.ville || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, ville: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Téléphone*"
                    placeholder="01 23 45 67 89"
                    value={editingProspect.telephone || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, telephone: e.target.value } : null
                      )
                    }
                  />

                  <Select
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    label="Catégorie*"
                    placeholder="Sélectionner une catégorie"
                    selectedKeys={
                      editingProspect.categorie
                        ? [editingProspect.categorie]
                        : []
                    }
                    onSelectionChange={(keys) =>
                      setEditingProspect((prev) =>
                        prev
                          ? {
                              ...prev,
                              categorie: Array.from(keys)[0] as
                                | "FOOD"
                                | "SHOP"
                                | "TRAVEL"
                                | "FUN"
                                | "BEAUTY",
                            }
                          : null
                      )
                    }
                  >
                    <SelectItem key="FOOD">FOOD</SelectItem>
                    <SelectItem key="SHOP">SHOP</SelectItem>
                    <SelectItem key="TRAVEL">TRAVEL</SelectItem>
                    <SelectItem key="FUN">FUN</SelectItem>
                    <SelectItem key="BEAUTY">BEAUTY</SelectItem>
                  </Select>

                  <Input
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Email"
                    placeholder="contact@etablissement.fr"
                    type="email"
                    value={editingProspect.email || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Adresse"
                    placeholder="123 Rue de l'établissement, 75001 Paris"
                    value={editingProspect.adresse || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, adresse: e.target.value } : null
                      )
                    }
                  />
                </div>

                {/* Suivi */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Suivi
                  </h3>

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Date du premier rendez-vous*"
                    type="date"
                    value={editingProspect.datePremierRendezVous || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev
                          ? { ...prev, datePremierRendezVous: e.target.value }
                          : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Date de la relance*"
                    type="date"
                    value={editingProspect.dateRelance || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, dateRelance: e.target.value } : null
                      )
                    }
                  />

                  <Select
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    label="Suivi par"
                    placeholder="Sélectionner une personne"
                    selectedKeys={
                      editingProspect.suiviPar ? [editingProspect.suiviPar] : []
                    }
                    onSelectionChange={(keys) =>
                      setEditingProspect((prev) =>
                        prev
                          ? { ...prev, suiviPar: Array.from(keys)[0] as string }
                          : null
                      )
                    }
                  >
                    <SelectItem key="nom">Nom</SelectItem>
                    <SelectItem key="prenom">Prénom</SelectItem>
                  </Select>

                  <Select
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    label="Statut*"
                    placeholder="Sélectionner un statut"
                    selectedKeys={
                      editingProspect.statut ? [editingProspect.statut] : []
                    }
                    onSelectionChange={(keys) =>
                      setEditingProspect((prev) =>
                        prev
                          ? {
                              ...prev,
                              statut: Array.from(keys)[0] as
                                | "a_contacter"
                                | "en_discussion"
                                | "glacial",
                            }
                          : null
                      )
                    }
                  >
                    <SelectItem key="a_contacter">À contacter</SelectItem>
                    <SelectItem key="en_discussion">En discussion</SelectItem>
                    <SelectItem key="glacial">Glacial</SelectItem>
                  </Select>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      Je viens de le rencontrer
                    </span>
                    <input
                      checked={editingProspect.vientDeRencontrer || false}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      type="checkbox"
                      onChange={(e) =>
                        setEditingProspect((prev) =>
                          prev
                            ? { ...prev, vientDeRencontrer: e.target.checked }
                            : null
                        )
                      }
                    />
                  </div>
                </div>

                {/* Commentaire */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Commentaire
                  </h3>

                  <Textarea
                    classNames={{
                      input: "text-sm",
                    }}
                    minRows={4}
                    placeholder="Informations supplémentaires..."
                    value={editingProspect.commentaire || ""}
                    onChange={(e) =>
                      setEditingProspect((prev) =>
                        prev ? { ...prev, commentaire: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsEditModalOpen(false);
                setEditingProspect(null);
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleUpdateProspect}
            >
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
