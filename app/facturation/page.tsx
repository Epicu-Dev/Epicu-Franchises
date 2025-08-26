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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import {
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";
import { StyledSelect } from "@/components/styled-select";
import { CategoryBadge, FormLabel, SortableColumnHeader } from "@/components";
import { SelectItem } from "@heroui/select";

interface Invoice {
  id: string;
  category: string;
  establishmentName: string;
  date: string;
  amount: number;
  serviceType: string;
  status: "payee" | "en_attente" | "retard";
  comment?: string;
}

interface Client {
  id: string;
  nomEtablissement: string;
  raisonSociale: string;
  ville?: string;
  categorie?: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
  numeroSiret?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function FacturationPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("payee");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortField, setSortField] = useState<string>("establishmentName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    category: "shop",
    establishmentName: "",
    date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
    amount: "",
    serviceType: "",
    status: "en_attente" as Invoice["status"],
    comment: "",
    siret: "",
  });
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        status: selectedStatus,
        search: searchTerm,
        category: selectedCategory,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      const response = await fetch(`/api/facturation?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des factures");
      }

      const data = await response.json();

      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const searchClientBySiret = async (siret: string) => {
    if (!siret || siret.length < 14) return;

    try {
      setIsSearchingClient(true);
      setError(null);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siret }),
      });

      if (!response.ok) {
        setFieldErrors(prev => ({
          ...prev,
          siret: 'Aucun client trouvé avec ce numéro SIRET'
        }));
        return;
      }

      const client: Client = await response.json();

      // Pré-remplir les champs avec les informations du client
      setNewInvoice(prev => ({
        ...prev,
        establishmentName: client.nomEtablissement,
        category: client.categorie?.toLowerCase() || "shop",
        siret: siret,
      }));

      // Effacer les erreurs de validation
      setFieldErrors(prev => ({
        ...prev,
        establishmentName: "",
        siret: "",
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSearchingClient(false);
    }
  };

  const openEditModal = (invoice: Invoice) => {
    // Pré-remplir le formulaire avec les données de la facture existante
    setNewInvoice({
      category: invoice.category,
      establishmentName: invoice.establishmentName,
      date: invoice.date,
      amount: invoice.amount.toString(),
      serviceType: invoice.serviceType,
      status: invoice.status,
      comment: invoice.comment || "",
      siret: "", // On ne peut pas récupérer le SIRET depuis la facture
    });

    setSelectedInvoice(invoice);
    setError(null);
    setFieldErrors({});
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    fetchInvoices();
  }, [
    pagination.currentPage,
    selectedStatus,
    searchTerm,
    selectedCategory,
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

  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'siret':
        if (!value || !value.trim()) {
          errors.siret = 'Le numéro SIRET est requis';
        } else if (value.length !== 14) {
          errors.siret = 'Le numéro SIRET doit contenir 14 chiffres';
        } else {
          delete errors.siret;
        }
        break;
      case 'establishmentName':
        if (!value || !value.trim()) {
          errors.establishmentName = 'Le nom de l\'établissement est requis';
        } else {
          delete errors.establishmentName;
        }
        break;
      case 'date':
        if (!value) {
          errors.date = 'La date est requise';
        } else {
          delete errors.date;
        }
        break;
      case 'amount':
        if (!value || parseFloat(value) <= 0) {
          errors.amount = 'Le montant doit être supérieur à 0';
        } else {
          delete errors.amount;
        }
        break;
      case 'serviceType':
        if (!value) {
          errors.serviceType = 'Le type de prestation est requis';
        } else {
          delete errors.serviceType;
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (invoice: any) => {
    const fields = ['siret', 'establishmentName', 'date', 'amount', 'serviceType'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, invoice[field]);

      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleAddInvoice = async () => {
    try {
      // Validation complète avant soumission
      if (!validateAllFields(newInvoice)) {
        setError("Veuillez corriger les erreurs dans le formulaire");
        return;
      }

      const response = await fetch("/api/facturation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newInvoice,
          amount: parseFloat(newInvoice.amount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout de la facture");
      }

      setNewInvoice({
        category: "shop",
        establishmentName: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        serviceType: "",
        status: "en_attente",
        comment: "",
        siret: "",
      });
      setIsAddModalOpen(false);
      setSelectedInvoice(null);
      setError(null);
      setFieldErrors({});
      fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      // Validation côté client
      if (!newInvoice.establishmentName.trim()) {
        setError("Le nom de l'établissement est requis");
        return;
      }

      if (!newInvoice.date) {
        setError("La date est requise");
        return;
      }

      if (!newInvoice.amount || parseFloat(newInvoice.amount) <= 0) {
        setError("Le montant doit être supérieur à 0");
        return;
      }

      if (!newInvoice.serviceType) {
        setError("Le type de prestation est requis");
        return;
      }

      const updatedInvoice = {
        ...selectedInvoice,
        category: newInvoice.category,
        establishmentName: newInvoice.establishmentName,
        date: newInvoice.date,
        amount: parseFloat(newInvoice.amount),
        serviceType: newInvoice.serviceType,
        comment: newInvoice.comment,
      };

      const response = await fetch(`/api/facturation/${selectedInvoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedInvoice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification de la facture");
      }

      setIsAddModalOpen(false);
      setSelectedInvoice(null);
      setNewInvoice({
        category: "shop",
        establishmentName: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        serviceType: "",
        status: "en_attente",
        comment: "",
        siret: "",
      });
      setError(null);
      setFieldErrors({});
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
      case "creation_contenu":
        return "Création de contenu";
      case "publication":
        return "Publication";
      case "studio":
        return "Studio";
      default:
        return serviceType;
    }
  };

  if (loading && invoices.length === 0) {
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
              onSelectionChange={(key) => setSelectedStatus(key as string)}
            >
              <Tab key="payee" title="Payée" />
              <Tab key="en_attente" title="En attente" />
              <Tab key="retard" title="Retard" />
            </Tabs>

            <div>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setError(null);
                  setFieldErrors({});
                  setIsAddModalOpen(true);
                }}
              >
                Ajouter une facture
              </Button>
            </div>
          </div>



          {/* Tableau des factures */}
          <Table aria-label="Tableau des factures" shadow="none">
            <TableHeader>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="category"
                  label="Catégorie"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />

              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="establishmentName"
                  label="Nom établissement"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="date"
                  label="Date"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="amount"
                  label="Montant"
                  sortField={sortField}
                  sortDirection={sortDirection}
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
                    <CategoryBadge category={invoice.category} />
                  </TableCell>
                  <TableCell className="font-light py-5">
                    {invoice.establishmentName}
                  </TableCell>
                  <TableCell className="font-light">{formatDate(invoice.date)}</TableCell>
                  <TableCell className="font-light">
                    {formatAmount(invoice.amount)}
                  </TableCell>
                  <TableCell className="font-light">{getServiceTypeLabel(invoice.serviceType)}</TableCell>
                  <TableCell className="font-light">
                    <Button
                      isIconOnly
                      className="text-gray-600 hover:text-gray-800"
                      size="sm"
                      variant="light"
                      onPress={() => openEditModal(invoice)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-light">
                    <span className="text-sm text-gray-500">
                      {invoice.comment || "commentaires"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <Pagination
              showControls
              classNames={{
                wrapper: "gap-2",
                item: "w-8 h-8 text-sm",
                cursor:
                  "bg-black text-white dark:bg-white dark:text-black font-bold",
              }}
              page={pagination.currentPage}
              total={pagination.totalPages}
              onChange={(page) =>
                setPagination((prev) => ({ ...prev, currentPage: page }))
              }
            />
          </div>

          {/* Info sur le nombre total d'éléments */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Affichage de {invoices.length} facture(s) sur{" "}
            {pagination.totalItems} au total
          </div>
        </CardBody>
      </Card>

      {/* Modal d'ajout de facture */}
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader>
            {selectedInvoice ? "Modifier la facture" : "Ajouter une nouvelle facture"}
          </ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <FormLabel htmlFor="siret" isRequired={true}>
                Client
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors.siret}
                isInvalid={!!fieldErrors.siret}
                id="siret"
                placeholder="Numéro de SIRET (14 chiffres)"
                value={newInvoice.siret}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewInvoice((prev) => ({ ...prev, siret: value }));
                  // Effacer l'erreur du SIRET quand l'utilisateur tape
                  if (fieldErrors.siret) {
                    setFieldErrors(prev => ({ ...prev, siret: "" }));
                  }
                  validateField('siret', value);
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value.length === 14) {
                    searchClientBySiret(value);
                  }
                }}
                endContent={
                  isSearchingClient ? (
                    <Spinner size="sm" />
                  ) : (
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  )
                }
              />

              <FormLabel htmlFor="category" isRequired={true}>
                Catégorie
              </FormLabel>
              <StyledSelect
                isRequired
                errorMessage={fieldErrors.category}
                isInvalid={!!fieldErrors.category}
                id="category"
                placeholder="Sélectionnez une catégorie"
                selectedKeys={newInvoice.category ? [newInvoice.category] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setNewInvoice((prev) => ({
                    ...prev,
                    category: value,
                  }));
                  validateField('category', value);
                }}
              >
                <SelectItem key="shop">Shop</SelectItem>
                <SelectItem key="restaurant">Restaurant</SelectItem>
                <SelectItem key="service">Service</SelectItem>
              </StyledSelect>

              <FormLabel htmlFor="establishmentName" isRequired={true}>
                Nom de l&apos;établissement
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors.establishmentName}
                isInvalid={!!fieldErrors.establishmentName}
                id="establishmentName"
                placeholder="Ex: L'ambiance"
                value={newInvoice.establishmentName}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewInvoice((prev) => ({ ...prev, establishmentName: value }));
                  validateField('establishmentName', value);
                }}
              />

              <FormLabel htmlFor="serviceType" isRequired={true}>
                Prestation
              </FormLabel>
              <StyledSelect
                isRequired
                errorMessage={fieldErrors.serviceType}
                isInvalid={!!fieldErrors.serviceType}
                id="serviceType"
                placeholder="Sélectionnez une prestation"
                selectedKeys={newInvoice.serviceType ? [newInvoice.serviceType] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setNewInvoice((prev) => ({
                    ...prev,
                    serviceType: value,
                  }));
                  validateField('serviceType', value);
                }}
              >
                <SelectItem key="creation_contenu">Création de contenu</SelectItem>
                <SelectItem key="publication">Publication</SelectItem>
                <SelectItem key="studio">Studio</SelectItem>
              </StyledSelect>

              <FormLabel htmlFor="amount" isRequired={true}>
                Montant
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors.amount}
                isInvalid={!!fieldErrors.amount}
                id="amount"
                placeholder="Ex: 1457.98"
                step="0.01"
                type="number"
                value={newInvoice.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewInvoice((prev) => ({ ...prev, amount: value }));
                  validateField('amount', value);
                }}
              />

              <FormLabel htmlFor="date" isRequired={true}>
                Date du paiement
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors.date}
                isInvalid={!!fieldErrors.date}
                id="date"
                type="date"
                value={newInvoice.date}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewInvoice((prev) => ({ ...prev, date: value }));
                  validateField('date', value);
                }}
              />

              <FormLabel htmlFor="comment" isRequired={false}>
                Commentaire
              </FormLabel>
              <Textarea
                id="comment"
                placeholder="Commentaires sur la facture..."
                value={newInvoice.comment}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewInvoice((prev) => ({ ...prev, comment: value }));
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-end">
            <Button className="flex-1" variant="bordered" onPress={() => {
              setIsAddModalOpen(false);
              setSelectedInvoice(null);
              setNewInvoice({
                category: "shop",
                establishmentName: "",
                date: new Date().toISOString().split('T')[0],
                amount: "",
                serviceType: "",
                status: "en_attente",
                comment: "",
                siret: "",
              });
              setFieldErrors({});
              setError(null);
            }}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              isDisabled={Object.keys(fieldErrors).length > 0 || !newInvoice.siret || !newInvoice.establishmentName || !newInvoice.date || !newInvoice.amount || !newInvoice.serviceType}
              onPress={selectedInvoice ? handleEditInvoice : handleAddInvoice}
            >
              {selectedInvoice ? "Modifier" : "Ajouter"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
