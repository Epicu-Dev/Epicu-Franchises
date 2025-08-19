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
import { Checkbox } from "@heroui/checkbox";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

interface Todo {
  id: string;
  titre: string;
  description: string;
  priorite: "basse" | "moyenne" | "haute" | "urgente";
  statut: "a_faire" | "en_cours" | "terminee" | "annulee";
  assigne: string;
  dateEcheance: string;
  dateCreation: string;
  tags: string[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);

  const [newTodo, setNewTodo] = useState({
    titre: "",
    statut: "a_faire" as Todo["statut"],
    dateEcheance: "",
  });

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchTerm,
        statut: selectedStatut,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      const response = await fetch(`/api/todos?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tâches");
      }

      const data = await response.json();

      setTodos(data.todos);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [
    pagination.currentPage,
    searchTerm,
    selectedStatut,
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

  const handleAddTodo = async () => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de la tâche");
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewTodo({
        titre: "",
        statut: "a_faire",
        dateEcheance: "",
      });
      setIsAddModalOpen(false);

      // Recharger les tâches
      fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la tâche");
      }

      // Recharger les tâches
      fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const openDeleteConfirmation = (todo: Todo) => {
    setTodoToDelete(todo);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!todoToDelete) return;

    try {
      await handleDeleteTodo(todoToDelete.id);
      setIsDeleteModalOpen(false);
      setTodoToDelete(null);
    } catch (err) {
      // L'erreur est déjà gérée dans handleDeleteTodo
    }
  };

  const handleStatusChange = async (
    todoId: string,
    newStatus: Todo["statut"]
  ) => {
    try {
      // Optimistic update - mettre à jour l'état local immédiatement
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoId ? { ...todo, statut: newStatus } : todo
        )
      );

      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statut: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du statut");
      }

      // Pas besoin de recharger toutes les tâches, l'état local est déjà à jour
    } catch (err) {
      // En cas d'erreur, remettre l'état précédent
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                statut: todo.statut === "terminee" ? "a_faire" : "terminee",
              }
            : todo
        )
      );
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "a_faire":
        return "Pas commencé";
      case "en_cours":
        return "En cours";
      case "terminee":
        return "Validée";
      case "annulee":
        return "Annulée";
      default:
        return statut;
    }
  };

  const getStatutBadgeClass = (statut: string) => {
    switch (statut) {
      case "terminee":
        return "bg-green-100 text-green-800";
      case "en_cours":
        return "bg-blue-100 text-blue-800";
      case "annulee":
        return "bg-red-100 text-red-800";
      case "a_faire":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && todos.length === 0) {
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
                placeholder="État"
                selectedKeys={selectedStatut ? [selectedStatut] : []}
                onSelectionChange={(keys) =>
                  setSelectedStatut(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tous">Tous</SelectItem>
                <SelectItem key="a_faire">Pas commencé</SelectItem>
                <SelectItem key="en_cours">En cours</SelectItem>
                <SelectItem key="terminee">Validée</SelectItem>
                <SelectItem key="annulee">Annulée</SelectItem>
              </Select>
            </div>

            <div className="relative">
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsAddModalOpen(true)}
              >
                Ajouter une tâche
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table aria-label="Tableau des tâches">
            <TableHeader>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("titre")}
                >
                  Tâches
                  {sortField === "titre" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("dateEcheance")}
                >
                  Deadline
                  {sortField === "dateEcheance" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                  variant="light"
                  onPress={() => handleSort("statut")}
                >
                  État
                  {sortField === "statut" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </Button>
              </TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {todos.map((todo) => (
                <TableRow key={todo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="text-black"
                        isDisabled={todo.statut === "annulee"}
                        isSelected={todo.statut === "terminee"}
                        onValueChange={(checked) => {
                          const newStatus = checked ? "terminee" : "a_faire";

                          handleStatusChange(todo.id, newStatus);
                        }}
                      />
                      <span>{todo.titre}</span>
                    </div>
                  </TableCell>
                  <TableCell>{todo.dateEcheance}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutBadgeClass(todo.statut)}`}
                    >
                      {getStatutLabel(todo.statut)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => openDeleteConfirmation(todo)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
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
            Affichage de {todos.length} tâche(s) sur {pagination.totalItems} au
            total
          </div>
        </CardBody>
      </Card>

      {/* Modal d'ajout de tâche */}
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader>Ajouter une nouvelle tâche</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Titre"
                placeholder="Titre de la tâche"
                value={newTodo.titre}
                onChange={(e) =>
                  setNewTodo((prev) => ({ ...prev, titre: e.target.value }))
                }
              />
              <Input
                label="Date d'échéance"
                type="date"
                value={newTodo.dateEcheance}
                onChange={(e) =>
                  setNewTodo((prev) => ({
                    ...prev,
                    dateEcheance: e.target.value,
                  }))
                }
              />
              <Select
                label="État"
                selectedKeys={[newTodo.statut]}
                onSelectionChange={(keys) =>
                  setNewTodo((prev) => ({
                    ...prev,
                    statut: Array.from(keys)[0] as
                      | "a_faire"
                      | "en_cours"
                      | "terminee"
                      | "annulee",
                  }))
                }
              >
                <SelectItem key="a_faire">Pas commencé</SelectItem>
                <SelectItem key="en_cours">En cours</SelectItem>
                <SelectItem key="terminee">Validée</SelectItem>
                <SelectItem key="annulee">Annulée</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleAddTodo}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              Êtes-vous sûr de vouloir supprimer la tâche{" "}
              <strong>&quot;{todoToDelete?.titre}&quot;</strong> ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button color="danger" onPress={confirmDelete}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
