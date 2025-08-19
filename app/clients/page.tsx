"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
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
import { MagnifyingGlassIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

interface Client {
  id: string;
  raisonSociale: string;
  ville: string;
  categorie: string;
  telephone: string;
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    raisonSociale: "",
    email: "",
    telephone: "",
    adresse: "",
    commentaire: "",
    statut: "actif" as "actif" | "inactif" | "prospect",
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      const response = await fetch(`/api/clients?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des clients");
      }

      const data = await response.json();

      setClients(data.clients);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
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

  const handleAddClient = async () => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du client");
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewClient({
        raisonSociale: "",
        email: "",
        telephone: "",
        adresse: "",
        commentaire: "",
        statut: "actif",
      });
      setIsAddModalOpen(false);

      // Recharger les clients
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingClient),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du client");
      }

      // Fermer le modal et recharger les clients
      setIsEditModalOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "En attente":
        return "bg-yellow-100 text-yellow-800";
      case "Payée":
        return "bg-green-100 text-green-800";
      case "En retard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "food":
        return "bg-orange-100 text-orange-800";
      case "shop":
        return "bg-purple-100 text-purple-800";
      case "service":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
  };

  if (loading && clients.length === 0) {
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
          {/* Header with filters */}
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
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="shop">Shop</SelectItem>
                <SelectItem key="food">Food</SelectItem>
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

          {/* Table */}
          <Table aria-label="Tableau des clients">
            <TableHeader>
              <TableColumn>Client</TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("categorie")}
                >
                  Catégorie
                  {sortField === "categorie" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Nom établissement</TableColumn>
              <TableColumn>Raison sociale</TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("dateSignatureContrat")}
                >
                  Date signature contrat
                  {sortField === "dateSignatureContrat" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Facture contenu</TableColumn>
              <TableColumn>Facture publication</TableColumn>
              <TableColumn>Modifier</TableColumn>
              <TableColumn>Commentaire</TableColumn>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.id}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getCategoryBadgeColor(client.categorie || "Shop")}`}
                    >
                      {client.categorie || "Shop"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">L&apos;ambiance</TableCell>
                  <TableCell className="font-medium">
                    {client.raisonSociale}
                  </TableCell>
                  <TableCell>{client.dateSignatureContrat}</TableCell>
                  <TableCell>{client.factureContenu}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(client.facturePublication)}`}
                    >
                      {client.facturePublication}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      className="text-gray-600 hover:text-gray-800"
                      size="sm"
                      variant="light"
                      onPress={() => handleEditClient(client)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>{client.commentaire}</TableCell>
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
            Affichage de {clients.length} client(s) sur {pagination.totalItems}{" "}
            au total
          </div>
        </CardBody>
      </Card>

      {/* Modal d'ajout de client */}
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader>Ajouter un nouveau client</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Raison sociale"
                placeholder="Nom de l'entreprise"
                value={newClient.raisonSociale}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    raisonSociale: e.target.value,
                  }))
                }
              />
              <Input
                label="Email"
                placeholder="contact@entreprise.fr"
                type="email"
                value={newClient.email}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <Input
                label="Téléphone"
                placeholder="01 23 45 67 89"
                value={newClient.telephone}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    telephone: e.target.value,
                  }))
                }
              />
              <Input
                label="Adresse"
                placeholder="123 Rue de l'entreprise, 75001 Paris"
                value={newClient.adresse}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, adresse: e.target.value }))
                }
              />
              <Select
                label="Statut"
                selectedKeys={[newClient.statut]}
                onSelectionChange={(keys) =>
                  setNewClient((prev) => ({
                    ...prev,
                    statut: Array.from(keys)[0] as
                      | "actif"
                      | "inactif"
                      | "prospect",
                  }))
                }
              >
                <SelectItem key="actif">Actif</SelectItem>
                <SelectItem key="inactif">Inactif</SelectItem>
                <SelectItem key="prospect">Prospect</SelectItem>
              </Select>
              <Textarea
                label="Commentaire"
                placeholder="Informations supplémentaires..."
                value={newClient.commentaire}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    commentaire: e.target.value,
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
              onPress={handleAddClient}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition de client */}
      <Modal
        isOpen={isEditModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={setIsEditModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2>Modifier le client</h2>
            <p className="text-sm text-gray-500 font-normal">
              {editingClient?.raisonSociale}
            </p>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            {editingClient && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Informations générales
                  </h3>

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Nom établissement"
                    placeholder="Nom de l'établissement"
                    value={editingClient.raisonSociale}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, raisonSociale: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Ville"
                    placeholder="Paris"
                    value={editingClient.ville || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, ville: e.target.value } : null
                      )
                    }
                  />

                  <Select
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    label="Catégorie"
                    placeholder="Sélectionner une catégorie"
                    selectedKeys={
                      editingClient.categorie ? [editingClient.categorie] : []
                    }
                    onSelectionChange={(keys) =>
                      setEditingClient((prev) =>
                        prev
                          ? {
                              ...prev,
                              categorie: Array.from(keys)[0] as string,
                            }
                          : null
                      )
                    }
                  >
                    <SelectItem key="shop">Shop</SelectItem>
                    <SelectItem key="food">Food</SelectItem>
                    <SelectItem key="service">Service</SelectItem>
                  </Select>

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Téléphone"
                    placeholder="01 23 45 67 89"
                    value={editingClient.telephone || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, telephone: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Mail"
                    placeholder="contact@etablissement.fr"
                    type="email"
                    value={editingClient.email || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Numéro de SIRET"
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
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Commentaire
                  </h3>

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

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Date de signature du contrat"
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
                    className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                    startContent={<span>📥</span>}
                  >
                    Télécharger
                  </Button>

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Date de publication"
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

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Date d'envoie facture création de contenu"
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

                  <Select
                    classNames={{
                      label: "text-sm font-medium",
                    }}
                    label="Statut du paiement"
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
                  </Select>

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Montant facturé"
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

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Montant payé"
                    placeholder="750€"
                    value={editingClient.montantPaye || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, montantPaye: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Date du règlement de la facture"
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

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Restant dû"
                    placeholder="1750€"
                    value={editingClient.restantDu || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, restantDu: e.target.value } : null
                      )
                    }
                  />

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Montant de la sponsorisation"
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

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Montant de l'addition"
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
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Commentaire
                  </h3>

                  <Textarea
                    classNames={{
                      input: "text-sm",
                    }}
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
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Cadeau du gérant pour le jeu concours
                  </h3>

                  <Textarea
                    classNames={{
                      input: "text-sm",
                    }}
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

                  <Input
                    isRequired
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                    label="Montant du cadeau"
                    placeholder="150€"
                    value={editingClient.montantCadeau || ""}
                    onChange={(e) =>
                      setEditingClient((prev) =>
                        prev ? { ...prev, montantCadeau: e.target.value } : null
                      )
                    }
                  />

                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium">
                      Tirage au sort effectué
                    </span>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        className={
                          editingClient.tirageAuSort === false
                            ? "bg-gray-200"
                            : ""
                        }
                        size="sm"
                        variant="light"
                        onPress={() =>
                          setEditingClient((prev) =>
                            prev ? { ...prev, tirageAuSort: false } : null
                          )
                        }
                      >
                        Annuler
                      </Button>
                      <Button
                        className="bg-black text-white dark:bg-white dark:text-black"
                        size="sm"
                        onPress={() =>
                          setEditingClient((prev) =>
                            prev ? { ...prev, tirageAuSort: true } : null
                          )
                        }
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsEditModalOpen(false);
                setEditingClient(null);
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
