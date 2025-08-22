"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Resource, ResourceCategory } from "../types/resource";

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Omit<Resource, "id" | "dateAdded">) => void;
  resource?: Resource;
  mode: "create" | "edit";
}

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
  });

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {mode === "create" ? "Ajouter un document" : "Modifier le document"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom du document*"
                placeholder="Nom du document"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                isRequired
                classNames={{
                  input: "bg-gray-50 rounded-lg",
                  inputWrapper: "bg-gray-50 rounded-lg"
                }}
              />
              
              <Textarea
                label="Commentaires*"
                placeholder="Description du document"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                isRequired
                minRows={3}
                classNames={{
                  input: "bg-gray-50 rounded-lg",
                  inputWrapper: "bg-gray-50 rounded-lg"
                }}
              />

              <Input
                label="Lien du document*"
                placeholder="url"
                value={formData.link}
                onChange={(e) => handleInputChange("link", e.target.value)}
                isRequired
                classNames={{
                  input: "bg-gray-50 rounded-lg",
                  inputWrapper: "bg-gray-50 rounded-lg"
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="bordered" 
              onPress={onClose}
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              type="submit"
              className="bg-gray-800 text-white hover:bg-gray-700"
            >
              {mode === "create" ? "Ajouter" : "Modifier"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
