"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
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

import { DashboardLayout } from "../dashboard-layout";
import { useUser } from "@/contexts/user-context";

import { StyledSelect } from "@/components/styled-select";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { useSortableTable } from "@/hooks/use-sortable-table";

export default function DataPage() {
  const { userProfile, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState("overview");

  // Générer des données de test basées sur les vraies villes de l'utilisateur
  const generateTableData = () => {
    if (!userProfile?.villes || userProfile.villes.length === 0) {
      return [];
    }

    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin"];
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

  const allTableData = generateTableData();

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

  // Réinitialiser l'onglet actif quand les villes changent
  useEffect(() => {
    if (userProfile?.villes && userProfile.villes.length > 0) {
      setActiveTab("overview");
    }
  }, [userProfile?.villes]);

  // Afficher un message de chargement
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary">Chargement des données...</div>
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
          <CardBody className="space-y-6">
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

            {/* Data Table */}
            <Card className=" dark:bg-gray-900" shadow="none">
              <CardBody className="p-0">
                <Table aria-label="Data table">
                  <TableHeader>
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
                  <TableBody  className="mt-30">
                    {sortedData.map((row, index) => (
                      <TableRow key={index} className="border-t border-gray-100  dark:border-gray-700 ">
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
      </div>
    </DashboardLayout>
  );
}
