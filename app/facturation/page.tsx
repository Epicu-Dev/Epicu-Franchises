"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Tabs, Tab } from "@heroui/tabs";
import {
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { CategoryBadge, SortableColumnHeader, InvoiceModal } from "@/components";
import { Invoice } from "@/types/invoice";
import { getValidAccessToken } from "@/utils/auth";


interface PaginationInfo {
  hasMore: boolean;
  nextOffset: number | null;
  limit: number;
  offset: number;
}

export default function FacturationPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    hasMore: true,
    nextOffset: 0,
    limit: 20,
    offset: 0,
  });

  // Variables pour le LazyLoading
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("payee");
  const [searchTerm] = useState("");
  const [selectedCategory] = useState("");
  const [sortField, setSortField] = useState<string>("establishmentName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const offset = isLoadMore ? (nextOffset || 0) : 0;

      const params = new URLSearchParams({
        limit: '20',
        status: selectedStatus,
        q: searchTerm,
        offset: offset.toString(),
      });

      const response = await fetch(`/api/facturation?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des factures");
      }

      const data = await response.json();

      if (isLoadMore) {
        setInvoices(prev => [...prev, ...(data.invoices || [])]);
      } else {
        setInvoices(data.invoices || []);
      }

      // Mettre à jour la pagination pour le LazyLoading
      setHasMore(data.pagination?.hasMore || false);
      setNextOffset(data.pagination?.nextOffset || null);
      setPagination(data.pagination);
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
      fetchInvoices(true);
    }
  };



  const openEditModal = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsAddModalOpen(true);
  };

  // Réinitialiser la pagination quand on change d'onglet
  const handleTabChange = (key: React.Key) => {
    setSelectedStatus(key.toString());
    setInvoices([]);
    setNextOffset(0);
    setHasMore(true);
  };

  useEffect(() => {
    fetchInvoices();
  }, [
    selectedStatus,
    searchTerm,
  ]);



  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };



  const handleAddInvoice = async (invoiceData: any) => {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error('No access token');
      }

      const response = await fetch("/api/facturation", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout de la facture");
      }

      fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleEditInvoice = async (invoiceData: any) => {
    if (!selectedInvoice) return;

    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error('No access token');
      }

      const updatedInvoice = {
        ...selectedInvoice,
        category: invoiceData.category,
        establishmentName: invoiceData.establishmentName,
        date: invoiceData.date,
        amount: invoiceData.amount,
        serviceType: invoiceData.serviceType,
        comment: invoiceData.comment,
      };

      const response = await fetch(`/api/facturation?id=${selectedInvoice.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification de la facture");
      }

      fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case "publication":
        return "Publication";
      case "tournage":
        return "Tournage";
      default:
        return serviceType;
    }
  };

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
    <div className="w-full text-primary">
      <Card className="w-full" shadow="none">
        <CardBody>
          {/* En-tête avec onglets et bouton d'ajout */}
          <div className="flex justify-between items-center p-2">
            <Tabs
              className="w-full pt-3"
              classNames={{
                cursor: "w-[50px]  left-[12px] h-1 rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
              }}
              selectedKey={selectedStatus}
              variant="underlined"
              onSelectionChange={handleTabChange}
            >
              <Tab key="payee" title="Payée" />
              <Tab key="en_attente" title="En attente" />
              <Tab key="retard" title="Retard" />
            </Tabs>

            <div>
              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setError(null);
                  setSelectedInvoice(null);
                  setIsAddModalOpen(true);
                }}
              >
                Ajouter une facture
              </Button>
            </div>
          </div>

          {loading ? <div className="flex justify-center items-center h-64">
            <Spinner className="text-black dark:text-white" size="lg" />
          </div> :
            <div>
              {/* Tableau des factures */}
              <Table aria-label="Tableau des factures" shadow="none">
                <TableHeader>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="category"
                      label="Catégorie"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />

                  </TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="establishmentName"
                      label="Nom établissement"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="date"
                      label="Date"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="amount"
                      label="Montant de la facture"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">
                    Type de prestation
                  </TableColumn>
                  <TableColumn className="font-light text-sm">Modifier</TableColumn>
                  <TableColumn className="font-light text-sm">Commentaire</TableColumn>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-t border-gray-100  dark:border-gray-700">
                      <TableCell>
                        <CategoryBadge category={invoice.categorie} />
                      </TableCell>
                      <TableCell className="font-light py-5">
                        {invoice.nomEtablissement}
                      </TableCell>
                      <TableCell className="font-light">{formatDate(invoice.date)}</TableCell>
                      <TableCell className="font-light">
                        {formatAmount(invoice.montant)}
                      </TableCell>
                      <TableCell className="font-light">{getServiceTypeLabel(invoice.typePrestation)}</TableCell>
                      <TableCell className="font-light">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(invoice)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-light">
                        <span className="text-sm text-gray-500">
                          {invoice.commentaire || "commentaires"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Bouton "Charger plus" */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    color="primary"
                    disabled={loadingMore}
                    isLoading={loadingMore}
                    onPress={loadMore}
                  >
                    {loadingMore ? 'Chargement...' : 'Charger plus'}
                  </Button>
                </div>
              )}
            </div>}
        </CardBody>
      </Card>

      {/* Modal d'ajout de facture */}
      <InvoiceModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        selectedInvoice={selectedInvoice}
        onSave={handleAddInvoice}
        onEdit={handleEditInvoice}
      />
    </div>
  );
}
