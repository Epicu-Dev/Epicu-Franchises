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
import { Pagination } from "@heroui/pagination";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { ArrowDownTrayIcon, MagnifyingGlassIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";

import { CategoryBadge, StatusBadge } from "@/components/badges";
import { FormLabel, SortableColumnHeader } from "@/components";
import { StyledSelect } from "@/components/styled-select";

interface Client {
  id: string;
  raisonSociale: string;
  ville: string;
  categorie: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construire les paramètres de requête
      const params = new URLSearchParams();

      if (searchTerm) params.append('q', searchTerm);
      if (sortField) params.append('orderBy', sortField);
      if (sortDirection) params.append('order', sortDirection);
      params.append('limit', pagination.itemsPerPage.toString());
      params.append('offset', ((pagination.currentPage - 1) * pagination.itemsPerPage).toString());

      const queryString = params.toString();
      const url = `/api/clients${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des clients");
      }

      const data = await response.json();

      setClients(data.clients || []);
      setViewCount(data.viewCount ?? null);
      setPagination(prev => ({
        ...prev,
        totalItems: data.totalCount || 0,
        totalPages: Math.ceil((data.totalCount || 0) / prev.itemsPerPage)
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      console.log('finally');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [
    pagination.currentPage,
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



  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      // Validation côté client
      if (!editingClient.raisonSociale.trim()) {
        setError("La raison sociale est requise");

        return;
      }

      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingClient),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de la modification du client");
      }

      // Fermer le modal et recharger les clients
      setIsEditModalOpen(false);
      setEditingClient(null);
      setError(null);
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };



  if (loading && clients.length === 0) {
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
        <CardBody className="p-2" >
          {/* Header with filters */}
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-4">
              <StyledSelect
                className="w-40"

                placeholder="Catégorie"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tous">Catégorie</SelectItem>
                <SelectItem key="FOOD">Food</SelectItem>
                <SelectItem key="SHOP">Shop</SelectItem>
                <SelectItem key="TRAVEL">Travel</SelectItem>
                <SelectItem key="FUN">Fun</SelectItem>
                <SelectItem key="BEAUTY">Beauty</SelectItem>
              </StyledSelect>

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



          {/* Table */}
          {<Table aria-label="Tableau des clients" shadow="none" >
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
            <TableBody>
              {
                loading ? (
                  <TableRow>
                    <TableCell className="text-center" colSpan={8}>
                      <Spinner className="text-black dark:text-white p-20" size="lg" />
                    </TableCell>
                  </TableRow>
                ) : clients.map((client, index) => (
                  <TableRow key={client.id || index} className="border-t border-gray-100  dark:border-gray-700">
                    <TableCell className="font-light py-5">
                      <CategoryBadge category={client.categorie || "FOOD"} />
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
                ))}
            </TableBody>
          </Table>}

          {/* Pagination */}
          {!loading && <div className="flex justify-center mt-6">
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
          </div>}

          {/* Info sur le nombre total d'éléments */}
          {!loading && <div className="text-center mt-4 text-sm text-gray-500">
            Affichage de {clients.length} client(s) sur {pagination.totalItems}{" "}
            au total
          </div>}
        </CardBody>
      </Card>

      {/* Modal d'édition de client */}
      <Modal
        isOpen={isEditModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={setIsEditModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Modifier le client</ModalHeader>

          <ModalBody className="max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            {editingClient && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Informations générales
                  </h3>

                  <FormLabel htmlFor="raisonSociale" isRequired={true}>
                    Nom établissement
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="raisonSociale"
                    placeholder="Nom de l'établissement"
                    value={editingClient.raisonSociale}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, raisonSociale: e.target.value } : null
                      )
                    }
                  />

                  <FormLabel htmlFor="ville" isRequired={true}>
                    Ville
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="ville"
                    placeholder="Paris"
                    value={editingClient.ville || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, ville: e.target.value } : null
                      )
                    }
                  />

                  <FormLabel htmlFor="categorie" isRequired={true}>
                    Catégorie
                  </FormLabel>
                  <StyledSelect
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    id="categorie"
                    placeholder="Sélectionner une catégorie"
                    selectedKeys={
                      editingClient.categorie ? [editingClient.categorie] : []
                    }
                    onSelectionChange={(keys) =>
                      setEditingClient((prev) =>
                        prev
                          ? {
                            ...prev,
                            categorie: Array.from(keys)[0] as 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY',
                          }
                          : null
                      )
                    }
                  >
                    <SelectItem key="FOOD">Food</SelectItem>
                    <SelectItem key="SHOP">Shop</SelectItem>
                    <SelectItem key="TRAVEL">Travel</SelectItem>
                    <SelectItem key="FUN">Fun</SelectItem>
                    <SelectItem key="BEAUTY">Beauty</SelectItem>
                  </StyledSelect>

                  <FormLabel htmlFor="telephone" isRequired={true}>
                    Téléphone
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="telephone"
                    placeholder="01 23 45 67 89"
                    value={editingClient.telephone || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, telephone: e.target.value } : null
                      )
                    }
                  />

                  <FormLabel htmlFor="email" isRequired={true}>
                    Mail
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="email"
                    placeholder="contact@etablissement.fr"
                    type="email"
                    value={editingClient.email || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                  />

                  <FormLabel htmlFor="numeroSiret" isRequired={true}>
                    Numéro de SIRET
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="numeroSiret"
                    placeholder="12345678901234"
                    value={editingClient.numeroSiret || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, numeroSiret: e.target.value } : null
                      )
                    }
                  />
                </div>

                {/* Commentaire */}
                <div className="space-y-4">
                  <FormLabel htmlFor="commentaire" isRequired={false}>
                    Commentaire
                  </FormLabel>

                  <Textarea
                    classNames={{
                      input: "text-sm",
                    }}
                    minRows={3}
                    placeholder="..."
                    value={editingClient.commentaire || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, commentaire: e.target.value } : null
                      )
                    }
                  />
                </div>

                {/* Prestations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Prestations
                  </h3>

                  <FormLabel htmlFor="dateSignatureContrat" isRequired={true}>
                    Date de signature du contrat
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="dateSignatureContrat"
                    type="date"
                    value={editingClient.dateSignatureContrat || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, dateSignatureContrat: e.target.value }
                          : null
                      )
                    }
                  />

                  <Button
                    className="bg-black text-white"
                    endContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Télécharger
                  </Button>

                  <FormLabel htmlFor="datePublicationContenu" isRequired={true}>
                    Date de publication
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="datePublicationContenu"
                    type="date"
                    value={editingClient.datePublicationContenu || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, datePublicationContenu: e.target.value }
                          : null
                      )
                    }
                  />

                  <FormLabel htmlFor="datePublicationFacture" isRequired={true}>
                    Date d&apos;envoie facture création de contenu
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="datePublicationFacture"
                    type="date"
                    value={editingClient.datePublicationFacture || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, datePublicationFacture: e.target.value }
                          : null
                      )
                    }
                  />

                  <FormLabel htmlFor="statutPaiementContenu" isRequired={true}>
                    Statut du paiement
                  </FormLabel>
                  <StyledSelect
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    id="statutPaiementContenu"
                    selectedKeys={
                      editingClient.statutPaiementContenu
                        ? [editingClient.statutPaiementContenu]
                        : []
                    }
                    onSelectionChange={(keys) =>
                      setEditingClient((prev) =>
                        prev
                          ? {
                            ...prev,
                            statutPaiementContenu: Array.from(keys)[0] as
                              | "Payée"
                              | "En attente"
                              | "En retard",
                          }
                          : null
                      )
                    }
                  >
                    <SelectItem key="Payée">Payée</SelectItem>
                    <SelectItem key="En attente">En attente</SelectItem>
                    <SelectItem key="En retard">En retard</SelectItem>
                  </StyledSelect>

                  <FormLabel htmlFor="montantFactureContenu" isRequired={true}>
                    Montant facturé
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="montantFactureContenu"
                    placeholder="1750€"
                    value={editingClient.montantFactureContenu || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, montantFactureContenu: e.target.value }
                          : null
                      )
                    }
                  />

                  <FormLabel htmlFor="montantPaye" isRequired={true}>
                    Montant payé
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="montantPaye"
                    placeholder="750€"
                    value={editingClient.montantPaye || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, montantPaye: e.target.value } : null
                      )
                    }
                  />

                  <FormLabel htmlFor="dateReglementFacture" isRequired={true}>
                    Date du règlement de la facture
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="dateReglementFacture"
                    type="date"
                    value={editingClient.dateReglementFacture || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, dateReglementFacture: e.target.value }
                          : null
                      )
                    }
                  />

                  <FormLabel htmlFor="restantDu" isRequired={true}>
                    Restant dû
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="restantDu"
                    placeholder="1750€"
                    value={editingClient.restantDu || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, restantDu: e.target.value } : null
                      )
                    }
                  />

                  <FormLabel htmlFor="montantSponsorisation" isRequired={true}>
                    Montant de la sponsorisation
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="montantSponsorisation"
                    placeholder="1750€"
                    value={editingClient.montantSponsorisation || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, montantSponsorisation: e.target.value }
                          : null
                      )
                    }
                  />

                  <FormLabel htmlFor="montantAddition" isRequired={true}>
                    Montant de l&apos;addition
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="montantAddition"
                    placeholder="1750€"
                    value={editingClient.montantAddition || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, montantAddition: e.target.value }
                          : null
                      )
                    }
                  />
                </div>

                {/* Commentaire */}
                <div className="space-y-4">
                  <FormLabel htmlFor="commentaire" isRequired={false}>
                    Commentaire
                  </FormLabel>

                  <Textarea
                    classNames={{
                      input: "text-sm",
                    }}
                    id="commentaire"
                    minRows={4}
                    placeholder="..."
                    value={editingClient.commentaire || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, commentaire: e.target.value } : null
                      )
                    }
                  />
                </div>

                {/* Cadeau du gérant pour le jeu concours */}
                <div className="space-y-4">
                  <FormLabel htmlFor="commentaireCadeauGerant" isRequired={false}>
                    Cadeau du gérant pour le jeu concours
                  </FormLabel>
                  <Textarea
                    classNames={{
                      input: "text-sm",
                    }}
                    id="commentaireCadeauGerant"
                    minRows={4}
                    placeholder="..."
                    value={editingClient.commentaireCadeauGerant || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev
                          ? { ...prev, commentaireCadeauGerant: e.target.value }
                          : null
                      )
                    }
                  />

                  <FormLabel htmlFor="montantCadeau" isRequired={true}>
                    Montant du cadeau
                  </FormLabel>
                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    id="montantCadeau"
                    placeholder="150€"
                    value={editingClient.montantCadeau || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, montantCadeau: e.target.value } : null
                      )
                    }
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-base ">Tirage au sort effectué</span>
                    <Switch
                      isSelected={editingClient.tirageAuSort}
                      onValueChange={(checked) =>
                        setEditingClient((prev) =>
                          prev ? { ...prev, tirageAuSort: checked } : null
                        )
                      }
                    />
                  </div>

                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button
              className="flex-1"
              variant="bordered"
              onPress={() => {
                setIsEditModalOpen(false);
                setEditingClient(null);
              }}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleUpdateClient}
            >
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
