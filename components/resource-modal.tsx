"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import { Resource, ResourceCategory } from "../types/resource";

import { FormLabel } from "./form-label";

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Omit<Resource, "id" | "dateAdded">) => void;
  resource?: Resource;
  mode: "create" | "edit";
  currentCategory?: ResourceCategory;
}

export default function ResourceModal({
  isOpen,
  onClose,
  onSave,
  resource,
  mode,
  currentCategory
}: ResourceModalProps) {
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    link: resource?.link || "",
    category: resource?.category || currentCategory || "liens-importants" as ResourceCategory,
    icon: resource?.icon || "",
  });

  // Options pour le dropdown des catégories
  const categoryOptions = [
    { key: "liens-importants", label: "Liens importants" },
    { key: "ressources-canva", label: "Ressources Canva" },
    { key: "materiel", label: "Matériel" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value as ResourceCategory
    }));
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex justify-center">
            {mode === "create" ? "Ajouter un document" : "Modifier le document"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <FormLabel htmlFor="category" isRequired={true}>
                Type de ressource
              </FormLabel>
              <Select
                isRequired
                classNames={{
                  trigger: "bg-page-bg",
                }}
                id="category"
                placeholder="Sélectionner un type"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleCategoryChange(selectedKey);
                }}
              >
                {categoryOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              <FormLabel htmlFor="title" isRequired={true}>
                Nom du document
              </FormLabel>
              <Input
                isRequired
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                id="title"
                placeholder="Nom du document"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
              <FormLabel htmlFor="comment" isRequired={true}>
                Commentaires
              </FormLabel>
              <Textarea
                isRequired
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                id="comment"
                minRows={3}
                placeholder="Commentaires"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />

              <FormLabel htmlFor="link" isRequired={true}>
                Lien du document
              </FormLabel>
              <Input
                isRequired
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                id="link"
                placeholder="url"
                value={formData.link}
                onChange={(e) => handleInputChange("link", e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button
              className="flex-1 border-1"
              color='primary'
              variant="bordered"
              onPress={onClose}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-900 flex-1"
              color="primary"
              type="submit"
            >
              {mode === "create" ? "Ajouter" : "Modifier"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
