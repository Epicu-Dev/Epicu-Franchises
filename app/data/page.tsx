"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "../../components/icons";
import { Spinner } from "@heroui/spinner";
import toast from "react-hot-toast";

import { DashboardLayout } from "../dashboard-layout";

import { useUser } from "@/contexts/user-context";
import { SubscribersEditModal } from "@/components";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { Data } from "@/types/data";

export default function DataPage() {
  const { userProfile, isLoading } = useUser();
  const { authFetch } = useAuthFetch();
  const [activeTab, setActiveTab] = useState("overview");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [tableData, setTableData] = useState<Data[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [savingSubscribers, setSavingSubscribers] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const allMonths = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Fonction pour formater le mois à partir de la date
  const formatMonthFromDate = (date: string): string => {
    try {
      // Format attendu: "MM-YYYY" (ex: "01-2024")
      const parts = date.split('-');

      if (parts.length === 2) {
        const monthIndex = parseInt(parts[0]) - 1;

        if (monthIndex >= 0 && monthIndex < 12) {
          return allMonths[monthIndex];
        }
      }

      return date; // Retourner la date originale si le format n'est pas reconnu
    } catch {
      return date;
    }
  };


  // Helper pour appeler la nouvelle API dédiée STATISTIQUES MENSUELLES VILLE
  const fetchCityMonthStats = async (date: string, ville: string) => {
    try {
      const params = new URLSearchParams();
      params.set('date', date);
      params.set('ville', ville);

      const response = await authFetch(`/api/data/data-ville?${params.toString()}`);
      if (response.ok) {
        const json = await response.json();
        return json;
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Fonction pour récupérer les données depuis l'API
  const fetchDataFromAPI = async () => {
    if (!userProfile?.villes || userProfile.villes.length === 0) {
      return [];
    }

    setDataLoading(true);
    setDataError(null);

    try {
      const currentYear = parseInt(selectedYear);
      const currentMonth = new Date().getMonth(); // 0-based (0 = Janvier)

      const allMonths = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];

      // Si c'est l'année actuelle, ne montrer que les mois passés et actuel
      let months = allMonths;

      if (currentYear === new Date().getFullYear()) {
        months = allMonths.slice(0, currentMonth + 1);
      }

      // Trier par ordre décroissant (plus récent en premier)
      months = [...months].reverse();

      // Déterminer quelle ville utiliser selon l'onglet sélectionné
      let selectedCity = null;

      if (activeTab === "overview") {
        // Pour "Vue d'ensemble", utiliser toutes les villes
        selectedCity = null;
      } else {
        // Pour un onglet de ville spécifique, trouver la ville correspondante
        selectedCity = userProfile.villes.find(city => 
          city.ville.toLowerCase().replace(/\s+/g, '-') === activeTab
        );
      }

      const dataPromises = months.map(async (month, _index) => {
        const monthNumber = allMonths.indexOf(month) + 1;
        const date = `${monthNumber.toString().padStart(2, '0')}-${currentYear}`;

        // Utiliser la ville sélectionnée ou "all" pour la vue d'ensemble
        let villeParam: string;
        if (activeTab === "overview") {
          villeParam = "all";
        } else {
          const selectedCityData = userProfile.villes.find(city => 
            city.ville.toLowerCase().replace(/\s+/g, '-') === activeTab
          );
          villeParam = selectedCityData?.id || selectedCityData?.ville || 'all';
        }

        try {
          const monthStats = await fetchCityMonthStats(date, villeParam);

          return {
            id: undefined,
            date,
            ville: villeParam,
            totalAbonnes: monthStats?.totalAbonnes || 0,
            totalVues: monthStats?.totalVues || 0,
            totalProspectsSignes: monthStats?.totalProspectsSignes || 0,
            totalProspectsVus: monthStats?.totalProspectsVus || 0,
            tauxConversion: monthStats?.tauxConversion || 0,
            rawCount: 0,
            moisAnnee: monthStats?.moisAnnee,
            villeEpicu: monthStats?.villeEpicu,
            prospectsSignesDsLeMois: monthStats?.totalProspectsSignes,
            tauxDeConversion: monthStats?.tauxConversion,
            viewsFood: monthStats?.vuesFood,
            abonnesFood: monthStats?.abonnesFood || 0,
            abonnesShop: monthStats?.abonnesShop || 0,
            vuesShop: monthStats?.vuesShop,
            abonnesTravel: monthStats?.abonnesTravel || 0,
            vuesTravel: monthStats?.vuesTravel,
            abonnesFun: monthStats?.abonnesFun || 0,
            vuesFun: monthStats?.vuesFun,
            abonnesBeauty: monthStats?.abonnesBeauty || 0,
            vuesBeauty: monthStats?.vuesBeauty,
            postsPublies: monthStats?.postsPublies || 0,
            cumulMontantCadeau: 0,
          } as Data;
        } catch {
          return {
            id: undefined,
            date,
            ville: villeParam,
            totalAbonnes: 0,
            totalVues: 0,
            totalProspectsSignes: 0,
            totalProspectsVus: 0,
            tauxConversion: 0,
            rawCount: 0,
            moisAnnee: undefined,
            villeEpicu: undefined,
            prospectsSignesDsLeMois: undefined,
            tauxDeConversion: undefined,
            viewsFood: undefined,
            abonnesFood: 0,
            abonnesShop: 0,
            vuesShop: undefined,
            abonnesTravel: 0,
            vuesTravel: undefined,
            abonnesFun: 0,
            vuesFun: undefined,
            abonnesBeauty: 0,
            vuesBeauty: undefined,
            postsPublies: 0,
            cumulMontantCadeau: 0,
          } as Data;
        }
      });

      const results = await Promise.all(dataPromises);

      return results;
    } catch {
      setDataError('Erreur lors du chargement des données');

      return [];
    } finally {
      setDataLoading(false);
    }
  };


  // Initialiser les données du tableau au chargement
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDataFromAPI();

      setTableData(data);
    };

    if (userProfile?.villes && userProfile.villes.length > 0) {
      loadData();
    } else {
      setTableData([]);
    }
  }, [userProfile?.villes, selectedYear, activeTab]);

  // Utiliser le hook de tri réutilisable directement sur les données de l'API
  const { sortedData } = useSortableTable(tableData);

  // Fonction pour déterminer si la ligne du tableau doit être mise à jour
  const shouldUpdateTableRow = (currentRow: Data, villeToUse: string, activeTab: string): boolean => {
    // Si on est dans la vue d'ensemble (activeTab === "overview")
    if (activeTab === "overview") {
      // Pour la vue d'ensemble, on met à jour seulement si la ligne correspond à "all"
      return currentRow.ville === "all";
    }
    
    // Si on est dans un onglet de ville spécifique
    const selectedCity = userProfile?.villes?.find(city => 
      city.ville.toLowerCase().replace(/\s+/g, '-') === activeTab
    );
    
    if (!selectedCity) {
      return false;
    }
    
    // Vérifier si la ville modifiée correspond exactement à la ville de l'onglet actif
    const selectedCityId = selectedCity.id || selectedCity.ville;
    const selectedCityName = selectedCity.ville;
    
    // La ville modifiée doit correspondre à la ville de l'onglet actif
    const villeModifieeCorrespond = villeToUse === selectedCityId || villeToUse === selectedCityName;
    
    // La ligne du tableau doit aussi correspondre à la ville de l'onglet actif
    const ligneTableauCorrespond = currentRow.ville === selectedCityId || currentRow.ville === selectedCityName;
    
    // On met à jour seulement si les deux conditions sont remplies
    return villeModifieeCorrespond && ligneTableauCorrespond;
  };

  // Fonction pour ouvrir le modal d'édition
  const handleEditSubscribers = (rowIndex: number) => {
    const actualIndex = tableData.findIndex(row =>
      sortedData.findIndex(sortedRow => sortedRow === row) === rowIndex
    );

    setEditingRowIndex(actualIndex);
    setEditModalOpen(true);
  };
  
  // Fonction pour sauvegarder les modifications
  const handleSaveSubscribers = async (newData: Pick<Data, 'abonnesFood' | 'abonnesShop' | 'abonnesTravel' | 'abonnesFun' | 'abonnesBeauty'>, selectedCity?: string) => {
    if (editingRowIndex !== null) {
      const currentRow = tableData[editingRowIndex];

      setSavingSubscribers(true);
      setSaveError(null);

      try {
        // Déterminer la ville à utiliser
        let villeToUse = selectedCity || currentRow.ville;
        
        // Si l'utilisateur n'a qu'une ville et que la ville actuelle est "all", 
        // utiliser l'ID de la seule ville de l'utilisateur
        if (userProfile?.villes && userProfile.villes.length === 1 && villeToUse === "all") {
          villeToUse = userProfile.villes[0].id || userProfile.villes[0].ville;
        }
        
        // Préparer les données pour l'API en utilisant l'interface Data
        const apiData = {
          ville: villeToUse,
          date: currentRow.date,
          abonnesFood: newData.abonnesFood || 0,
          abonnesShop: newData.abonnesShop || 0,
          abonnesTravel: newData.abonnesTravel || 0,
          abonnesFun: newData.abonnesFun || 0,
          abonnesBeauty: newData.abonnesBeauty || 0,
        };

        // Appeler l'API PATCH pour sauvegarder
        const response = await authFetch('/api/data/data-ville', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        if (response.ok) {
          // Vérifier si la ville modifiée correspond à la ville de la ligne dans le tableau
          const shouldUpdateTable = shouldUpdateTableRow(currentRow, villeToUse, activeTab);
          
          // Debug logs (à supprimer plus tard)
          console.log('Debug mise à jour tableau:', {
            activeTab,
            villeToUse,
            currentRowVille: currentRow.ville,
            shouldUpdateTable
          });
          
          if (shouldUpdateTable) {
            // Mettre à jour l'état local seulement si l'API a réussi et si c'est la bonne ville
            const updatedData = [...tableData];

            // Calculer le nouveau total des abonnés
            const newTotalAbonnes = (newData.abonnesFood || 0) + 
                                   (newData.abonnesShop || 0) + 
                                   (newData.abonnesTravel || 0) + 
                                   (newData.abonnesFun || 0) + 
                                   (newData.abonnesBeauty || 0);

            updatedData[editingRowIndex] = {
              ...updatedData[editingRowIndex],
              ...newData,
              totalAbonnes: newTotalAbonnes,
              ville: villeToUse
            };
            setTableData(updatedData);
          }
          
          // Afficher un toast de succès
          toast.success("Données sauvegardées avec succès !");
        } else {
          const error = await response.text();

          setSaveError(`Erreur lors de la sauvegarde: ${error}`);
        }
      } catch (error) {
        setSaveError(`Erreur lors de la sauvegarde: ${error}`);
      } finally {
        setSavingSubscribers(false);
      }
    }
    setEditModalOpen(false);
    setEditingRowIndex(null);
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setEditModalOpen(false);
    setEditingRowIndex(null);
  };

  // Obtenir les données actuelles pour le modal
  const getCurrentSubscribersData = (): Pick<Data, 'abonnesFood' | 'abonnesShop' | 'abonnesTravel' | 'abonnesFun' | 'abonnesBeauty'> => {
    if (editingRowIndex !== null && tableData[editingRowIndex]) {
      const row = tableData[editingRowIndex];

      return {
        abonnesFood: row.abonnesFood || 0,
        abonnesShop: row.abonnesShop || 0,
        abonnesTravel: row.abonnesTravel || 0,
        abonnesFun: row.abonnesFun || 0,
        abonnesBeauty: row.abonnesBeauty || 0,
      };
    }

    return {
      abonnesFood: 0,
      abonnesShop: 0,
      abonnesTravel: 0,
      abonnesFun: 0,
      abonnesBeauty: 0,
    };
  };

  // Réinitialiser l'onglet actif quand les villes changent
  useEffect(() => {
    if (userProfile?.villes && userProfile.villes.length > 0) {
      if (userProfile.villes.length === 1) {
        const onlyCitySlug = userProfile.villes[0].ville.toLowerCase().replace(/\s+/g, '-');
        setActiveTab(onlyCitySlug);
      } else {
        setActiveTab("overview");
      }
    }
  }, [userProfile?.villes]);


  // Afficher un message d'erreur de sauvegarde
  if (saveError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-primary">
            <p className="text-lg mb-2 text-red-600">Erreur de sauvegarde</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {saveError}
            </p>
            <Button
              className="mt-4"
              color="primary"
              onPress={() => setSaveError(null)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Afficher un message d'erreur si il y en a une
  if (dataError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-primary">
            <p className="text-lg mb-2 text-red-600">Erreur de chargement</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dataError}
            </p>
            <Button
              className="mt-4"
              color="primary"
              onPress={() => {
                setDataError(null);
                const loadData = async () => {
                  const data = await fetchDataFromAPI();

                  setTableData(data);
                  
                  // Afficher un toast de succès si des données ont été chargées
                  if (data.length > 0) {
                    toast.success("Données rechargées avec succès !");
                  }
                };

                loadData();
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Afficher un message si l'utilisateur n'a pas de villes assignées
  if (!userProfile?.villes || userProfile.villes.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-primary">
            <p className="text-lg mb-2">Aucune ville assignée</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contactez votre administrateur pour vous assigner des villes.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="text-primary">
        <Card className="w-full" shadow="none">
          <CardBody className="space-y-4">
            {/* Tabs */}
            <Tabs
              className="w-full pt-3"
              classNames={{
                cursor: "w-[50px]  left-[12px] h-1   rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
              }}
              selectedKey={activeTab}
              variant="underlined"
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              {userProfile.villes.length > 1 && (
                <Tab key="overview" title="Vue d'ensemble" />
              )}
              {userProfile.villes.map((city) => (
                <Tab
                  key={city.ville.toLowerCase().replace(/\s+/g, '-')}
                  title={city.ville}
                />
              ))}
            </Tabs>

            {/* Navigation d'année */}
            <div className="flex items-center justify-start gap-2 lg:gap-4 ">
              <Button
                isIconOnly
                className="text-gray-600"
                size="sm"
                variant="light"
                onPress={() => {
                  const currentYear = parseInt(selectedYear);

                  setSelectedYear((currentYear - 1).toString());
                }}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>

              {selectedYear}

              <Button
                isIconOnly
                className="text-gray-600"
                size="sm"
                variant="light"
                onPress={() => {
                  const currentYear = parseInt(selectedYear);
                  const maxYear = new Date().getFullYear();

                  if (currentYear < maxYear) {
                    setSelectedYear((currentYear + 1).toString());
                  }
                }}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Data Table */}
            <Card shadow="none">
              <CardBody className="p-0">
                {
                  isLoading || dataLoading ?
                    <div className="flex justify-center items-center h-64">
                      <Spinner className="text-black dark:text-white" size="lg" />
                    </div>
                    :
                    <Table aria-label="Data table">
                      <TableHeader>
                        <TableColumn className="font-light text-sm w-20">
                          Actions
                        </TableColumn>
                        <TableColumn className="font-light text-sm">Mois</TableColumn>
                        <TableColumn className="font-light text-sm">Total abonnés</TableColumn>
                        <TableColumn className="font-light text-sm">Total vues</TableColumn>
                        <TableColumn className="font-light text-sm">Prospects signés</TableColumn>
                        <TableColumn className="font-light text-sm">Prospects vus</TableColumn>
                        <TableColumn className="font-light text-sm">Taux de conversion</TableColumn>
                        <TableColumn className="font-light text-sm">Posts publiés</TableColumn>
                        <TableColumn className="font-light text-sm">Abonnés FOOD</TableColumn>
                        <TableColumn className="font-light text-sm">Abonnés SHOP</TableColumn>
                        <TableColumn className="font-light text-sm">Abonnés TRAVEL</TableColumn>
                        <TableColumn className="font-light text-sm">Abonnés FUN</TableColumn>
                        <TableColumn className="font-light text-sm">Abonnés BEAUTY</TableColumn>
                        <TableColumn className="font-light text-sm">Montant des cadeaux</TableColumn>
                      </TableHeader>
                      <TableBody className="mt-30">
                        {sortedData.map((row, index) => (
                          <TableRow key={index} className="border-t border-gray-100  dark:border-gray-700 ">
                            <TableCell className="py-5">
                              <Button
                                className="min-w-0 px-2 h-8"
                                color="primary"
                                size="sm"
                                variant="light"
                                onPress={() => handleEditSubscribers(index)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell className="font-light text-sm py-5">
                              {formatMonthFromDate(row.date)}
                            </TableCell>
                            <TableCell className="font-light text-sm">{row.totalAbonnes}</TableCell>
                            <TableCell className="font-light text-sm">{row.totalVues}</TableCell>
                            <TableCell className="font-light text-sm">{row.totalProspectsSignes}</TableCell>
                            <TableCell className="font-light text-sm">{row.totalProspectsVus}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-custom-green-stats/14 text-custom-green-stats dark:text-custom-green-stats">
                                {row.tauxConversion ? `${row.tauxConversion}%` : "0%"}
                              </span>
                            </TableCell>
                            <TableCell className="font-light text-sm">{row.postsPublies || 0}</TableCell>
                            <TableCell className="font-light text-sm">{row.abonnesFood || 0}</TableCell>
                            <TableCell className="font-light text-sm">{row.abonnesShop || 0}</TableCell>
                            <TableCell className="font-light text-sm">{row.abonnesTravel || 0}</TableCell>
                            <TableCell className="font-light text-sm">{row.abonnesFun || 0}</TableCell>
                            <TableCell className="font-light text-sm">{row.abonnesBeauty || 0}</TableCell>
                            <TableCell className="font-light text-sm">{row.cumulMontantCadeau || 0}€</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>}
              </CardBody>
            </Card>
          </CardBody>
        </Card>

        {/* Modal d'édition des abonnés */}
        <SubscribersEditModal
          date={editingRowIndex !== null && tableData[editingRowIndex] ? tableData[editingRowIndex].date : ""}
          initialData={getCurrentSubscribersData()}
          isOpen={editModalOpen}
          month={editingRowIndex !== null && tableData[editingRowIndex] ? formatMonthFromDate(tableData[editingRowIndex].date) : ""}
          saving={savingSubscribers}
          onClose={handleCloseModal}
          onSave={handleSaveSubscribers}
        />
      </div>
    </DashboardLayout>
  );
}
