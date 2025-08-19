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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    category: "",
    establishmentName: "",
    date: "",
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

  const handleAddInvoice = async () => {
    try {
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
        throw new Error("Erreur lors de l'ajout de la facture");
      }

      setNewInvoice({
        category: "",
        establishmentName: "",
        date: "",
        amount: "",
        serviceType: "",
        status: "en_attente",
        comment: "",
      });
      setIsAddModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await fetch(`/api/facturation/${selectedInvoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedInvoice),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification de la facture");
      }

      setIsEditModalOpen(false);
      setSelectedInvoice(null);
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

            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={() => setIsAddModalOpen(true)}
            >
              Ajouter une facture
            </Button>
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
                  <TableCell>{invoice.serviceType}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      className="text-gray-600 hover:text-gray-800"
                      size="sm"
                      variant="light"
                      onPress={() => {
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
                label="Nom de l'établissement"
                placeholder="Ex: L'ambiance"
                value={newInvoice.establishmentName}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    establishmentName: e.target.value,
                  }))
                }
              />

              <Input
                isRequired
                label="Date"
                type="date"
                value={newInvoice.date}
                onChange={(e) =>
                  setNewInvoice((prev) => ({ ...prev, date: e.target.value }))
                }
              />

              <Input
                isRequired
                label="Montant (€)"
                placeholder="Ex: 1457.98"
                step="0.01"
                type="number"
                value={newInvoice.amount}
                onChange={(e) =>
                  setNewInvoice((prev) => ({ ...prev, amount: e.target.value }))
                }
              />

              <Input
                isRequired
                label="Type de prestation"
                placeholder="Ex: Tournage"
                value={newInvoice.serviceType}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    serviceType: e.target.value,
                  }))
                }
              />

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

                <Input
                  isRequired
                  label="Type de prestation"
                  placeholder="Ex: Tournage"
                  value={selectedInvoice.serviceType}
                  onChange={(e) =>
                    setSelectedInvoice((prev) =>
                      prev ? { ...prev, serviceType: e.target.value } : null
                    )
                  }
                />

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
