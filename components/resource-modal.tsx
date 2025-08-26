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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {mode === "create" ? "Ajouter un document" : "Modifier le document"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <FormLabel htmlFor="title" isRequired={true}>
                Nom du document
              </FormLabel>
              <Input
                id="title"
                placeholder="Nom du document"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                isRequired
                classNames={{
                  input: "bg-gray-50 rounded-lg",
                  inputWrapper: "bg-gray-50 rounded-lg"
                }}
              />
              <FormLabel htmlFor="comment" isRequired={true}>
                Commentaires
              </FormLabel>
              <Textarea
                id="comment"
                placeholder="Commentaires"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                isRequired
                minRows={3}
                classNames={{
                  input: "bg-gray-50 rounded-lg",
                  inputWrapper: "bg-gray-50 rounded-lg"
                }}
              />

              <FormLabel htmlFor="link" isRequired={true}>
                Lien du document
              </FormLabel>
              <Input
                id="link"
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
          <ModalFooter className="flex justify-end gap-2">
            <Button
              variant="bordered"
              onPress={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              color="primary"
              type="submit"
              className="bg-black text-white hover:bg-gray-900 flex-1"
            >
              {mode === "create" ? "Ajouter" : "Modifier"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
