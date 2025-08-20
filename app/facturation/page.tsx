"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
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
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import {
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    category: "shop",
    establishmentName: "",
    date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
    amount: "",
    serviceType: "",
    status: "en_attente" as Invoice["status"],
    comment: "",
  });

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
    const fields = ['establishmentName', 'date', 'amount', 'serviceType'];
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
        date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
        amount: "",
        serviceType: "",
        status: "en_attente",
        comment: "",
      });
      setIsAddModalOpen(false);
      setError(null); // Réinitialiser l'erreur
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
      if (!selectedInvoice.establishmentName.trim()) {
        setError("Le nom de l'établissement est requis");

        return;
      }

      if (!selectedInvoice.date) {
        setError("La date est requise");

        return;
      }

      if (!selectedInvoice.amount || selectedInvoice.amount <= 0) {
        setError("Le montant doit être supérieur à 0");

        return;
      }

      if (!selectedInvoice.serviceType) {
        setError("Le type de prestation est requis");

        return;
      }

      const response = await fetch(`/api/facturation/${selectedInvoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedInvoice),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de la modification de la facture");
      }

      setIsEditModalOpen(false);
      setSelectedInvoice(null);
      setError(null);
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
        <Card className="w-full">
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
        <Card className="w-full">
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
      <Card className="w-full">
        <CardBody className="p-6">
          {/* En-tête avec onglets et bouton d'ajout */}
          <div className="flex justify-between items-center mb-6">
            <Tabs
              className="w-full"
              classNames={{
                cursor: "w-[50px] left-[12px] h-1",
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

          {/* Filtres */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select
                className="w-48"
                placeholder="Catégorie"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tous">Toutes</SelectItem>
                <SelectItem key="shop">Shop</SelectItem>
                <SelectItem key="restaurant">Restaurant</SelectItem>
                <SelectItem key="service">Service</SelectItem>
              </Select>
            </div>

            <div className="relative">
              <Input
                className="w-64 pr-4 pl-10"
                classNames={{
                  input:
                    "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                  inputWrapper:
                    "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white dark:bg-gray-800",
                }}
                placeholder="Rechercher..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Tableau des factures */}
          <Table aria-label="Tableau des factures">
            <TableHeader>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("category")}
                >
                  Catégorie
                  {sortField === "category" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUpIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("establishmentName")}
                >
                  Nom établissement
                  {sortField === "establishmentName" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUpIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("date")}
                >
                  Date
                  {sortField === "date" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUpIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("amount")}
                >
                  Montant
                  {sortField === "amount" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUpIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("serviceType")}
                >
                  Type de prestation
                  {sortField === "serviceType" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUpIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Modifier</TableColumn>
              <TableColumn>Commentaire</TableColumn>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Chip color="secondary" size="sm" variant="flat">
                      {invoice.category}
                    </Chip>
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.establishmentName}
                  </TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell className="font-medium">
                    {formatAmount(invoice.amount)}
                  </TableCell>
                  <TableCell>{getServiceTypeLabel(invoice.serviceType)}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      className="text-gray-600 hover:text-gray-800"
                      size="sm"
                      variant="light"
                      onPress={() => {
                        setError(null);
                        setSelectedInvoice(invoice);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
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
          <ModalHeader>Ajouter une nouvelle facture</ModalHeader>
          <ModalBody>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <Select
                label="Catégorie"
                selectedKeys={newInvoice.category ? [newInvoice.category] : []}
                onSelectionChange={(keys) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    category: Array.from(keys)[0] as string,
                  }))
                }
              >
                <SelectItem key="shop">Shop</SelectItem>
                <SelectItem key="restaurant">Restaurant</SelectItem>
                <SelectItem key="service">Service</SelectItem>
              </Select>

              <Input
                isRequired
                errorMessage={fieldErrors.establishmentName}
                isInvalid={!!fieldErrors.establishmentName}
                label="Nom de l'établissement"
                placeholder="Ex: L'ambiance"
                value={newInvoice.establishmentName}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewInvoice((prev) => ({
                    ...prev,
                    establishmentName: value,
                  }));
                  validateField('establishmentName', value);
                }}
              />

              <Input
                isRequired
                errorMessage={fieldErrors.date}
                isInvalid={!!fieldErrors.date}
                label="Date"
                type="date"
                value={newInvoice.date}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewInvoice((prev) => ({ ...prev, date: value }));
                  validateField('date', value);
                }}
              />

              <Input
                isRequired
                errorMessage={fieldErrors.amount}
                isInvalid={!!fieldErrors.amount}
                label="Montant (€)"
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

              <Select
                isRequired
                errorMessage={fieldErrors.serviceType}
                isInvalid={!!fieldErrors.serviceType}
                label="Type de prestation"
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
              </Select>

              <Select
                label="Statut"
                selectedKeys={[newInvoice.status]}
                onSelectionChange={(keys) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    status: Array.from(keys)[0] as Invoice["status"],
                  }))
                }
              >
                <SelectItem key="payee">Payée</SelectItem>
                <SelectItem key="en_attente">En attente</SelectItem>
                <SelectItem key="retard">Retard</SelectItem>
              </Select>

              <Textarea
                label="Commentaire"
                placeholder="Commentaires sur la facture..."
                value={newInvoice.comment}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              isDisabled={Object.keys(fieldErrors).length > 0 || !newInvoice.establishmentName || !newInvoice.date || !newInvoice.amount || !newInvoice.serviceType}
              onPress={handleAddInvoice}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition de facture */}
      <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <ModalContent>
          <ModalHeader>Modifier la facture</ModalHeader>
          <ModalBody>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            {selectedInvoice && (
              <div className="space-y-4">
                <Select
                  label="Catégorie"
                  selectedKeys={[selectedInvoice.category]}
                  onSelectionChange={(keys) =>
                    setSelectedInvoice((prev) =>
                      prev
                        ? { ...prev, category: Array.from(keys)[0] as string }
                        : null
                    )
                  }
                >
                  <SelectItem key="shop">Shop</SelectItem>
                  <SelectItem key="restaurant">Restaurant</SelectItem>
                  <SelectItem key="service">Service</SelectItem>
                </Select>

                <Input
                  isRequired
                  label="Nom de l'établissement"
                  placeholder="Ex: L'ambiance"
                  value={selectedInvoice.establishmentName}
                  onChange={(e) =>
                    setSelectedInvoice((prev) =>
                      prev
                        ? { ...prev, establishmentName: e.target.value }
                        : null
                    )
                  }
                />

                <Input
                  isRequired
                  label="Date"
                  type="date"
                  value={selectedInvoice.date}
                  onChange={(e) =>
                    setSelectedInvoice((prev) =>
                      prev ? { ...prev, date: e.target.value } : null
                    )
                  }
                />

                <Input
                  isRequired
                  label="Montant (€)"
                  placeholder="Ex: 1457.98"
                  step="0.01"
                  type="number"
                  value={selectedInvoice.amount.toString()}
                  onChange={(e) =>
                    setSelectedInvoice((prev) =>
                      prev
                        ? { ...prev, amount: parseFloat(e.target.value) || 0 }
                        : null
                    )
                  }
                />

                <Select
                  isRequired
                  label="Type de prestation"
                  placeholder="Sélectionnez une prestation"
                  selectedKeys={selectedInvoice.serviceType ? [selectedInvoice.serviceType] : []}
                  onSelectionChange={(keys) =>
                    setSelectedInvoice((prev) =>
                      prev ? { ...prev, serviceType: Array.from(keys)[0] as string } : null
                    )
                  }
                >
                  <SelectItem key="creation_contenu">Création de contenu</SelectItem>
                  <SelectItem key="publication">Publication</SelectItem>
                  <SelectItem key="studio">Studio</SelectItem>
                </Select>

                <Select
                  label="Statut"
                  selectedKeys={[selectedInvoice.status]}
                  onSelectionChange={(keys) =>
                    setSelectedInvoice((prev) =>
                      prev
                        ? {
                          ...prev,
                          status: Array.from(keys)[0] as Invoice["status"],
                        }
                        : null
                    )
                  }
                >
                  <SelectItem key="payee">Payée</SelectItem>
                  <SelectItem key="en_attente">En attente</SelectItem>
                  <SelectItem key="retard">Retard</SelectItem>
                </Select>

                <Textarea
                  label="Commentaire"
                  placeholder="Commentaires sur la facture..."
                  value={selectedInvoice.comment || ""}
                  onChange={(e) =>
                    setSelectedInvoice((prev) =>
                      prev ? { ...prev, comment: e.target.value } : null
                    )
                  }
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleEditInvoice}
            >
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
