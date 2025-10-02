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
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon } from "../../components/icons";
import { Spinner } from "@heroui/spinner";

import { CategoryBadge, SortableColumnHeader, InvoiceModal } from "@/components";
import { Invoice } from "@/types/invoice";
import { useAuthFetch } from "@/hooks/use-auth-fetch";


interface PaginationInfo {
  hasMore: boolean;
  nextOffset: number | null;
  limit: number;
  offset: number;
}

export default function FacturationPage() {
  const { authFetch } = useAuthFetch();
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
  const [searchTerm, setSearchTerm] = useState("");
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
        sortField: sortField,
        sortDirection: sortDirection,
      });

      const response = await authFetch(`/api/facturation?${params}`);

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
    sortField,
    sortDirection,
  ]);



  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };



  const handleAddInvoice = async (invoiceData: any): Promise<Invoice | void> => {
    try {
      const response = await authFetch("/api/facturation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout de la facture");
      }

      const data = await response.json();
      const newInvoice: Invoice = data.invoice || {
        id: data.id || Date.now().toString(),
        categorie: data.invoice?.categorie || "shop",
        nomEtablissement: data.invoice?.nomEtablissement || invoiceData.establishmentName || "",
        datePaiement: data.invoice?.datePaiement || invoiceData.date || undefined,
        dateEmission: data.invoice?.dateEmission || invoiceData.emissionDate || new Date().toISOString().split('T')[0],
        montant: data.invoice?.montant || parseFloat(invoiceData.amount) || 0,
        typePrestation: data.invoice?.typePrestation || invoiceData.serviceType || "",
        statut: data.invoice?.statut || selectedStatus,
        commentaire: data.invoice?.commentaire || invoiceData.comment || "",
        publicationId: data.invoice?.publicationId || invoiceData.publicationId || undefined,
      };

      // Mise à jour optimiste - ajouter la nouvelle facture au début de la liste
      setInvoices(prev => [newInvoice, ...prev]);
      
      return newInvoice;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      throw err;
    }
  };

  const handleEditInvoice = async (invoiceData: any): Promise<Invoice | void> => {
    if (!selectedInvoice) return;

    try {
      const response = await authFetch(`/api/facturation?id=${selectedInvoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification de la facture");
      }

      const data = await response.json();
      const updatedInvoice: Invoice = data.invoice || {
        ...selectedInvoice,
        categorie: data.invoice?.categorie || selectedInvoice.categorie,
        nomEtablissement: data.invoice?.nomEtablissement || selectedInvoice.nomEtablissement,
        datePaiement: data.invoice?.datePaiement || selectedInvoice.datePaiement,
        dateEmission: data.invoice?.dateEmission || selectedInvoice.dateEmission,
        montant: data.invoice?.montant || selectedInvoice.montant,
        typePrestation: data.invoice?.typePrestation || selectedInvoice.typePrestation,
        statut: data.invoice?.statut || selectedStatus,
        commentaire: data.invoice?.commentaire || selectedInvoice.commentaire,
        publicationId: data.invoice?.publicationId || selectedInvoice.publicationId,
      };

      // Vérifier si le statut a changé
      const newStatus = updatedInvoice.statut?.toLowerCase() || '';
      const currentStatus = selectedStatus.toLowerCase();
      
      // Normaliser les statuts pour la comparaison
      const normalizeStatus = (status: string) => {
        const normalized = status.toLowerCase().trim();
        if (normalized.includes('payée') || normalized.includes('payee')) return 'payee';
        if (normalized.includes('attente')) return 'en_attente';
        if (normalized.includes('retard')) return 'retard';
        return normalized;
      };
      
      const normalizedNewStatus = normalizeStatus(newStatus);
      const normalizedCurrentStatus = normalizeStatus(currentStatus);
      
      // Si le statut a changé, retirer la facture du tableau actuel
      if (normalizedNewStatus !== normalizedCurrentStatus) {
        setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
      } else {
        // Sinon, mettre à jour la facture dans le tableau actuel
        setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv));
      }
      
      return updatedInvoice;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      throw err;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return "-";

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
        <CardBody className="p-2 sm:p-4">
          {/* En-tête avec onglets et barre de recherche */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-1 sm:p-2 gap-4">
            <Tabs
              className="w-full pt-3"
              classNames={{
                cursor: "w-[50px] left-[12px] h-1 rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light",
              }}
              selectedKey={selectedStatus}
              variant="underlined"
              onSelectionChange={handleTabChange}
            >
              <Tab key="payee" title="Payée" />
              <Tab key="en_attente" title="En attente" />
              <Tab key="retard" title="Retard" />
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

          {/* Bouton d'ajout */}
          <div className="flex justify-end p-1 sm:p-2 pb-4">
            <Button
              color='primary'
              endContent={<PlusIcon className="h-4 w-4" />}
              className="w-full sm:w-auto"
              onPress={() => {
                setError(null);
                setSelectedInvoice(null);
                setIsAddModalOpen(true);
              }}
            >
              Ajouter une facture
            </Button>
          </div>

          {loading ? <div className="flex justify-center items-center h-64">
            <Spinner className="text-black dark:text-white" size="lg" />
          </div> : invoices.length === 0 ?
            <div className="flex flex-col justify-center items-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-lg font-medium mb-2">Aucune facture trouvée</div>
              <div className="text-sm">Commencez par ajouter votre première facture</div>
            </div>
            :
            <div>
              {/* Tableau des factures */}
              <div className="overflow-x-auto">
                <Table aria-label="Tableau des factures" shadow="none" classNames={{
                  wrapper: "min-w-full",
                  table: "min-w-[800px]"
                }}>
                  <TableHeader>
                    <TableColumn className="font-light text-sm min-w-[120px]">
                      <SortableColumnHeader
                        field="category"
                        label="Catégorie"
                        sortDirection={sortDirection}
                        sortField={sortField}
                        onSort={handleSort}
                      />

                    </TableColumn>
                    <TableColumn className="font-light text-sm min-w-[150px]">
                      <SortableColumnHeader
                        field="establishmentName"
                        label="Nom établissement"
                        sortDirection={sortDirection}
                        sortField={sortField}
                        onSort={handleSort}
                      />
                    </TableColumn>
                    <TableColumn className="font-light text-sm min-w-[120px]">
                      <SortableColumnHeader
                        field="dateEmission"
                        label="Date d'émission"
                        sortDirection={sortDirection}
                        sortField={sortField}
                        onSort={handleSort}
                      />
                    </TableColumn>
                    <TableColumn className="font-light text-sm min-w-[120px]">
                      <SortableColumnHeader
                        field="amount"
                        label="Montant de la facture"
                        sortDirection={sortDirection}
                        sortField={sortField}
                        onSort={handleSort}
                      />
                    </TableColumn>
                    <TableColumn className="font-light text-sm min-w-[120px]">
                      Type de prestation
                    </TableColumn>
                    <TableColumn className="font-light text-sm min-w-[80px]">Modifier</TableColumn>
                    <TableColumn className="font-light text-sm min-w-[150px]">Commentaire</TableColumn>
                  </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-t border-gray-100  dark:border-gray-700">
                      <TableCell>
                        <CategoryBadge category={invoice.categorie} />
                      </TableCell>
                      <TableCell className="font-light py-5 text-xs sm:text-sm">
                        {invoice.nomEtablissement}
                      </TableCell>
                      <TableCell className="font-light text-xs sm:text-sm">{formatDate(invoice.dateEmission)}</TableCell>
                      <TableCell className="font-light text-xs sm:text-sm">
                        {formatAmount(invoice.montant)}
                      </TableCell>
                      <TableCell className="font-light text-xs sm:text-sm">{getServiceTypeLabel(invoice.typePrestation)}</TableCell>
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
                      <TableCell className="font-light text-xs sm:text-sm">
                        <span className="text-xs sm:text-sm text-gray-500">
                          {invoice.commentaire || ""}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>

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
