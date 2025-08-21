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

import { ProspectModal } from "@/components/prospect-modal";

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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [prospectToConvert, setProspectToConvert] = useState<Prospect | null>(null);
  const [selectedTab, setSelectedTab] = useState("a_contacter");
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);

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



  const handleEditProspect = (prospect: Prospect) => {
    setError(null);
    setEditingProspect(prospect);
    setIsEditModalOpen(true);
  };

  const handleUpdateProspect = async () => {
    if (!editingProspect) return;

    try {
      // Validation côté client
      if (!editingProspect.nomEtablissement.trim()) {
        setError("Le nom de l'établissement est requis");

        return;
      }

      if (!editingProspect.ville.trim()) {
        setError("La ville est requise");

        return;
      }

      if (!editingProspect.telephone.trim()) {
        setError("Le téléphone est requis");

        return;
      }

      if (!editingProspect.datePremierRendezVous) {
        setError("La date du premier rendez-vous est requise");

        return;
      }

      if (!editingProspect.dateRelance) {
        setError("La date de relance est requise");

        return;
      }

      const response = await fetch(`/api/prospects/${editingProspect.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProspect),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de la modification du prospect");
      }

      // Fermer le modal et recharger les prospects
      setIsEditModalOpen(false);
      setEditingProspect(null);
      setError(null);
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleConvertToClient = async () => {
    if (!prospectToConvert) return;

    try {
      const response = await fetch(`/api/prospects/${prospectToConvert.id}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la conversion en client");
      }

      // Fermer le modal et réinitialiser
      setIsConvertModalOpen(false);
      setProspectToConvert(null);

      // Recharger les prospects
      fetchProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const openConvertModal = (prospect: Prospect) => {
    setProspectToConvert(prospect);
    setIsConvertModalOpen(true);
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
                onPress={() => setIsProspectModalOpen(true)}
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
                      className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryBadgeColor(prospect.categorie)}`}
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
                      onPress={() => openConvertModal(prospect)}
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
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
                    label="N° SIRET"
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
                    label="Nom établissement"
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
                    label="Ville"
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
                    label="Téléphone"
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
                    label="Catégorie"
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
                    label="Date du premier rendez-vous"
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
                    label="Date de la relance"
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
                    label="Statut"
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

      {/* Modal de confirmation de conversion */}
      <Modal isOpen={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <ModalContent>
          <ModalHeader>Confirmer la conversion</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Convertir ce prospect en client ?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Cette action va convertir <strong>{prospectToConvert?.nomEtablissement}</strong> en client.
                    Le prospect sera supprimé de la liste des prospects.
                  </p>
                </div>
              </div>

              {prospectToConvert && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Informations du prospect :
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Établissement :</strong> {prospectToConvert.nomEtablissement}</p>
                    <p><strong>Ville :</strong> {prospectToConvert.ville}</p>
                    <p><strong>Téléphone :</strong> {prospectToConvert.telephone}</p>
                    <p><strong>Catégorie :</strong> {prospectToConvert.categorie}</p>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsConvertModalOpen(false);
                setProspectToConvert(null);
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"

              onPress={handleConvertToClient}
            >
              Confirmer la conversion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'ajout de prospect réutilisable */}
      <ProspectModal
        isOpen={isProspectModalOpen}
        onClose={() => setIsProspectModalOpen(false)}
        onProspectAdded={fetchProspects}
      />
    </div>
  );
}
