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
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useToastContext } from "@/contexts/toast-context";
import { Prospect } from "@/types/prospect";

export default function ProspectsPage() {
  const { userProfile } = useUser();
  const { authFetch } = useAuthFetch();
  const { showError } = useToastContext();
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
  const [selectedTab, setSelectedTab] = useState("a_contacter");
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);

  const previousTabRef = useRef(selectedTab);

  // Variables pour les filtres
  const [collaborateurs, setCollaborateurs] = useState<{ id: string; nomComplet: string; villes?: string[] }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Récupérer la liste des membres d'équipe et catégories au chargement de la page
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Récupérer les membres d'équipe via l'API equipe
        const equipeResponse = await authFetch('/api/equipe?limit=200&offset=0');

        if (equipeResponse.ok) {
          const equipeData = await equipeResponse.json();
          let allMembers = equipeData.results || [];

          // Filtrer les membres selon les villes de l'utilisateur connecté
          if (userProfile?.villes && userProfile.villes.length > 0) {
            const userVilles = userProfile.villes.map(v => v.ville);

            allMembers = allMembers.filter((member: any) => {
              // Si le membre a des villes, vérifier qu'il y a au moins une intersection
              if (member.villeEpicu && member.villeEpicu.length > 0) {
                return member.villeEpicu.some((ville: string) => userVilles.includes(ville));
              }

              // Si le membre n'a pas de villes spécifiées, l'inclure (probablement un admin)
              return true;
            });
          }

          // Mapper les données pour correspondre au format attendu par le dropdown
          const mappedMembers = allMembers.map((member: any) => ({
            id: member.id, // Utiliser l'identifiant de l'utilisateur
            nomComplet: `${member.prenom} ${member.nom}`,
            villes: member.villeEpicu || []
          }));

          setCollaborateurs(mappedMembers);
        }

        // Récupérer les catégories
        const catResponse = await authFetch('/api/categories?limit=200&offset=0');

        if (catResponse.ok) {
          const catData = await catResponse.json();

          setCategories(catData.results || []);
        }
      } catch {
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

        const response = await authFetch(fullUrl);

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

        const response = await authFetch(fullUrl);

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
        // Onglet "Contacté" - utiliser l'API des prospects normaux
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

        const response = await authFetch(fullUrl);

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
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      showError(errorMessage);
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
      categorie: prospect.categorie as any,
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

  const openConvertModal = (prospect: Prospect) => {
    // Convertir ApiProspect en Prospect pour la conversion
    const prospectForConvert: Prospect = {
      id: prospect.id,
      nomEtablissement: prospect.nomEtablissement,
      ville: prospect.ville,
      telephone: prospect.telephone || '',
      categorie: prospect.categorie as any,
      statut: selectedTab as any,
      datePriseContact: prospect.datePriseContact || '',
      dateRelance: prospect.dateRelance,
      commentaires: prospect.commentaires,
      suiviPar: prospect.suiviPar,
      email: prospect.email,
      adresse: prospect.adresse,
    };


    setProspectToConvert(prospectForConvert);
    setIsConvertModalOpen(true);
  };


  return (
    <div className="w-full">
      <Card className="w-full shadow-none" shadow="none">
        <CardBody className="p-2 sm:p-4">
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs
              className="mb-6 pt-3 text-xl"
              classNames={{
                cursor: "w-[50px] left-[12px] h-1 rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light",
              }}
              selectedKey={selectedTab}
              variant="underlined"
              onSelectionChange={(key) => setSelectedTab(key as string)}
            >
              <Tab key="a_contacter" title="Contacté" />
              <Tab key="en_discussion" title="En discussion" />
              <Tab key="glacial" title="Glacial" />
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Input
                className="w-full pr-2 pl-2 sm:pr-4 sm:pl-10 pb-4 sm:pb-0"
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pl-2 pr-2 sm:pl-4 sm:pr-4 pb-4 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <StyledSelect
                className="w-full sm:w-32"
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
                className="w-full sm:w-45"
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
              className="w-full sm:w-auto"
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
              <div className="overflow-x-auto">
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
                  classNames={{
                    wrapper: "min-w-full",
                    table: "min-w-[1000px]"
                  }}
                >
                <TableHeader className="mb-4">
                  <TableColumn className="font-light text-sm min-w-[120px]">Basculer</TableColumn>
                  <TableColumn className="font-light text-sm min-w-[80px]">Modifier</TableColumn>
                  <TableColumn className="font-light text-sm min-w-[120px]">
                    <SortableColumnHeader
                      field="categorie"
                      label="Catégorie"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm min-w-[150px]">Nom établissement</TableColumn>
                  <TableColumn className="font-light text-sm min-w-[120px]">Date premier contact</TableColumn>

                  <TableColumn className="font-light text-sm min-w-[120px]">
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
                  <TableColumn className="font-light text-sm min-w-[120px]">Ville</TableColumn>

                  <TableColumn className="font-light text-sm min-w-[120px]">Téléphone</TableColumn>

                  <TableColumn className="font-light text-sm min-w-[150px]">Mail</TableColumn>
                  <TableColumn className="font-light text-sm min-w-[200px]">Commentaire</TableColumn>
                </TableHeader>
                <TableBody className="mt-4">
                  {prospects.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center" colSpan={11}>
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
                            endContent={<ArrowRightIcon className="h-4 w-4" />}
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
                          <CategoryBadge category={prospect.categorie[0]} />
                          {
                            prospect.categorie.length > 1 && (prospect.categorie as any[])[1] && (
                              <CategoryBadge className="ml-2" category={(prospect.categorie as any[])[1]} />
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
                        <TableCell className="font-light min-w-32 text-xs sm:text-sm">{prospect.telephone}</TableCell>


                        <TableCell className="font-light text-xs sm:text-sm">{prospect.email}</TableCell>
                        <TableCell className="font-light text-xs sm:text-sm">{prospect.commentaires}</TableCell>


                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>}
        </CardBody>
      </Card>





      {/* Modal de conversion de prospect en client */}
      <ConvertProspectModal
        isOpen={isConvertModalOpen}
        prospect={prospectToConvert}
        onOpenChange={(open) => {
          setIsConvertModalOpen(open);
          if (!open) {
            setProspectToConvert(null);
          }
        }}
        onInteractionCreated={fetchProspects}
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
