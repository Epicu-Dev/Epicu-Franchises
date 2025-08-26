"use client";

import { useState, useEffect, useRef } from "react";
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
import { CategoryBadge } from "@/components/badges";

import { ProspectModal } from "@/components/prospect-modal";
import { StyledSelect } from "@/components/styled-select";
import { SortableColumnHeader } from "@/components";

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

interface ApiProspect {
  id: string;
  nomEtablissement: string;
  categorie: string;
  ville: string;
  suiviPar: string;
  commentaires: string;
  dateRelance: string;
  telephone?: string;
  datePremierRendezVous?: string;
  vientDeRencontrer?: boolean;
  email?: string;
  adresse?: string;
  siret?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<ApiProspect[]>([]);
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
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [prospectToConvert, setProspectToConvert] = useState<Prospect | null>(null);
  const [selectedTab, setSelectedTab] = useState("a_contacter");
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const previousTabRef = useRef(selectedTab);

  const fetchProspects = async () => {
    console.log('fetchProspects');

    try {
      setLoading(true);
      setError(null);

      // Vérifier si l'onglet a changé et remettre la pagination à 1
      if (previousTabRef.current !== selectedTab) {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        previousTabRef.current = selectedTab;
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.append('statut', selectedTab);
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory && selectedCategory !== 'tous') params.append('categorie', selectedCategory);
      if (selectedSuiviPar && selectedSuiviPar !== 'tous') params.append('suiviPar', selectedSuiviPar);
      if (sortField) params.append('orderBy', sortField);
      if (sortDirection) params.append('order', sortDirection);
      params.append('limit', pagination.itemsPerPage.toString());
      params.append('offset', ((pagination.currentPage - 1) * pagination.itemsPerPage).toString());

      const queryString = params.toString();
      const url = `/api/prospects${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des prospects");
      }

      const data = await response.json();

      // Adapter la réponse selon le statut
      if (selectedTab === 'en_discussion') {
        setProspects(data.discussions || []);
      } else {
        setProspects(data.prospects || []);
      }

      setViewCount(data.viewCount ?? null);
      setPagination(prev => ({
        ...prev,
        totalItems: data.totalCount || 0,
        totalPages: Math.ceil((data.totalCount || 0) / prev.itemsPerPage)
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      console.log('finally');
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
    sortField,
    sortDirection,
    selectedTab,
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };



  const handleEditProspect = (prospect: ApiProspect) => {
    setError(null);
    // Convertir ApiProspect en Prospect pour l'édition
    const prospectForEdit: Prospect = {
      id: prospect.id,
      siret: prospect.siret || '',
      nomEtablissement: prospect.nomEtablissement,
      ville: prospect.ville,
      telephone: prospect.telephone || '',
      categorie: prospect.categorie as any,
      statut: selectedTab as any,
      datePremierRendezVous: prospect.datePremierRendezVous || '',
      dateRelance: prospect.dateRelance,
      vientDeRencontrer: prospect.vientDeRencontrer || false,
      commentaire: prospect.commentaires,
      suiviPar: prospect.suiviPar,
      email: prospect.email,
      adresse: prospect.adresse,
    };
    setEditingProspect(prospectForEdit);
    setIsProspectModalOpen(true);
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

  const openConvertModal = (prospect: ApiProspect) => {
    // Convertir ApiProspect en Prospect pour la conversion
    const prospectForConvert: Prospect = {
      id: prospect.id,
      siret: prospect.siret || '',
      nomEtablissement: prospect.nomEtablissement,
      ville: prospect.ville,
      telephone: prospect.telephone || '',
      categorie: prospect.categorie as any,
      statut: selectedTab as any,
      datePremierRendezVous: prospect.datePremierRendezVous || '',
      dateRelance: prospect.dateRelance,
      vientDeRencontrer: prospect.vientDeRencontrer || false,
      commentaire: prospect.commentaires,
      suiviPar: prospect.suiviPar,
      email: prospect.email,
      adresse: prospect.adresse,
    };
    setProspectToConvert(prospectForConvert);
    setIsConvertModalOpen(true);
  };



  if (loading && prospects.length === 0) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
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
        <Card className="w-full" shadow="none">
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
      <Card className="w-full shadow-none" shadow="none">
        <CardBody>
          {/* Tabs */}
          <div className="flex justify-between items-center">
            <Tabs
              className="mb-6  pt-3 text-xl"
              classNames={{
                cursor: "w-[50px]  left-[12px] h-1   rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
              }}
              selectedKey={selectedTab}
              variant="underlined"
              onSelectionChange={(key) => setSelectedTab(key as string)}
            >
              <Tab key="a_contacter" title="À contacter" />
              <Tab key="en_discussion" title="En discussion" />
              <Tab key="glacial" title="Glacial" />
            </Tabs>
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


          {/* Header with filters */}
          <div className="flex justify-between items-center pl-4 pr-4 pb-4">
            <div className="flex items-center gap-4">
              <StyledSelect
                className="w-32"
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
              </StyledSelect>

              <StyledSelect
                className="w-32"
                placeholder="Suivi par"
                selectedKeys={selectedSuiviPar ? [selectedSuiviPar] : []}
                onSelectionChange={(keys) =>
                  setSelectedSuiviPar(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="nom">Nom</SelectItem>
                <SelectItem key="prenom">Prénom</SelectItem>
              </StyledSelect>
            </div>

            <Button
              className="bg-black text-white hover:bg-gray-900"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={() => {
                setEditingProspect(null);
                setIsProspectModalOpen(true);
              }}
            >
              Ajouter un prospect
            </Button>
          </div>

          {/* Table */}
          {<Table aria-label="Tableau des prospects" shadow="none">
            <TableHeader className="mb-4 ">
              <TableColumn className="font-light text-sm">Nom établissement</TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="categorie"
                  label="Catégorie"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />

              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="dateRelance"
                  label="Date de relance"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />

              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="suiviPar"
                  label="Suivi par"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />

              </TableColumn>
              <TableColumn className="font-light text-sm">Commentaire</TableColumn>
              <TableColumn className="font-light text-sm">Modifier</TableColumn>
              <TableColumn className="font-light text-sm">Basculer en client</TableColumn>
            </TableHeader>
            <TableBody className="mt-4">
              {

                loading ? (
                  <TableRow>
                    <TableCell className="text-center" colSpan={7}>
                      <Spinner className="text-black dark:text-white p-20" size="lg" />
                    </TableCell>
                  </TableRow>
                ) :
                  prospects.map((prospect) => (
                    <TableRow className="border-t border-gray-100  dark:border-gray-700" key={prospect.id}>
                      <TableCell className="font-light py-5">
                        {prospect.nomEtablissement}
                      </TableCell>
                      <TableCell className="font-light">
                        <CategoryBadge category={prospect.categorie} />
                      </TableCell>
                      <TableCell className="font-light">
                        {prospect.dateRelance
                          ? new Date(prospect.dateRelance).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }).replace(/\//g, '.')
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="font-light">{prospect.suiviPar}</TableCell>
                      <TableCell className="font-light">{prospect.commentaires}</TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          className="text-gray-600 hover:text-gray-800"
                          size="sm"
                          variant="light"
                          aria-label={`Modifier le prospect ${prospect.nomEtablissement}`}
                          onPress={() => handleEditProspect(prospect)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-light">
                        <Button
                          color="primary"
                          className="bg-gray-800 text-white dark:bg-white dark:text-black hover:bg-gray-600 dark:hover:bg-gray-200 px-6"
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
          </Table>}

          {/* Pagination */}
          {!loading && <div className="flex justify-center mt-6">
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
          </div>}

          {/* Info sur le nombre total d'éléments */}
          {!loading && <div className="text-center mt-4 text-sm text-gray-500">
            Affichage de {prospects.length} prospect(s) sur{" "}
            {pagination.totalItems} au total
          </div>}
        </CardBody>
      </Card>





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

      {/* Modal d'ajout et de modification de prospect réutilisable */}
      <ProspectModal
        isOpen={isProspectModalOpen}
        onClose={() => {
          setIsProspectModalOpen(false);
          setEditingProspect(null);
        }}
        onProspectAdded={fetchProspects}
        editingProspect={editingProspect}
        isEditing={!!editingProspect}
      />
    </div>
  );
}
