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

import { TodoBadge } from "../../components/badges";

import { FormLabel, SortableColumnHeader } from "@/components";

interface Todo {
  id: string;
  name: string;              // Nom de la tâche
  createdAt: string;         // Date de création (ISO)
  dueDate?: string;          // Date d'échéance (ISO | '')
  status: string;            // Statut
  type: string;              // Type de tâche
  description?: string;      // Description
  collaborators?: string[];  // Linked ids
}



export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [itemsPerPage] = useState(50);
  const [searchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isDeletingTodo, setIsDeletingTodo] = useState(false);

  const [newTodo, setNewTodo] = useState({
    name: "",
    dueDate: "",
  });

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: '0',
      });

      if (searchTerm) params.set('q', searchTerm);
      if (selectedStatut && selectedStatut !== 'tous') params.set('status', selectedStatut);
      
      // Ajouter les paramètres de tri
      if (sortField) {
        params.set('orderBy', sortField);
        params.set('order', sortDirection);
      }

      const response = await fetch(`/api/todo?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tâches");
      }

      const data = await response.json();

      setTodos(data.todos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [
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
      case 'name':
        if (!value || !value.trim()) {
          errors.name = 'Le nom de la tâche est requis';
        } else {
          delete errors.name;
        }
        break;
      case 'dueDate':
        if (!value) {
          errors.dueDate = 'La date d\'échéance est requise';
        } else {
          delete errors.dueDate;
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (todo: any) => {
    const fields = ['name', 'dueDate'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, todo[field]);

      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleAddTodo = async () => {
    try {
      setIsAddingTodo(true);
      setError(null);

      // Validation complète avant soumission
      if (!validateAllFields(newTodo)) {
        setError("Veuillez corriger les erreurs dans le formulaire");
        setIsAddingTodo(false);

        return;
      }

      const payload: { [key: string]: string } = {
        'Nom de la tâche': newTodo.name,
        'Date de création': new Date().toISOString(),
        'Statut': 'À faire',
        'Type de tâche': 'Client',
      };

      if (newTodo.dueDate) {
        payload["Date d'échéance"] = newTodo.dueDate;
      }

      const response = await fetch("/api/todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de l'ajout de la tâche");
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewTodo({
        name: "",
        dueDate: "",
      });
      setIsAddModalOpen(false);
      setError(null);
      setFieldErrors({});

      // Recharger les tâches
      fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      setIsDeletingTodo(true);
      setError(null);

      const response = await fetch(`/api/todo?id=${todoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la tâche");
      }

      // Recharger les tâches
      fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsDeletingTodo(false);
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
    } finally {
      setIsDeletingTodo(false);
    }
  };

  const handleStatusChange = async (
    todoId: string,
    newStatus: string
  ) => {
    try {
      // Optimistic update - mettre à jour l'état local immédiatement
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoId ? { ...todo, status: newStatus } : todo
        )
      );

      const response = await fetch(`/api/todo?id=${todoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Statut: newStatus }),
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
              status: todo.status === "Terminé" ? "À faire" : "Terminé",
            }
            : todo
        )
      );
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
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
                <SelectItem key="À faire">Pas commencé</SelectItem>
                <SelectItem key="Terminé">Terminé</SelectItem>
              </Select>

            </div>

            <div className="relative">
              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
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
          {
            loading ?
              <div className="flex justify-center items-center h-64">
                <Spinner className="text-black dark:text-white" size="lg" />
              </div>
              :
              <Table aria-label="Tableau des tâches" shadow="none">
                <TableHeader>
                  <TableColumn className="font-light text-sm">

                    Tâches
                  </TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="Date d'échéance"
                      label="Deadline"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />

                  </TableColumn>
                  <TableColumn className="font-light text-sm">
                    <SortableColumnHeader
                      field="Statut"
                      label="État"
                      sortDirection={sortDirection}
                      sortField={sortField}
                      onSort={handleSort}
                    />

                  </TableColumn>
                  <TableColumn className="font-light text-sm">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {todos.map((todo) => (
                    <TableRow key={todo.id} className=" border-t border-gray-100  dark:border-gray-700">
                      <TableCell className="font-light py-5">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            className="text-black"
                            isDisabled={todo.status === "Annulée"}
                            isSelected={todo.status === "Terminé"}
                            onValueChange={(checked) => {
                              const newStatus = checked ? "Terminé" : "À faire";

                              handleStatusChange(todo.id, newStatus);
                            }}
                          />
                          <span>{todo.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-light">
                        {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, '.') : '-'}
                      </TableCell>
                      <TableCell>
                        <TodoBadge status={todo.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
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
              </Table>}

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

              <FormLabel
                htmlFor="name"
                isRequired={true}
              >
                Titre
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors.name}
                id="name"
                isInvalid={!!fieldErrors.name}
                placeholder="Titre de la tâche"
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                value={newTodo.name}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTodo((prev) => ({ ...prev, name: value }));
                  validateField('name', value);
                }}
              />

              <FormLabel
                htmlFor="dueDate"
                isRequired={true}
              >
                Date d&apos;échéance
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors.dueDate}
                id="dueDate"
                isInvalid={!!fieldErrors.dueDate}
                type="date"
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                value={newTodo.dueDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTodo((prev) => ({
                    ...prev,
                    dueDate: value,
                  }));
                  validateField('dueDate', value);
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button className="flex-1 border-1"
              color='primary'
              isDisabled={isAddingTodo}
              variant="bordered"
              onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isDisabled={Object.keys(fieldErrors).length > 0 || !newTodo.name || !newTodo.dueDate || isAddingTodo}
              onPress={handleAddTodo}
            >
              {isAddingTodo ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Ajout en cours...
                </div>
              ) : (
                "Ajouter"
              )}
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
              <strong>&quot;{todoToDelete?.name}&quot;</strong> ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button className="flex-1 border-1"
              color='primary'
              isDisabled={isDeletingTodo}
              variant="bordered"
              onPress={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              color="danger"
              isDisabled={isDeletingTodo}
              onPress={confirmDelete}>
              {isDeletingTodo ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Suppression...
                </div>
              ) : (
                "Supprimer"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
