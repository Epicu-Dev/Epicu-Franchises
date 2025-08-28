"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { ToastContainer } from "@/components";
import { Switch } from "@heroui/switch";

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
  nombreVues?: number;
  nombreAbonnes?: number;
  faitGagnes?: string;
  FACTURES?: any[];
}

export default function ClientsPage() {
  const { showWarning } = useToast();
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
  const [isRdvMode, setIsRdvMode] = useState(false);

  // Effet pour mettre à jour les colonnes visibles quand le mode RDV change
  useEffect(() => {
    if (isRdvMode) {
      // Mode RDV activé : sélectionner toutes les colonnes RDV
      const rdvColumns = new Set(rdvColumnConfig.map(col => col.key));
      setVisibleColumns(rdvColumns);
    } else {
      // Mode normal : vider la sélection pour afficher toutes les colonnes
      setVisibleColumns(new Set());
    }
  }, [isRdvMode]);
  const [, setViewCount] = useState<number | null>(null);

  // Configuration des colonnes du tableau
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  const columnConfig = [
    { key: 'modifier', label: 'Modifier', sortable: false },
    { key: 'categorie', label: 'Catégorie', sortable: true, field: 'categorie' },
    { key: 'nomEtablissement', label: 'Nom établissement', sortable: false },
    { key: 'raisonSociale', label: 'Raison sociale', sortable: false },
    { key: 'ville', label: 'Ville', sortable: false },
    { key: 'telephone', label: 'Téléphone', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'numeroSiret', label: 'SIRET', sortable: false },
    { key: 'dateSignatureContrat', label: 'Date signature contrat', sortable: true, field: 'dateSignatureContrat' },
    { key: 'datePublicationContenu', label: 'Date publication contenu', sortable: true, field: 'datePublicationContenu' },
    { key: 'datePublicationFacture', label: 'Date envoi facture', sortable: true, field: 'datePublicationFacture' },
    { key: 'statutPaiementContenu', label: 'Statut paiement', sortable: true, field: 'statutPaiementContenu' },
    { key: 'montantFactureContenu', label: 'Montant facturé', sortable: false },
    { key: 'montantPaye', label: 'Montant payé', sortable: false },
    { key: 'restantDu', label: 'Restant dû', sortable: false },
    { key: 'montantSponsorisation', label: 'Sponsorisation', sortable: false },
    { key: 'montantAddition', label: 'Addition', sortable: false },
    { key: 'montantCadeau', label: 'Montant cadeau', sortable: false },
    { key: 'tirageAuSort', label: 'Tirage au sort', sortable: false },
    { key: 'commentaire', label: 'Commentaire', sortable: false },
    { key: 'commentaireCadeauGerant', label: 'Commentaire cadeau', sortable: false },
    { key: 'nombreVues', label: 'Nombre de vues', sortable: false },
    { key: 'nombreAbonnes', label: 'Nombre abonnés', sortable: false },
  ];

  // Configuration pour le mode RDV
  const rdvColumnConfig = [
    { key: 'modifier', label: 'Modifier', sortable: false },
    { key: 'categorie', label: 'Catégorie', sortable: true, field: 'categorie' },
    { key: 'nomEtablissement', label: 'Nom établissement', sortable: false },
    { key: 'ville', label: 'Ville', sortable: false },
    { key: 'commentaireCadeauGerant', label: 'Cadeau du gérant', sortable: false },
    { key: 'nombreVues', label: 'Nombre de vues', sortable: false },
    { key: 'nombreAbonnes', label: 'Nombre abonnés', sortable: false },
  ];


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

              {/* Dropdown de sélection des colonnes */}
              <StyledSelect
                className="w-64"
                placeholder={`Colonnes (${visibleColumns.size === 0 ? (isRdvMode ? rdvColumnConfig.length : columnConfig.length) : visibleColumns.size})`}
                selectionMode="multiple"
                selectedKeys={visibleColumns}
                onSelectionChange={(keys) => {
                  // Always include 'modifier' column, and add all selected keys
                  const newVisibleColumns = new Set(['modifier', ...Array.from(keys as Set<string> | string[])]);
                  setVisibleColumns(newVisibleColumns);
                }}
              >
                {(isRdvMode ? rdvColumnConfig : columnConfig).filter((column) => column.key !== 'modifier').map((column) => (
                  <SelectItem key={column.key}>
                    {column.label}
                  </SelectItem>
                ))}
              </StyledSelect>
              <div className="flex items-center gap-4 font-light text-sm">
                <span>Mode RDV</span>
                <Switch
                  isSelected={isRdvMode}
                  onValueChange={() => setIsRdvMode(!isRdvMode)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">


              <div className="relative">
                <Input
                  className="w-64 pr-4 pl-10"
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
              <Table aria-label="Tableau des clients" bottomContent={
                hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      color="primary"
                      disabled={loadingMore}
                      isLoading={loadingMore}
                      onPress={loadMore}
                    >
                      {loadingMore ? 'Chargement...' : 'Charger plus'}
                    </Button>
                  </div>
                )
              }
                shadow="none"
              >
                <TableHeader>

                  {/* Autres colonnes selon la sélection et le mode RDV */}
                  {(isRdvMode ? rdvColumnConfig : columnConfig)
                    .filter((column) => visibleColumns.size === 0 || visibleColumns.has(column.key))
                    .map((column) => {
                      if (column.sortable) {
                        return (
                          <TableColumn key={column.key} className="font-light text-sm">
                            <SortableColumnHeader
                              field={column.field!}
                              label={column.label}
                              sortDirection={sortDirection}
                              sortField={sortField}
                              onSort={handleSort}
                            />
                          </TableColumn>
                        );
                      }

                      return (
                        <TableColumn key={column.key} className="font-light text-sm">
                          {column.label}
                        </TableColumn>
                      );
                    })}
                </TableHeader>
                <TableBody className="mt-4">
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center" colSpan={visibleColumns.size === 0 ? (isRdvMode ? rdvColumnConfig.length + 1 : columnConfig.length + 1) : visibleColumns.size + 1}>
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
                        {(() => {
                          const cells: JSX.Element[] = [];

                          // Cellule Modifier toujours visible en premier
                          const hasFactures = client.FACTURES && client.FACTURES.length > 0;
                          cells.push(
                            <TableCell key="modifier" className="font-light">
                              <div className="relative">
                                <Button
                                  isIconOnly
                                  aria-label={hasFactures ? `Client ${client.raisonSociale} lié à la facturation - Modification désactivée` : `Modifier le client ${client.raisonSociale}`}
                                  className={hasFactures ? "text-gray-&ÀÀ cursor-not-allowed" : "text-gray-600 hover:text-gray-800"}
                                  size="sm"
                                  variant="light"
                                  onPress={() => {
                                    if (hasFactures) {
                                      showWarning(`Le client ${client.raisonSociale} est lié à une facture et ne peut plus être modifié.`);
                                    } else {
                                      handleEditClient(client);
                                    }
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                {hasFactures && (
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Client lié à la facturation
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          );

                          // Autres cellules selon la sélection et le mode RDV
                          (isRdvMode ? rdvColumnConfig : columnConfig)
                            .filter((column) => visibleColumns.size === 0 || visibleColumns.has(column.key))
                            .forEach((column) => {
                              switch (column.key) {
                                case 'categorie':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light py-5">
                                      <CategoryBadge category={client.categorie || ""} />
                                    </TableCell>
                                  );
                                  break;
                                case 'nomEtablissement':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.nomEtablissement}
                                    </TableCell>
                                  );
                                  break;
                                case 'raisonSociale':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.raisonSociale}
                                    </TableCell>
                                  );
                                  break;
                                case 'ville':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.ville}
                                    </TableCell>
                                  );
                                  break;
                                case 'telephone':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.telephone}
                                    </TableCell>
                                  );
                                  break;
                                case 'email':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.email}
                                    </TableCell>
                                  );
                                  break;
                                case 'numeroSiret':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.numeroSiret}
                                    </TableCell>
                                  );
                                  break;
                                case 'dateSignatureContrat':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.dateSignatureContrat
                                        ? new Date(client.dateSignatureContrat).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        }).replace(/\//g, '.')
                                        : "-"
                                      }
                                    </TableCell>
                                  );
                                  break;
                                case 'datePublicationContenu':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.datePublicationContenu
                                        ? new Date(client.datePublicationContenu).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        }).replace(/\//g, '.')
                                        : "-"
                                      }
                                    </TableCell>
                                  );
                                  break;
                                case 'datePublicationFacture':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.datePublicationFacture
                                        ? new Date(client.datePublicationFacture).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        }).replace(/\//g, '.')
                                        : "-"
                                      }
                                    </TableCell>
                                  );
                                  break;
                                case 'statutPaiementContenu':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      <StatusBadge status={client.statutPaiementContenu || "En attente"} />
                                    </TableCell>
                                  );
                                  break;
                                case 'montantFactureContenu':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.montantFactureContenu}
                                    </TableCell>
                                  );
                                  break;
                                case 'montantPaye':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.montantPaye}
                                    </TableCell>
                                  );
                                  break;
                                case 'restantDu':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.restantDu}
                                    </TableCell>
                                  );
                                  break;
                                case 'montantSponsorisation':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.montantSponsorisation}
                                    </TableCell>
                                  );
                                  break;
                                case 'montantAddition':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.montantAddition}
                                    </TableCell>
                                  );
                                  break;
                                case 'montantCadeau':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.montantCadeau}
                                    </TableCell>
                                  );
                                  break;
                                case 'tirageAuSort':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.tirageAuSort ? "Oui" : "Non"}
                                    </TableCell>
                                  );
                                  break;
                                case 'commentaire':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.commentaire || "-"}
                                    </TableCell>
                                  );
                                  break;
                                case 'commentaireCadeauGerant':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.commentaireCadeauGerant || "-"}
                                    </TableCell>
                                  );
                                  break;
                                case 'nombreVues':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.nombreVues || "-"}
                                    </TableCell>
                                  );
                                  break;
                                case 'nombreAbonnes':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.nombreAbonnes || "-"}
                                    </TableCell>
                                  );
                                  break;
                                case 'faitGagnes':
                                  cells.push(
                                    <TableCell key={column.key} className="font-light">
                                      {client.faitGagnes || "-"}
                                    </TableCell>
                                  );
                                  break;
                              }
                            });
                          return cells;
                        })()}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>}


        </CardBody>
      </Card>

      {/* Modal d'édition de client */}
      <ClientModal
        categories={categories}
        editingClient={editingClient}
        error={error}
        isLoading={isLoading}
        isOpen={isEditModalOpen}
        setEditingClient={setEditingClient}
        onOpenChange={setIsEditModalOpen}
        onUpdateClient={handleUpdateClient}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
