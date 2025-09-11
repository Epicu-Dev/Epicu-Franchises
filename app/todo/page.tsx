"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { SelectItem } from "@heroui/select";

import { StyledSelect } from "@/components/styled-select";
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
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

import { TodoBadge } from "../../components/badges";
import { SortableColumnHeader } from "@/components";

import TodoModal from "@/components/todo-modal";
import { Todo } from "@/types/todo";




export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [itemsPerPage] = useState(50);
  const [searchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("");
  const [sortField, setSortField] = useState<string>("Date d'échéance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);
  const [isDeletingTodo, setIsDeletingTodo] = useState(false);

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



  const handleTodoAdded = () => {
    // Recharger les tâches
    fetchTodos();
  };

  const handleTodoEdited = () => {
    // Recharger les tâches
    fetchTodos();
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

  const openEditModal = (todo: Todo) => {
    setTodoToEdit(todo);
    setError(null);
    setIsEditModalOpen(true);
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
              <StyledSelect
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
                <SelectItem key="En attente">En attente</SelectItem>
              </StyledSelect>

            </div>

            <div className="relative">
              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setError(null);
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
                    <></>
                  </TableColumn>
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
                    État
                  </TableColumn>
                  <TableColumn className="font-light text-sm">Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {todos.map((todo) => (
                    <TableRow key={todo.id} className=" border-t border-gray-100  dark:border-gray-700">
                      <TableCell className="font-light py-5">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditModal(todo)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-light py-5">
                        <div className="flex items-center gap-2">
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
                        <div className="flex gap-2">

                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openDeleteConfirmation(todo)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>}

        </CardBody>
      </Card>

      {/* Modal d'ajout de tâche */}
      <TodoModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onTodoAdded={handleTodoAdded}
      />

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalContent>
          <ModalHeader className="flex justify-center">Confirmer la suppression</ModalHeader>
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

      {/* Modal d'édition de tâche */}
      <TodoModal
        isEditMode={true}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onTodoAdded={handleTodoAdded}
        onTodoEdited={handleTodoEdited}
        selectedTodo={todoToEdit}
      />
    </div>
  );
}
