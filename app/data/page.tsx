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

  const tableData = [
    {
      month: "Janvier",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
    },
    {
      month: "Février",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
    },
    {
      month: "Mars",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
    },
    {
      month: "Avril",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
    },
    {
      month: "Mai",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
    },
    {
      month: "Juin",
      revenue: "12.600€",
      conversionRate: "92%",
      signedClients: "12",
      prospectsMet: "2",
      newProspects: "32",
      publishedPosts: "6",
    },
  ];

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
                >
                  <SelectItem key="all">Toutes les catégories</SelectItem>
                  <SelectItem key="category1">Catégorie 1</SelectItem>
                  <SelectItem key="category2">Catégorie 2</SelectItem>
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
                        type="button"
                        className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left w-full"
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
                        type="button"
                        className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left w-full"
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
