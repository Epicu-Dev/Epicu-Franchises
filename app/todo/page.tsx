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
  const [searchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
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

  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'titre':
        if (!value || !value.trim()) {
          errors.titre = 'Le titre est requis';
        } else {
          delete errors.titre;
        }
        break;
      case 'dateEcheance':
        if (!value) {
          errors.dateEcheance = 'La date d\'échéance est requise';
        } else {
          delete errors.dateEcheance;
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (todo: any) => {
    const fields = ['titre', 'dateEcheance'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, todo[field]);

      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleAddTodo = async () => {
    try {
      // Validation complète avant soumission
      if (!validateAllFields(newTodo)) {
        setError("Veuillez corriger les erreurs dans le formulaire");

        return;
      }

      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de l'ajout de la tâche");
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewTodo({
        titre: "",
        statut: "a_faire",
        dateEcheance: "",
      });
      setIsAddModalOpen(false);
      setError(null);
      setFieldErrors({});

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
    } catch {
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
        return "bg-green-50 text-green-700 border-green-200";
      case "en_cours":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "annulee":
        return "bg-red-50 text-red-700 border-red-200";
      case "a_faire":
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading && todos.length === 0) {
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
        <CardBody >
          {/* Header with filters */}
          <div className="flex justify-between items-center p-4">
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
                <SelectItem key="terminee">Validée</SelectItem>
              </Select>
            </div>

            <div className="relative">
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setError(null);
                  setFieldErrors({});
                  setIsAddModalOpen(true);
                }}
              >
                Ajouter une tâche
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table aria-label="Tableau des tâches" shadow="none">
            <TableHeader>
              <TableColumn>
                <Button
                  className="p-0 h-auto font-light"
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
                  className="p-0 h-auto font-light"
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
                  className="p-0 h-auto font-light"
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
              <TableColumn className="font-light text-sm">Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {todos.map((todo) => (
                <TableRow key={todo.id}>
                  <TableCell className="font-light">
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
                  <TableCell className="font-light">
                    {new Date(todo.dateEcheance).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-6 py-1 rounded text-xs font-medium  ${getStatutBadgeClass(todo.statut)}`}
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <Input
                isRequired
                errorMessage={fieldErrors.titre}
                isInvalid={!!fieldErrors.titre}
                label="Titre"
                placeholder="Titre de la tâche"
                value={newTodo.titre}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTodo((prev) => ({ ...prev, titre: value }));
                  validateField('titre', value);
                }}
              />
              <Input
                isRequired
                errorMessage={fieldErrors.dateEcheance}
                isInvalid={!!fieldErrors.dateEcheance}
                label="Date d'échéance"
                type="date"
                value={newTodo.dateEcheance}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTodo((prev) => ({
                    ...prev,
                    dateEcheance: value,
                  }));
                  validateField('dateEcheance', value);
                }}
              />
              <Select
                label="État"
                selectedKeys={[newTodo.statut]}
                onSelectionChange={(keys) =>
                  setNewTodo((prev) => ({
                    ...prev,
                    statut: Array.from(keys)[0] as
                      | "a_faire"
                      | "terminee"
                  }))
                }
              >
                <SelectItem key="a_faire">Pas commencé</SelectItem>
                <SelectItem key="terminee">Validée</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              isDisabled={Object.keys(fieldErrors).length > 0 || !newTodo.titre || !newTodo.dateEcheance}
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
