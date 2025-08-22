"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Resource, ResourceCategory } from "../types/resource";

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Omit<Resource, "id" | "dateAdded">) => void;
  resource?: Resource;
  mode: "create" | "edit";
}

const categoryOptions = [
  { key: "liens-importants", label: "Liens importants" },
  { key: "bibliotheque", label: "Bibliothèque" },
  { key: "ressources-canva", label: "Ressources Canva" },
  { key: "materiel", label: "Matériel" },
];

export default function ResourceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  resource, 
  mode 
}: ResourceModalProps) {
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    link: resource?.link || "",
    category: resource?.category || "liens-importants" as ResourceCategory,
    icon: resource?.icon || "",
    tags: resource?.tags || [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {mode === "create" ? "Ajouter une ressource" : "Modifier la ressource"}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Titre"
                placeholder="Titre de la ressource"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                isRequired
              />
              
              <Select
                label="Catégorie"
                selectedKeys={[formData.category]}
                onChange={(e) => handleInputChange("category", e.target.value)}
                isRequired
              >
                {categoryOptions.map((category) => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="Lien"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => handleInputChange("link", e.target.value)}
                isRequired
                className="md:col-span-2"
              />

              <Textarea
                label="Description"
                placeholder="Description de la ressource"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                isRequired
                className="md:col-span-2"
                minRows={3}
              />

              <Input
                label="Icône"
                placeholder="Nom de l'icône (optionnel)"
                value={formData.icon}
                onChange={(e) => handleInputChange("icon", e.target.value)}
                className="md:col-span-2"
              />

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeTag(tag)}
                      variant="flat"
                      color="primary"
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="flat"
                    onPress={addTag}
                    startContent={<PlusIcon className="h-4 w-4" />}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Annuler
            </Button>
            <Button color="primary" type="submit">
              {mode === "create" ? "Créer" : "Modifier"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
