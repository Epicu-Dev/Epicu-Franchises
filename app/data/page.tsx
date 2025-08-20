"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import { DashboardLayout } from "../dashboard-layout";

export default function DataPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCategory, setSelectedCategory] = useState("");

  const allTableData = [
    {
      month: "Janvier",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
      city: "nantes",
      categories: ["FOOD", "SHOP"],
    },
    {
      month: "Février",
      revenue: "15.200€",
      conversionRate: "85%",
      signedClients: "8",
      prospectsMet: "3",
      newProspects: "28",
      publishedPosts: "8",
      city: "saint-brieuc",
      categories: ["TRAVEL", "FUN"],
    },
    {
      month: "Mars",
      revenue: "18.400€",
      conversionRate: "95%",
      signedClients: "15",
      prospectsMet: "1",
      newProspects: "35",
      publishedPosts: "7",
      city: "nantes",
      categories: ["BEAUTY", "FOOD"],
    },
    {
      month: "Avril",
      revenue: "14.800€",
      conversionRate: "88%",
      signedClients: "10",
      prospectsMet: "4",
      newProspects: "30",
      publishedPosts: "5",
      city: "saint-brieuc",
      categories: ["SHOP", "TRAVEL"],
    },
    {
      month: "Mai",
      revenue: "16.900€",
      conversionRate: "91%",
      signedClients: "13",
      prospectsMet: "2",
      newProspects: "38",
      publishedPosts: "9",
      city: "nantes",
      categories: ["FUN", "BEAUTY"],
    },
    {
      month: "Juin",
      revenue: "13.300€",
      conversionRate: "89%",
      signedClients: "11",
      prospectsMet: "3",
      newProspects: "29",
      publishedPosts: "6",
      city: "saint-brieuc",
      categories: ["FOOD", "SHOP"],
    },
  ];

  // Filtrer les données selon l'onglet actif et la catégorie sélectionnée
  const tableData = allTableData.filter((row) => {
    // Filtre par ville (onglet)
    if (activeTab !== "overview" && row.city !== activeTab) {
      return false;
    }
    
    // Filtre par catégorie
    if (selectedCategory && selectedCategory !== "all" && !row.categories.includes(selectedCategory)) {
      return false;
    }
    
    return true;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <ChevronUpIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      );
    }

    return sortDirection === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    );
  };

  return (
    <DashboardLayout>
      <div className="">
        <Card className="w-full">
          <CardBody className="p-6 space-y-6">
            {/* Tabs */}
            <Tabs
              className="w-full"
              classNames={{
                cursor: "w-[50px] left-[12px] h-1",
              }}
              selectedKey={activeTab}
              variant="underlined"
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              <Tab key="overview" title="Vue d'ensemble" />
              <Tab key="nantes" title="Nantes" />
              <Tab key="saint-brieuc" title="Saint-Brieuc" />
            </Tabs>

            {/* Filter */}
            <div className="flex justify-between items-center">
              <div className="w-48">
                <Select
                  className="w-full"
                  label="Catégorie"
                  placeholder="Sélectionner une catégorie"
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onSelectionChange={(keys) =>
                    setSelectedCategory(Array.from(keys)[0] as string)
                  }
                >
                  <SelectItem key="all">Toutes les catégories</SelectItem>
                  <SelectItem key="FOOD">Food</SelectItem>
                  <SelectItem key="SHOP">Shop</SelectItem>
                  <SelectItem key="TRAVEL">Travel</SelectItem>
                  <SelectItem key="FUN">Fun</SelectItem>
                  <SelectItem key="BEAUTY">Beauty</SelectItem>
                </Select>
              </div>
            </div>

            {/* Data Table */}
            <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardBody className="p-0">
                <Table aria-label="Data table">
                  <TableHeader>
                    <TableColumn>
                      <button
                        className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left w-full"
                        type="button"
                        onClick={() => handleSort("month")}
                      >
                        Mois
                        {getSortIcon("month")}
                      </button>
                    </TableColumn>
                    <TableColumn>Chiffre d&apos;affaires</TableColumn>
                    <TableColumn>Taux de conversion</TableColumn>
                    <TableColumn>Clients signés</TableColumn>
                    <TableColumn>Prospects rencontrés</TableColumn>
                    <TableColumn>Nouveaux prospects</TableColumn>
                    <TableColumn>
                      <button
                        className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left w-full"
                        type="button"
                        onClick={() => handleSort("publishedPosts")}
                      >
                        Posts publiés
                        {getSortIcon("publishedPosts")}
                      </button>
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.month}
                        </TableCell>
                        <TableCell>{row.revenue}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            {row.conversionRate}
                          </span>
                        </TableCell>
                        <TableCell>{row.signedClients}</TableCell>
                        <TableCell>{row.prospectsMet}</TableCell>
                        <TableCell>{row.newProspects}</TableCell>
                        <TableCell>{row.publishedPosts}</TableCell>
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
