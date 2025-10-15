"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";

import { StyledSelect } from "./styled-select";

import { FormLabel } from "@/components";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useUser } from "@/contexts/user-context";

interface TodoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTodoAdded: () => void;
  onTodoEdited?: (todo: any) => void;
  selectedTodo?: any;
  isEditMode?: boolean;
}

export default function TodoModal({
  isOpen,
  onOpenChange,
  onTodoAdded,
  onTodoEdited,
  selectedTodo,
  isEditMode = false,
}: TodoModalProps) {
  const { authFetch } = useAuthFetch();
  const { userProfile } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isEditingTodo, setIsEditingTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    name: "",
    dueDate: new Date().toISOString(),
    status: "À faire",
  });

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && selectedTodo) {
        // Mode édition
        setNewTodo({
          name: selectedTodo.name || "",
          dueDate: selectedTodo.dueDate || "",
          status: selectedTodo.status || "À faire",
        });
      } else {
        // Mode ajout
        setNewTodo({
          name: "",
          dueDate: new Date().toISOString(),
          status: "À faire",
        });
      }
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, isEditMode, selectedTodo]);

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
      case 'status':
        if (!value) {
          errors.status = 'Le statut est requis';
        } else {
          delete errors.status;
        }

        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (todo: any) => {
    const fields = ['name', 'dueDate', 'status'];
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

      const payload: { [key: string]: any } = {
        'Nom de la tâche': newTodo.name,
        'Date de création': new Date().toISOString(),
        'Statut': newTodo.status,
        'Type de tâche': 'Client',
      };

      if (newTodo.dueDate) {
        payload["Date d'échéance"] = newTodo.dueDate;
      }

      // Ajouter l'ID de l'utilisateur comme collaborateur
      if (userProfile?.id) {
        payload['Collaborateur'] = [userProfile.id];
      }

      const response = await authFetch("/api/todo", {
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
        dueDate: new Date().toISOString(),
        status: "À faire",
      });
      setError(null);
      setFieldErrors({});
      onOpenChange(false);

      onTodoAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleEditTodo = async () => {
    if (!selectedTodo) return;

    try {
      setIsEditingTodo(true);
      setError(null);

      // Validation complète avant soumission
      if (!validateAllFields(newTodo)) {
        setError("Veuillez corriger les erreurs dans le formulaire");
        setIsEditingTodo(false);

        return;
      }

      const payload: { [key: string]: any } = {
        'Nom de la tâche': newTodo.name,
        'Statut': newTodo.status,
      };

      if (newTodo.dueDate) {
        payload["Date d'échéance"] = newTodo.dueDate;
      }

      // Ajouter l'ID de l'utilisateur comme collaborateur
      if (userProfile?.id) {
        payload['Collaborateur'] = [userProfile.id];
      }

      const response = await authFetch(`/api/todo?id=${selectedTodo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Erreur lors de la modification de la tâche");
      }

      // Fermer le modal et réinitialiser
      setError(null);
      setFieldErrors({});
      onOpenChange(false);

      if (onTodoEdited) {
        onTodoEdited(newTodo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsEditingTodo(false);
    }
  };

  const handleSave = () => {
    if (isEditMode) {
      handleEditTodo();
    } else {
      handleAddTodo();
    }
  };

  const handleCancel = () => {
    setNewTodo({
      name: "",
      dueDate: new Date().toISOString(),
      status: "À faire",
    });
    setFieldErrors({});
    setError(null);
    onOpenChange(false);
  };

  const isLoading = isAddingTodo || isEditingTodo;
  const isDisabled = Object.keys(fieldErrors).length > 0 || !newTodo.name || !newTodo.dueDate || !newTodo.status || isLoading;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="pb-20 md:pb-0">
      <ModalContent>
        <ModalHeader className="flex justify-center">
          {isEditMode ? "Modifier la tâche" : "Ajouter une nouvelle tâche"}
        </ModalHeader>
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
            <FormLabel htmlFor="name" isRequired={true}>
              Titre
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              id="name"
              errorMessage={fieldErrors.name}
              isInvalid={!!fieldErrors.name}
              isRequired
              placeholder="Titre de la tâche"
              value={newTodo.name}
              onChange={(e) => {
                const value = e.target.value;

                setNewTodo((prev) => ({ ...prev, name: value }));
                validateField('name', value);
              }}
            />

            <FormLabel htmlFor="dueDate" isRequired={true}>
              Date d&apos;échéance
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
                input: newTodo.dueDate ? "text-black" : "text-gray-300"
              }}
              id="dueDate"
              errorMessage={fieldErrors.dueDate}
              isInvalid={!!fieldErrors.dueDate}
              isRequired
              type="date"
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

            <FormLabel htmlFor="status" isRequired={true}>
              Statut
            </FormLabel>
            <StyledSelect
              id="status"
              errorMessage={fieldErrors.status}
              isInvalid={!!fieldErrors.status}
              isRequired
              selectedKeys={newTodo.status ? [newTodo.status] : []}
              onSelectionChange={(keys) => {
                const selectedStatus = Array.from(keys)[0] as string;

                setNewTodo((prev) => ({ ...prev, status: selectedStatus }));
                validateField('status', selectedStatus);
              }}
            >
              <SelectItem key="À faire">Pas commencé</SelectItem>
              <SelectItem key="Terminé">Terminé</SelectItem>
              <SelectItem key="En attente">En attente</SelectItem>
            </StyledSelect>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button
            className="flex-1 border-1"
            color='primary'
            isDisabled={isLoading}
            variant="bordered"
            onPress={handleCancel}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            color='primary'
            isDisabled={isDisabled}
            onPress={handleSave}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                {isEditMode ? "Modification en cours..." : "Ajout en cours..."}
              </div>
            ) : (
              isEditMode ? "Modifier" : "Ajouter"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}