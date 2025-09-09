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
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from "@heroicons/react/24/outline";

import { DashboardLayout } from "../dashboard-layout";
import { useUser } from "@/contexts/user-context";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { SubscribersEditModal } from "@/components";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { getValidAccessToken } from "@/utils/auth";



interface SubscribersData {
  foodSubscribers: string;
  shopSubscribers: string;
  travelSubscribers: string;
  funSubscribers: string;
  beautySubscribers: string;
}

interface ApiDataResponse {
  date: string;
  ville: string;
  totalAbonnes: number;
  totalVues: number;
  totalProspectsSignes: number;
  totalProspectsVus: number;
  tauxConversion: number | null;
  rawCount: number;
}

interface TableDataRow {
  month: string;
  revenue: string;
  conversionRate: string;
  signedClients: string;
  prospectsMet: string;
  newProspects: string;
  publishedPosts: string;
  foodSubscribers: string;
  shopSubscribers: string;
  travelSubscribers: string;
  funSubscribers: string;
  beautySubscribers: string;
  giftsAmount: string;
  city: string;
  cityName: string;
  categories: string[];
}

export default function DataPage() {
  const { userProfile, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [tableData, setTableData] = useState<TableDataRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fonction pour les appels API authentifiés
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getValidAccessToken();

    if (!token) throw new Error('No access token');

    const headers = new Headers((init?.headers as HeadersInit) || {});

    headers.set('Authorization', `Bearer ${token}`);
    const merged: RequestInit = { ...init, headers };

    return fetch(input, merged);
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

      const dataPromises = months.map(async (month, index) => {
        const monthNumber = allMonths.indexOf(month) + 1;
        const date = `${monthNumber.toString().padStart(2, '0')}-${currentYear}`;
        
        // Alterner entre les villes de l'utilisateur
        const cityIndex = index % userProfile.villes.length;
        const city = userProfile.villes[cityIndex];
        const villeParam = city.id || city.ville.toLowerCase().replace(/\s+/g, '-');

        try {
          const response = await authFetch(`/api/data/data?ville=${encodeURIComponent(villeParam)}&date=${encodeURIComponent(date)}`);
          const apiData: ApiDataResponse = await response.json();

          if (!response.ok) {
            // Retourner des données par défaut en cas d'erreur
            return {
              month,
              revenue: "0€",
              conversionRate: "0%",
              signedClients: "0",
              prospectsMet: "0",
              newProspects: "0",
              publishedPosts: "0",
              foodSubscribers: "0",
              shopSubscribers: "0",
              travelSubscribers: "0",
              funSubscribers: "0",
              beautySubscribers: "0",
              giftsAmount: "0€",
              city: city.ville.toLowerCase().replace(/\s+/g, '-'),
              cityName: city.ville,
              categories: ["FOOD", "SHOP"],
            };
          }

          // Convertir les données API en format tableau
          return {
            month,
            revenue: `${Math.floor(apiData.totalVues * 0.1)}€`, // Estimation basée sur les vues
            conversionRate: apiData.tauxConversion ? `${apiData.tauxConversion}%` : "0%",
            signedClients: apiData.totalProspectsSignes.toString(),
            prospectsMet: apiData.totalProspectsVus.toString(),
            newProspects: Math.floor(apiData.totalVues * 0.05).toString(), // Estimation
            publishedPosts: Math.floor(apiData.totalVues * 0.02).toString(), // Estimation
            foodSubscribers: Math.floor(apiData.totalAbonnes * 0.1).toString(), // Estimation
            shopSubscribers: Math.floor(apiData.totalAbonnes * 0.4).toString(), // Estimation
            travelSubscribers: Math.floor(apiData.totalAbonnes * 0.2).toString(), // Estimation
            funSubscribers: Math.floor(apiData.totalAbonnes * 0.1).toString(), // Estimation
            beautySubscribers: Math.floor(apiData.totalAbonnes * 0.2).toString(), // Estimation
            giftsAmount: `${Math.floor(apiData.totalProspectsSignes * 50)}€`, // Estimation
            city: city.ville.toLowerCase().replace(/\s+/g, '-'),
            cityName: city.ville,
            categories: ["FOOD", "SHOP"],
          };
        } catch {
          // Retourner des données par défaut en cas d'erreur
          return {
            month,
            revenue: "0€",
            conversionRate: "0%",
            signedClients: "0",
            prospectsMet: "0",
            newProspects: "0",
            publishedPosts: "0",
            foodSubscribers: "0",
            shopSubscribers: "0",
            travelSubscribers: "0",
            funSubscribers: "0",
            beautySubscribers: "0",
            giftsAmount: "0€",
            city: city.ville.toLowerCase().replace(/\s+/g, '-'),
            cityName: city.ville,
            categories: ["FOOD", "SHOP"],
          };
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

  // Générer des données de test basées sur les vraies villes de l'utilisateur (fallback)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateTableData = () => {
    if (!userProfile?.villes || userProfile.villes.length === 0) {
      return [];
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based (0 = Janvier)
    const year = parseInt(selectedYear);

    const allMonths = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    // Si c'est l'année actuelle, ne montrer que les mois passés et actuel
    let months = allMonths;

    if (year === currentYear) {
      months = allMonths.slice(0, currentMonth + 1);
    }

    // Trier par ordre décroissant (plus récent en premier)
    months = [...months].reverse();

    const categories = ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"];

    return months.map((month, index) => {
      // Alterner entre les villes de l'utilisateur
      const cityIndex = index % userProfile.villes.length;
      const city = userProfile.villes[cityIndex];

      // Générer des données réalistes
      const revenue = Math.floor(Math.random() * 8000 + 10000) + "€";
      const conversionRate = Math.floor(Math.random() * 15 + 80) + "%";
      const signedClients = Math.floor(Math.random() * 8 + 8).toString();
      const prospectsMet = Math.floor(Math.random() * 4 + 1).toString();
      const newProspects = Math.floor(Math.random() * 10 + 25).toString();
      const publishedPosts = Math.floor(Math.random() * 4 + 5).toString();

      // Générer le nombre d'abonnés par catégorie
      const foodSubscribers = Math.floor(Math.random() * 2000 + 1000).toString();
      const shopSubscribers = Math.floor(Math.random() * 20000 + 10000).toString();
      const travelSubscribers = Math.floor(Math.random() * 3000 + 2000).toString();
      const funSubscribers = Math.floor(Math.random() * 500 + 100).toString();
      const beautySubscribers = Math.floor(Math.random() * 1500 + 1000).toString();

      // Générer le montant des cadeaux offerts
      const giftsAmount = Math.floor(Math.random() * 3000 + 1000) + "€";

      // Sélectionner 2 catégories aléatoires
      const selectedCategories = categories
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      return {
        month,
        revenue,
        conversionRate,
        signedClients,
        prospectsMet,
        newProspects,
        publishedPosts,
        foodSubscribers,
        shopSubscribers,
        travelSubscribers,
        funSubscribers,
        beautySubscribers,
        giftsAmount,
        city: city.ville.toLowerCase().replace(/\s+/g, '-'),
        cityName: city.ville,
        categories: selectedCategories,
      };
    });
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
  }, [userProfile?.villes, selectedYear]);

  const allTableData = tableData;

  // Filtrer les données selon l'onglet actif et la catégorie sélectionnée
  const filteredData = allTableData.filter((row) => {
    // Filtre par ville (onglet)
    if (activeTab !== "overview" && row.city !== activeTab) {
      return false;
    }

    return true;
  });

  // Utiliser le hook de tri réutilisable
  const { sortField, sortDirection, handleSort, sortedData } = useSortableTable(filteredData);

  // Fonction pour ouvrir le modal d'édition
  const handleEditSubscribers = (rowIndex: number) => {
    const actualIndex = allTableData.findIndex(row =>
      sortedData.findIndex(sortedRow => sortedRow === row) === rowIndex
    );

    setEditingRowIndex(actualIndex);
    setEditModalOpen(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveSubscribers = (newData: SubscribersData) => {
    if (editingRowIndex !== null) {
      const updatedData = [...tableData];

      updatedData[editingRowIndex] = {
        ...updatedData[editingRowIndex],
        ...newData
      };
      setTableData(updatedData);
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
  const getCurrentSubscribersData = (): SubscribersData => {
    if (editingRowIndex !== null && tableData[editingRowIndex]) {
      const row = tableData[editingRowIndex];

      return {
        foodSubscribers: row.foodSubscribers,
        shopSubscribers: row.shopSubscribers,
        travelSubscribers: row.travelSubscribers,
        funSubscribers: row.funSubscribers,
        beautySubscribers: row.beautySubscribers,
      };
    }

    return {
      foodSubscribers: "",
      shopSubscribers: "",
      travelSubscribers: "",
      funSubscribers: "",
      beautySubscribers: "",
    };
  };

  // Réinitialiser l'onglet actif quand les villes changent
  useEffect(() => {
    if (userProfile?.villes && userProfile.villes.length > 0) {
      setActiveTab("overview");
    }
  }, [userProfile?.villes]);

  // Afficher un message de chargement
  if (isLoading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary">Chargement des données...</div>
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
              <Tab key="overview" title="Vue d'ensemble" />
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
            <Card  shadow="none">
              <CardBody className="p-0">
                <Table aria-label="Data table">
                  <TableHeader>
                    <TableColumn className="font-light text-sm w-20">
                      Actions
                    </TableColumn>
                    <TableColumn className="font-light text-sm">
                      <SortableColumnHeader
                        field="month"
                        label="Mois"
                        sortDirection={sortDirection}
                        sortField={sortField}
                        onSort={handleSort}
                      />
                    </TableColumn>
                    <TableColumn className="font-light text-sm">Chiffre d&apos;affaires</TableColumn>
                    <TableColumn className="font-light text-sm">Taux de conversion</TableColumn>
                    <TableColumn className="font-light text-sm">Clients signés</TableColumn>
                    <TableColumn className="font-light text-sm">Prospects rencontrés</TableColumn>
                    <TableColumn className="font-light text-sm">Nouveaux prospects</TableColumn>
                    <TableColumn className="font-light text-sm">
                      <SortableColumnHeader
                        field="publishedPosts"
                        label="Posts publiés"
                        sortDirection={sortDirection}
                        sortField={sortField}
                        onSort={handleSort}
                      />
                    </TableColumn>
                    <TableColumn className="font-light text-sm">Nombre abonnés food</TableColumn>
                    <TableColumn className="font-light text-sm">Nombre abonnés shop</TableColumn>
                    <TableColumn className="font-light text-sm">Nombre abonnés travel</TableColumn>
                    <TableColumn className="font-light text-sm">Nombre abonnés fun</TableColumn>
                    <TableColumn className="font-light text-sm">Nombre abonnés beauty</TableColumn>
                    <TableColumn className="font-light text-sm">Montant des cadeaux offerts</TableColumn>
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
                          {row.month}
                        </TableCell>
                        <TableCell className="font-light text-sm">{row.revenue}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-custom-green-stats/14 text-custom-green-stats dark:text-custom-green-stats">
                            {row.conversionRate}
                          </span>
                        </TableCell>
                        <TableCell className="font-light text-sm">{row.signedClients}</TableCell>
                        <TableCell className="font-light text-sm">{row.prospectsMet}</TableCell>
                        <TableCell className="font-light text-sm">{row.newProspects}</TableCell>
                        <TableCell className="font-light text-sm">{row.publishedPosts}</TableCell>
                        <TableCell className="font-light text-sm">{row.foodSubscribers}</TableCell>
                        <TableCell className="font-light text-sm">{row.shopSubscribers}</TableCell>
                        <TableCell className="font-light text-sm">{row.travelSubscribers}</TableCell>
                        <TableCell className="font-light text-sm">{row.funSubscribers}</TableCell>
                        <TableCell className="font-light text-sm">{row.beautySubscribers}</TableCell>
                        <TableCell className="font-light text-sm">{row.giftsAmount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </CardBody>
        </Card>

        {/* Modal d'édition des abonnés */}
        <SubscribersEditModal
          initialData={getCurrentSubscribersData()}
          isOpen={editModalOpen}
          month={editingRowIndex !== null && tableData[editingRowIndex] ? tableData[editingRowIndex].month : ""}
          onClose={handleCloseModal}
          onSave={handleSaveSubscribers}
        />
      </div>
    </DashboardLayout>
  );
}
