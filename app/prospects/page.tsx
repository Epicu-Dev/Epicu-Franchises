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
import { Tabs, Tab } from "@heroui/tabs";
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { CategoryBadge } from "@/components/badges";
import { ProspectModal } from "@/components/prospect-modal";
import ConvertProspectModal from "@/components/convert-prospect-modal";
import { StyledSelect } from "@/components/styled-select";
import { SortableColumnHeader } from "@/components";
import { useUser } from "@/contexts/user-context";
import { Prospect } from "@/types/prospect";

export default function ProspectsPage() {
  const { userProfile } = useUser();
  const [prospects, setProspects] = useState<Prospect[]>([]);
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
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isLoadingConvert, setIsLoadingConvert] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("a_contacter");
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);

  const previousTabRef = useRef(selectedTab);

  // Variables pour les filtres
  const [collaborateurs, setCollaborateurs] = useState<{ id: string; nomComplet: string; villes?: string[] }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Récupérer la liste des collaborateurs et catégories au chargement de la page
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Récupérer les collaborateurs
        const collabResponse = await fetch('/api/collaborateurs?limit=200&offset=0');

        if (collabResponse.ok) {
          const collabData = await collabResponse.json();
          let allCollaborateurs = collabData.results || [];

          // Filtrer les collaborateurs selon les villes de l'utilisateur connecté
          if (userProfile?.villes && userProfile.villes.length > 0) {
            const userVilles = userProfile.villes.map(v => v.ville);
            allCollaborateurs = allCollaborateurs.filter((collab: any) => {
              // Si le collaborateur a des villes, vérifier qu'il y a au moins une intersection
              if (collab.villes && collab.villes.length > 0) {
                return collab.villes.some((ville: string) => userVilles.includes(ville));
              }
              // Si le collaborateur n'a pas de villes spécifiées, l'inclure (probablement un admin)
              return true;
            });
          }

          setCollaborateurs(allCollaborateurs);
        }

        // Récupérer les catégories
        const catResponse = await fetch('/api/categories?limit=200&offset=0');

        if (catResponse.ok) {
          const catData = await catResponse.json();

          setCategories(catData.results || []);
        }
      } catch (err) {
        // console.error('Erreur lors de la récupération des filtres:', err);
      }
    };

    fetchFilters();
  }, [userProfile?.villes]);

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



  const handleEditProspect = (prospect: Prospect) => {
    setError(null);
    // Convertir ApiProspect en Prospect pour l'édition
    const prospectForEdit: Prospect = {
      id: prospect.id,
      nomEtablissement: prospect.nomEtablissement,
      ville: prospect.ville,
      telephone: prospect.telephone || '',
      categorie1: prospect.categorie1 as any,
      categorie2: prospect.categorie2 as any,
      statut: selectedTab as any,
      datePriseContact: prospect.datePriseContact || '',
      dateRelance: prospect.dateRelance,
      commentaires: prospect.commentaires,
      suiviPar: prospect.suiviPar,
      email: prospect.email,
      adresse: prospect.adresse,
    };

    setEditingProspect(prospectForEdit);
    setIsProspectModalOpen(true);
  };

  const handleConvertToClient = async () => {
    if (!prospectToConvert || !editingClient) return;

    try {
      setIsLoadingConvert(true);
      setConvertError(null);

      // Préparer les données du client pour l'API
      const clientData = {
        ...editingClient,
        // S'assurer que les données du prospect sont bien transmises
        nomEtablissement: prospectToConvert.nomEtablissement,
        ville: prospectToConvert.ville,
        telephone: prospectToConvert.telephone,
        categorie1: prospectToConvert.categorie1,
        categorie2: prospectToConvert.categorie2,
        email: prospectToConvert.email,
        commentaires: prospectToConvert.commentaires,
        adresse: prospectToConvert.adresse,
      };

      const response = await fetch(`/api/prospects/${prospectToConvert.id}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la conversion en client");
      }

      // Fermer le modal et réinitialiser
      setIsConvertModalOpen(false);
      setProspectToConvert(null);
      setEditingClient(null);

      // Recharger les prospects
      fetchProspects();
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoadingConvert(false);
    }
  };

  const openConvertModal = (prospect: Prospect) => {
    // Convertir ApiProspect en Prospect pour la conversion
    const prospectForConvert: Prospect = {
      id: prospect.id,
      nomEtablissement: prospect.nomEtablissement,
      ville: prospect.ville,
      telephone: prospect.telephone || '',
      categorie1: prospect.categorie1 as any,
      categorie2: prospect.categorie2 as any,
      statut: selectedTab as any,
      datePriseContact: prospect.datePriseContact || '',
      dateRelance: prospect.dateRelance,
      commentaires: prospect.commentaires,
      suiviPar: prospect.suiviPar,
      email: prospect.email,
      adresse: prospect.adresse,
    };

    // Initialiser les données du client avec les données du prospect
    const clientData = {
      id: '',
      raisonSociale: prospect.nomEtablissement,
      ville: prospect.ville,
      categorie1: prospect.categorie1,
      categorie2: prospect.categorie2,
      telephone: prospect.telephone || '',
      nomEtablissement: prospect.nomEtablissement,
      email: prospect.email || '',
      datePriseContact: '',
      datePublicationContenu: '',
      datePublicationFacture: '',
      statutPaiementContenu: 'En attente' as const,
      montantFactureContenu: '',
      montantPaye: '',
      dateReglementFacture: '',
      restantDu: '',
      montantSponsorisation: '',
      montantAddition: '',
      factureContenu: '',
      facturePublication: '',
      commentaire: prospect.commentaires,
      commentaireCadeauGerant: '',
      montantCadeau: '',
      tirageAuSort: false,
      adresse: prospect.adresse,
      statut: 'actif' as const,
    };

    setProspectToConvert(prospectForConvert);
    setEditingClient(clientData);
    setConvertError(null);
    setIsConvertModalOpen(true);
  };


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
                startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                classNames={{
                  input:
                    "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                  inputWrapper:
                    "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-page-bg",
                }}
                endContent={searchTerm && <XMarkIcon className="h-5 w-5 cursor-pointer" onClick={() => setSearchTerm('')} />}
                placeholder="Rechercher..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                <SelectItem key="tous">Toutes</SelectItem>
                {categories.length > 0 ? (
                  <>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem key="loading">Chargement...</SelectItem>
                )}
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
                {collaborateurs.length > 0 ? (
                  <>
                    {collaborateurs.map((collab) => (
                      <SelectItem key={collab.id}>
                        {collab.nomComplet}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem key="loading">Chargement...</SelectItem>
                )}
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
          {loading ? <div className="w-full">
            <Card className="w-full" shadow="none">
              <CardBody className="p-6">
                <div className="flex justify-center items-center h-64">
                  <Spinner className="text-black dark:text-white" size="lg" />
                </div>
              </CardBody>
            </Card>
          </div> :
            error ? <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Erreur: {error}</div>
            </div> :
              <Table
                aria-label="Tableau des prospects"
                bottomContent={
                  hasMore && (
                    <div className="flex justify-center py-4">
                      <Button
                        color="primary"
                        disabled={loadingMore}
                        isLoading={loadingMore}
                        onPress={loadMore}
                      >
                        {loadingMore ? 'Chargement...' : 'Charger plus'}
                      </Button>
                    </div>
                  )
                }
                shadow="none"
              >
                <TableHeader className="mb-4">
                  <TableColumn className="font-light text-sm">Basculer en client</TableColumn>
                  <TableColumn className="font-light text-sm">Modifier</TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="categorie"
                      label="Catégorie"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">Nom établissement</TableColumn>
                  <TableColumn className="font-light text-sm">Date premier contact</TableColumn>

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
                  <TableColumn className="font-light text-sm">Ville</TableColumn>

                  <TableColumn className="font-light text-sm">Téléphone</TableColumn>

                  <TableColumn className="font-light text-sm">Mail</TableColumn>
                  <TableColumn className="font-light text-sm">Commentaire</TableColumn>
                </TableHeader>
                <TableBody className="mt-4">
                  {prospects.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center" colSpan={14}>
                        <div className="py-20 text-gray-500">
                          {searchTerm || selectedCategory !== '' || selectedSuiviPar !== '' ? (
                            <div>
                              <div className="text-lg mb-2">Aucun prospect trouvé</div>
                              <div className="text-sm">Essayez de modifier vos filtres ou de créer un nouveau prospect</div>
                              <Button
                                className="mt-4"
                                color="primary"
                                onPress={() => {
                                  setSearchTerm('');
                                  setSelectedCategory('');
                                  setSelectedSuiviPar('');
                                }}
                              >
                                Réinitialiser les filtres
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-lg mb-2">Aucun prospect disponible</div>
                              <div className="text-sm">Commencez par ajouter votre premier prospect</div>
                              <Button
                                className="mt-4"
                                color="primary"
                                variant="flat"
                                onPress={() => {
                                  setEditingProspect(null);
                                  setIsProspectModalOpen(true);
                                }}
                              >
                                Ajouter un prospect
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    prospects.map((prospect) => (

                      <TableRow key={prospect.id} className="border-t border-gray-100 dark:border-gray-700">
                        <TableCell className="font-light">
                          <Button
                            className="px-6 border-1"
                            color="primary"
                            variant="bordered"
                            size="sm"
                            endContent={<ArrowRightIcon />}
                            onPress={() => openConvertModal(prospect)}
                          >
                            Convertir
                          </Button>
                        </TableCell>
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
                          <CategoryBadge category={prospect.categorie1} />
                          {
                            prospect.categorie2 && (
                              <CategoryBadge className="ml-2" category={prospect.categorie2} />
                            )
                          }

                        </TableCell>

                        <TableCell className="font-light py-5">
                          {prospect.nomEtablissement}
                        </TableCell>
                        <TableCell className="font-light">
                          {prospect.datePriseContact
                            ? new Date(prospect.datePriseContact).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }).replace(/\//g, '.')
                            : "-"
                          }
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

                        <TableCell className="font-light">{prospect.ville}</TableCell>
                        <TableCell className="font-light">{prospect.telephone}</TableCell>


                        <TableCell className="font-light">{prospect.email}</TableCell>
                        <TableCell className="font-light">{prospect.commentaires}</TableCell>


                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>}
        </CardBody>
      </Card>





      {/* Modal de conversion de prospect en client */}
      <ConvertProspectModal
        error={convertError}
        editingClient={editingClient}
        isLoading={isLoadingConvert}
        isOpen={isConvertModalOpen}
        prospect={prospectToConvert}
        setEditingClient={setEditingClient}
        onOpenChange={(open) => {
          setIsConvertModalOpen(open);
          if (!open) {
            setProspectToConvert(null);
            setEditingClient(null);
            setConvertError(null);
          }
        }}
        onUpdateClient={handleConvertToClient}
      />

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
