"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
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

// Interface pour le LazyLoading
interface LazyLoadingInfo {
  hasMore: boolean;
  nextOffset: number | null;
  loadingMore: boolean;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<ApiProspect[]>([]);
  // Variables pour le LazyLoading
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [, setViewCount] = useState<number | null>(null);
  const previousTabRef = useRef(selectedTab);

  const fetchProspects = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Vérifier si l'onglet a changé et remettre les données à zéro
      if (!isLoadMore && previousTabRef.current !== selectedTab) {
        setProspects([]);
        setNextOffset(0);
        setHasMore(true);
        previousTabRef.current = selectedTab;
      }

      // Construire les paramètres de requête pour l'API Airtable
      const params = new URLSearchParams();
      
      // Adapter les paramètres selon l'onglet sélectionné
      if (selectedTab === 'en_discussion') {
        // Utiliser l'API des discussions
        const offset = isLoadMore ? (nextOffset || 0) : 0;
        const url = `/api/prospects/discussion?limit=20&offset=${offset}`;
        
        if (searchTerm) params.set('q', searchTerm);
        if (selectedCategory && selectedCategory !== 'tous') params.set('category', selectedCategory);
        if (selectedSuiviPar && selectedSuiviPar !== 'tous') params.set('suivi', selectedSuiviPar);
        
        const queryString = params.toString();
        const fullUrl = `${url}${queryString ? `&${queryString}` : ''}`;
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des discussions");
        }
        
        const data = await response.json();
        
        if (isLoadMore) {
          setProspects(prev => [...prev, ...(data.discussions || [])]);
        } else {
          setProspects(data.discussions || []);
        }
        
        // Mettre à jour la pagination pour le LazyLoading
        setHasMore(data.pagination?.hasMore || false);
        setNextOffset(data.pagination?.nextOffset || null);
        
      } else if (selectedTab === 'glacial') {
        // Utiliser l'API des prospects glaciaux
        const offset = isLoadMore ? (nextOffset || 0) : 0;
        const url = `/api/prospects/glacial?limit=20&offset=${offset}`;
        
        if (searchTerm) params.set('q', searchTerm);
        if (selectedCategory && selectedCategory !== 'tous') params.set('category', selectedCategory);
        if (selectedSuiviPar && selectedSuiviPar !== 'tous') params.set('suivi', selectedSuiviPar);
        
        const queryString = params.toString();
        const fullUrl = `${url}${queryString ? `&${queryString}` : ''}`;
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des prospects glaciaux");
        }
        
        const data = await response.json();
        
        if (isLoadMore) {
          setProspects(prev => [...prev, ...(data.prospects || [])]);
        } else {
          setProspects(data.prospects || []);
        }
        
        // Mettre à jour la pagination pour le LazyLoading
        setHasMore(data.pagination?.hasMore || false);
        setNextOffset(data.pagination?.nextOffset || null);
        
      } else {
        // Onglet "À contacter" - utiliser l'API des prospects normaux
        const offset = isLoadMore ? (nextOffset || 0) : 0;
        const url = `/api/prospects/prospects?limit=20&offset=${offset}`;
        
        if (searchTerm) params.set('q', searchTerm);
        if (selectedCategory && selectedCategory !== 'tous') params.set('category', selectedCategory);
        if (selectedSuiviPar && selectedSuiviPar !== 'tous') params.set('suivi', selectedSuiviPar);
        
        // Ajouter le tri si spécifié
        if (sortField) {
          let orderByField = sortField;
          // Mapper les champs de tri vers les noms Airtable
          switch (sortField) {
            case 'categorie':
              orderByField = 'Catégorie';
              break;
            case 'dateRelance':
              orderByField = 'Date de relance';
              break;
            case 'suiviPar':
              orderByField = 'Suivi par';
              break;
            default:
              orderByField = "Nom de l'établissement";
          }
          params.set('orderBy', orderByField);
        }
        if (sortDirection) params.set('order', sortDirection);
        
        const queryString = params.toString();
        const fullUrl = `${url}${queryString ? `&${queryString}` : ''}`;
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des prospects");
        }
        
        const data = await response.json();
        
        if (isLoadMore) {
          setProspects(prev => [...prev, ...(data.prospects || [])]);
        } else {
          setProspects(data.prospects || []);
        }
        
        // Mettre à jour la pagination pour le LazyLoading
        setHasMore(data.pagination?.hasMore || false);
        setNextOffset(data.pagination?.nextOffset || null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fonction pour charger plus de données
  const loadMore = () => {
    if (hasMore && !loadingMore && nextOffset !== null) {
      fetchProspects(true);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [
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
              color='primary'
              endContent={<PlusIcon className="h-4 w-4" />}
              onPress={() => {
                setEditingProspect(null);
                setIsProspectModalOpen(true);
              }}
            >
              Ajouter un prospect
            </Button>
          </div>

          {/* Table avec LazyLoading */}
          <Table 
            aria-label="Tableau des prospects" 
            shadow="none"
            bottomContent={
              hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={loadMore}
                    isLoading={loadingMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Chargement...' : 'Charger plus'}
                  </Button>
                </div>
              )
            }
          >
            <TableHeader className="mb-4">
              <TableColumn className="font-light text-sm">Nom établissement</TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="categorie"
                  label="Catégorie"
                  sortDirection={sortDirection}
                  sortField={sortField}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="dateRelance"
                  label="Date de relance"
                  sortDirection={sortDirection}
                  sortField={sortField}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="suiviPar"
                  label="Suivi par"
                  sortDirection={sortDirection}
                  sortField={sortField}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">Commentaire</TableColumn>
              <TableColumn className="font-light text-sm">Modifier</TableColumn>
              <TableColumn className="font-light text-sm">Basculer en client</TableColumn>
            </TableHeader>
            <TableBody 
              className="mt-4"
              loadingContent={<Spinner className="text-black dark:text-white" size="lg" />}
              loadingState={loading ? "loading" : "idle"}
            >
              {prospects.map((prospect) => (
                <TableRow key={prospect.id} className="border-t border-gray-100 dark:border-gray-700">
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
                      aria-label={`Modifier le prospect ${prospect.nomEtablissement}`}
                      className="text-gray-600 hover:text-gray-800"
                      size="sm"
                      variant="light"
                      onPress={() => handleEditProspect(prospect)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-light">
                    <Button
                      className="px-6"
                      color="primary"
                      size="sm"
                      onPress={() => openConvertModal(prospect)}
                    >
                      Convertir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Info sur le nombre d'éléments chargés */}
          {!loading && (
            <div className="text-center mt-4 text-sm text-gray-500">
              Affichage de {prospects.length} prospect(s) chargé(s)
              {hasMore && " - Plus de données disponibles"}
            </div>
          )}
        </CardBody>
      </Card>





      {/* Modal de confirmation de conversion */}
      <Modal isOpen={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <ModalContent>
          <ModalHeader>Confirmer la conversion</ModalHeader>
          <ModalBody>
            <div className="space-y-4 text-primary">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium">
                    Convertir ce prospect en client ?
                  </h3>
                  <p className="text-sm mt-1">
                    Cette action va convertir <strong>{prospectToConvert?.nomEtablissement}</strong> en client.
                    Le prospect sera supprimé de la liste des prospects.
                  </p>
                </div>
              </div>

              {prospectToConvert && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">
                    Informations du prospect :
                  </h4>
                  <div className="space-y-1 text-sm">
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
              className="border-1"
              color='primary'
              variant="bordered"
              onPress={() => {
                setIsConvertModalOpen(false);
                setProspectToConvert(null);
              }}
            >
              Annuler
            </Button>
            <Button
              color='primary'
              onPress={handleConvertToClient}
            >
              Confirmer la conversion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'ajout et de modification de prospect réutilisable */}
      <ProspectModal
        editingProspect={editingProspect}
        isEditing={!!editingProspect}
        isOpen={isProspectModalOpen}
        onClose={() => {
          setIsProspectModalOpen(false);
          setEditingProspect(null);
        }}
        onProspectAdded={fetchProspects}
      />
    </div>
  );
}
