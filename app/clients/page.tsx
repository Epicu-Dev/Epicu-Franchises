"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { MagnifyingGlassIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { CategoryBadge, StatusBadge } from "@/components/badges";
import { SortableColumnHeader } from "@/components";
import { StyledSelect } from "@/components/styled-select";
import ClientModal from "@/components/client-modal";

interface Client {
  id: string;
  raisonSociale: string;
  ville: string;
  categorie: string;
  telephone: string;
  nomEtablissement: string;
  email: string;
  numeroSiret: string;
  dateSignatureContrat: string;
  datePublicationContenu: string;
  datePublicationFacture: string;
  statutPaiementContenu: "Payée" | "En attente" | "En retard";
  montantFactureContenu: string;
  montantPaye: string;
  dateReglementFacture: string;
  restantDu: string;
  montantSponsorisation: string;
  montantAddition: string;
  factureContenu: string;
  facturePublication: string;
  commentaire: string;
  commentaireCadeauGerant: string;
  montantCadeau: string;
  tirageAuSort: boolean;
  adresse?: string;
  statut?: "actif" | "inactif" | "prospect";
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  // Variables pour le LazyLoading
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tous");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Array<{ id: string, name: string }>>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setViewCount] = useState<number | null>(null);


  const fetchClients = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Construire les paramètres de requête pour l'API Airtable
      const params = new URLSearchParams();

      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategoryId && selectedCategoryId !== '') {
        params.append('category', selectedCategoryId);
      }
      if (sortField) params.append('orderBy', sortField);
      if (sortDirection) params.append('order', sortDirection);

      const limit = 20;
      const offset = isLoadMore ? (nextOffset || 0) : 0;
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const queryString = params.toString();
      const url = `/api/clients/clients${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des clients");
      }

      const data = await response.json();

      if (isLoadMore) {
        setClients(prev => [...prev, ...(data.clients || [])]);
      } else {
        setClients(data.clients || []);
      }

      setViewCount(data.viewCount ?? null);

      // Mettre à jour la pagination pour le LazyLoading
      setHasMore(data.pagination?.hasMore || false);
      setNextOffset(data.pagination?.nextOffset || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fonction pour récupérer les catégories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('Catégories récupérées:', data.results);
        setCategories(data.results || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des catégories:', err);
    }
  };

  // Fonction pour charger plus de données
  const loadMore = () => {
    if (hasMore && !loadingMore && nextOffset !== null) {
      fetchClients(true);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [
    searchTerm,
    selectedCategory,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };



  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validation côté client
      if (!editingClient.raisonSociale?.trim()) {
        setError("La raison sociale est requise");
        setIsLoading(false);
        return;
      }

      const isEditing = editingClient.id;
      const url = isEditing
        ? `/api/clients/${editingClient.id}`
        : '/api/clients/clients';

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingClient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du client`);
      }

      // Fermer le modal et recharger les clients
      setIsEditModalOpen(false);
      setEditingClient(null);
      setError(null);
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full text-primary">
      <Card className="w-full" shadow="none">
        <CardBody className="p-2" >
          {/* Header with filters */}
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-4">
              <StyledSelect
                className="w-40"
                placeholder="Catégorie"
                selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  console.log('Catégorie sélectionnée:', selected);
                  if (selected === 'tous') {
                    setSelectedCategory('tous');
                    setSelectedCategoryId('');
                  } else {
                    const category = categories.find(cat => cat.id === selected);
                    setSelectedCategory(category?.name || '');
                    setSelectedCategoryId(selected);
                  }
                }}
              >
                <SelectItem key="tous">Toutes</SelectItem>
                {categories.length > 0 ? (
                  <>
                    {categories.map((category) => (
                      <SelectItem key={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem key="loading">Chargement...</SelectItem>
                )}
              </StyledSelect>
            </div>

            <div className="flex items-center gap-4">
             

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
                  endContent={searchTerm && <XMarkIcon className="h-5 w-5 cursor-pointer" onClick={() => setSearchTerm('')} />}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>



          {/* Table avec LazyLoading */}
          {loading ? <div className="w-full">
            <Card className="w-full" shadow="none">
              <CardBody className="p-6">
                <div className="flex justify-center items-center h-64">
                  <Spinner className="text-black dark:text-white" size="lg" />
                </div>
              </CardBody>
            </Card>
          </div> :

            error ? <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Erreur: {error}</div>
            </div> :
              <Table aria-label="Tableau des clients" shadow="none"
                bottomContent={
                  hasMore && (
                    <div className="flex justify-center py-4">
                      <Button
                        color="primary"
                        onPress={loadMore}
                        isLoading={loadingMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Chargement...' : 'Charger plus'}
                      </Button>
                    </div>
                  )
                }
              >
                <TableHeader>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="categorie"
                      label="Catégorie"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">Nom établissement</TableColumn>
                  <TableColumn className="font-light text-sm">Raison sociale</TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="dateSignatureContrat"
                      label="Date signature contrat"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">Facture contenu</TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="statutPaiementContenu"
                      label="Facture publication"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="font-light text-sm">Modifier</TableColumn>
                  <TableColumn className="font-light text-sm">Commentaire</TableColumn>
                </TableHeader>
                <TableBody className="mt-4">
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center" colSpan={8}>
                        <div className="py-20 text-gray-500">
                          <div>
                            <div className="text-lg mb-2">Aucun client trouvé</div>
                            <div className="text-sm">Essayez de modifier vos filtres</div>
                            <Button
                              className="mt-4"
                              color="primary"
                              onPress={() => {
                                setSearchTerm('');
                                setSelectedCategory('tous');
                                setSelectedCategoryId('');
                              }}
                            >
                              Réinitialiser les filtres
                            </Button>
                          </div>

                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client, index) => (
                      <TableRow key={client.id || index} className="border-t border-gray-100 dark:border-gray-700">
                        <TableCell className="font-light py-5">
                          <CategoryBadge category={client.categorie || ""} />
                        </TableCell>
                        <TableCell className="font-light">
                          {client.nomEtablissement}
                        </TableCell>
                        <TableCell className="font-light">
                          {client.raisonSociale}
                        </TableCell>
                        <TableCell className="font-light">
                          {client.dateSignatureContrat
                            ? new Date(client.dateSignatureContrat).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }).replace(/\//g, '.')
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="font-light">
                          {client.dateSignatureContrat
                            ? new Date(client.dateSignatureContrat).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }).replace(/\//g, '.')
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="font-light">
                          <StatusBadge status={client.statutPaiementContenu || "En attente"} />
                        </TableCell>
                        <TableCell className="font-light">
                          <Button
                            isIconOnly
                            aria-label={`Modifier le client ${client.raisonSociale}`}
                            className="text-gray-600 hover:text-gray-800"
                            size="sm"
                            variant="light"
                            onPress={() => handleEditClient(client)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="font-light">{client.commentaire || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>}


        </CardBody>
      </Card>

      {/* Modal d'édition de client */}
      <ClientModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingClient={editingClient}
        setEditingClient={setEditingClient}
        categories={categories}
        onUpdateClient={handleUpdateClient}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
