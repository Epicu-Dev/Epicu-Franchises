"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";

import { Resource, ResourceCategory } from "../types/resource";

import { FormLabel } from "./form-label";

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
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex justify-center">
            {mode === "create" ? "Ajouter un document" : "Modifier le document"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
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
