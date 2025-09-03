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
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";
import { SelectItem } from "@heroui/select";

import { StyledSelect } from "@/components/styled-select";
import { CategoryBadge, FormLabel, SortableColumnHeader } from "@/components";

interface Invoice {
  id: string;
  categorie: string;
  nomEtablissement: string;
  date: string;
  montant: number;
  typePrestation: string;
  statut: string;
  commentaire?: string;
}

interface Client {
  id: string;
  nomEtablissement: string;
  raisonSociale: string;
  ville?: string;
  categorie?: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
  numeroSiret?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
}

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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    category: "shop",
    establishmentName: "",
    date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
    amount: "",
    serviceType: "",
    status: "en_attente",
    comment: "",
    siret: "",
  });

  // Nouveaux états pour la recherche de client
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSearchResults, setShowClientSearchResults] = useState(false);

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

  const searchClients = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientSearchResults([]);
      setShowClientSearchResults(false);
      return;
    }

    try {
      setIsSearchingClient(true);
      setError(null);

      const response = await fetch(`/api/clients?q=${encodeURIComponent(searchTerm)}&limit=10`);

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche de clients");
      }

      const data = await response.json();
      setClientSearchResults(data.clients || []);
      setShowClientSearchResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSearchingClient(false);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.nomEtablissement);
    setShowClientSearchResults(false);

    // Pré-remplir les champs avec les informations du client
    setNewInvoice(prev => ({
      ...prev,
      establishmentName: client.nomEtablissement,
      category: client.categorie?.toLowerCase() || "shop",
      siret: client.numeroSiret || "",
    }));

    // Effacer les erreurs de validation
    setFieldErrors(prev => ({
      ...prev,
      establishmentName: "",
      siret: "",
    }));
  };

  const clearSelectedClient = () => {
    setSelectedClient(null);
    setClientSearchTerm("");
    setNewInvoice(prev => ({
      ...prev,
      establishmentName: "",
      category: "shop",
      siret: "",
    }));
    setClientSearchResults([]);
    setShowClientSearchResults(false);
  };

  const openEditModal = async (invoice: Invoice) => {
    // Pré-remplir le formulaire avec les données de la facture existante
    setNewInvoice({
      category: invoice.categorie,
      establishmentName: invoice.nomEtablissement,
      date: invoice.date,
      amount: invoice.montant.toString(),
      serviceType: invoice.typePrestation,
      status: invoice.statut,
      comment: invoice.commentaire || "",
      siret: "", // Sera rempli automatiquement si le client est trouvé
    });

    setSelectedInvoice(invoice);
    setError(null);
    setFieldErrors({});
    setSelectedClient(null);
    setClientSearchTerm(invoice.nomEtablissement);
    setIsAddModalOpen(true);

    // Rechercher automatiquement le client correspondant à cette facture
    try {
      const response = await fetch(`/api/clients?q=${encodeURIComponent(invoice.nomEtablissement)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        const clients = data.clients || [];
        
        // Trouver le client exact correspondant au nom d'établissement
        const matchingClient = clients.find((client: Client) => 
          client.nomEtablissement.toLowerCase() === invoice.nomEtablissement.toLowerCase()
        );
        
        if (matchingClient) {
          // Sélectionner automatiquement le client trouvé
          setSelectedClient(matchingClient);
          setClientSearchTerm(matchingClient.nomEtablissement);
          
          // Mettre à jour les informations cachées avec les données du client
          setNewInvoice(prev => ({
            ...prev,
            establishmentName: matchingClient.nomEtablissement,
            category: matchingClient.categorie?.toLowerCase() || prev.category,
            siret: matchingClient.numeroSiret || "",
          }));
        }
      }
    } catch (err) {
      // En cas d'erreur, on continue sans pré-charger le client
      console.warn("Impossible de charger les informations du client:", err);
    }
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

  // Recherche de clients avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm) {
        searchClients(clientSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm]);

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
      setSelectedClient(null);
      setClientSearchTerm("");
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
      setSelectedClient(null);
      setClientSearchTerm("");
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
                  setFieldErrors({});
                  setSelectedClient(null);
                  setClientSearchTerm("");
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
                      label="Montant"
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
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader className="flex justify-center">
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
              {/* Recherche de client */}
              <div className="relative">
                <FormLabel htmlFor="clientSearch" isRequired={true}>
                  Rechercher un client
                </FormLabel>
                <Input
                  isRequired
                  endContent={
                    isSearchingClient ? (
                      <Spinner size="sm" />
                    ) : (
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    )
                  }
                  id="clientSearch"
                  placeholder="Rechercher par nom, email, téléphone..."
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  value={clientSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setClientSearchTerm(value);
                    if (!value) {
                      clearSelectedClient();
                    }
                  }}
                  onFocus={() => {
                    if (clientSearchTerm && clientSearchResults.length > 0) {
                      setShowClientSearchResults(true);
                    }
                  }}
                />

                {/* Résultats de recherche */}
                {showClientSearchResults && clientSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clientSearchResults.map((client) => (
                      <div
                        key={client.id}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        onClick={() => selectClient(client)}
                        onKeyDown={(e) => e.key === 'Enter' && selectClient(client)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {client.nomEtablissement}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {client.raisonSociale}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {client.ville && `${client.ville} • `}
                          {client.email && `${client.email} • `}
                          {client.telephone && client.telephone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Encart d'informations du client sélectionné */}
              {selectedClient && (
                <div className="bg-page-bg border  rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">
                      Client sélectionné
                    </h4>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-primary-light"
                      onPress={clearSelectedClient}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-primary-light">Établissement:</span>
                      <span >
                        {selectedClient.nomEtablissement}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-light">Raison sociale:</span>
                      <span >
                        {selectedClient.raisonSociale}
                      </span>
                    </div>
                    {selectedClient.ville && (
                      <div className="flex justify-between">
                        <span className="text-primary-light">Ville:</span>
                        <span >
                          {selectedClient.ville}
                        </span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex justify-between">
                        <span className="text-primary-light">Email:</span>
                        <span >
                          {selectedClient.email}
                        </span>
                      </div>
                    )}
                    {selectedClient.telephone && (
                      <div className="flex justify-between">
                        <span className="text-primary-light">Téléphone:</span>
                        <span >
                          {selectedClient.telephone}
                        </span>
                      </div>
                    )}
                    {selectedClient.numeroSiret && (
                      <div className="flex justify-between">
                        <span className="text-primary-light">SIRET:</span>
                        <span >
                          {selectedClient.numeroSiret}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SIRET (caché mais nécessaire pour la validation) */}
              <input
                type="hidden"
                value={newInvoice.siret}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, siret: e.target.value }))}
              />

              {/* Nom d'établissement (caché mais nécessaire pour la validation) */}
              <input
                type="hidden"
                value={newInvoice.establishmentName}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, establishmentName: e.target.value }))}
              />

              {/* Catégorie (cachée mais nécessaire pour la validation) */}
              <input
                type="hidden"
                value={newInvoice.category}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, category: e.target.value }))}
              />

              {/* Affichage conditionnel des champs de facturation */}
              {selectedClient && (
                <>
                  <FormLabel htmlFor="serviceType" isRequired={true}>
                    Prestation
                  </FormLabel>
                  <StyledSelect
                    isRequired
                    errorMessage={fieldErrors.serviceType}
                    id="serviceType"
                    isInvalid={!!fieldErrors.serviceType}
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
                    id="amount"
                    isInvalid={!!fieldErrors.amount}
                    placeholder="Ex: 1457.98"
                    step="0.01"
                    type="number"
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
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
                    id="date"
                    isInvalid={!!fieldErrors.date}
                    type="date"
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
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
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    placeholder="Commentaires sur la facture..."
                    value={newInvoice.comment}
                    onChange={(e) => {
                      const value = e.target.value;

                      setNewInvoice((prev) => ({ ...prev, comment: value }));
                    }}
                  />
                </>
              )}

              {/* Message d'instruction si aucun client n'est sélectionné */}
              {!selectedClient && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-lg font-medium mb-2">
                    Sélectionnez un client pour continuer
                  </div>
                  <div className="text-sm">
                    Utilisez la recherche ci-dessus pour trouver et sélectionner un client
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-end">
            <Button className="flex-1 border-1" color='primary' variant="bordered" onPress={() => {
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
              setSelectedClient(null);
              setClientSearchTerm("");
            }}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
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
