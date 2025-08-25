"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { StyledSelect } from "./styled-select";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface PrestationRequest {
  nom: string;
  etablissement: string;
  email: string;
  telephone: string;
  ville: string;
  instagram: string;
  typePrestation: string;
  budget: string;
  description: string;
}

interface PrestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrestationRequested: () => void;
  services: Service[];
}

export function PrestationModal({ isOpen, onClose, onPrestationRequested, services }: PrestationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [prestationRequest, setPrestationRequest] = useState<PrestationRequest>({
    nom: "Dominique Dupont",
    etablissement: "Le concept",
    email: "dominique.dupont@leconcept.com",
    telephone: "06 00 00 00 00",
    ville: "Nantes",
    instagram: "url",
    typePrestation: "Graphisme",
    budget: "1500€",
    description: "-"
  });

  // Validation initiale au chargement
  useEffect(() => {
    if (isOpen) {
      // Valider tous les champs au chargement pour afficher les erreurs initiales
      validateField('nom', prestationRequest.nom);
      validateField('etablissement', prestationRequest.etablissement);
      validateField('email', prestationRequest.email);
      validateField('telephone', prestationRequest.telephone);
      validateField('ville', prestationRequest.ville);
      validateField('typePrestation', prestationRequest.typePrestation);
      validateField('budget', prestationRequest.budget);
      validateField('description', prestationRequest.description);
    }
  }, [isOpen]);

  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'nom':
        if (!value || !value.trim() || value.trim() === '') {
          errors.nom = 'Le nom est requis';
        } else {
          delete errors.nom;
        }
        break;
      case 'etablissement':
        if (!value || !value.trim() || value.trim() === '') {
          errors.etablissement = 'Le nom de l\'établissement est requis';
        } else {
          delete errors.etablissement;
        }
        break;
      case 'email':
        if (!value || !value.trim() || value.trim() === '') {
          errors.email = 'L\'email est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'L\'email n\'est pas valide';
        } else {
          delete errors.email;
        }
        break;
      case 'telephone':
        if (!value || !value.trim() || value.trim() === '') {
          errors.telephone = 'Le téléphone est requis';
        } else {
          delete errors.telephone;
        }
        break;
      case 'ville':
        if (!value || !value.trim() || value.trim() === '') {
          errors.ville = 'La ville est requise';
        } else {
          delete errors.ville;
        }
        break;
      case 'typePrestation':
        if (!value || !value.trim() || value.trim() === '') {
          errors.typePrestation = 'Le type de prestation est requis';
        } else {
          delete errors.typePrestation;
        }
        break;
      case 'budget':
        if (!value || !value.trim() || value.trim() === '') {
          errors.budget = 'Le budget est requis';
        } else {
          delete errors.budget;
        }
        break;
      case 'description':
        if (!value || !value.trim() || value.trim() === '' || value.trim() === '-') {
          errors.description = 'La description est requise';
        } else {
          delete errors.description;
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (request: PrestationRequest) => {
    const fields = ['nom', 'etablissement', 'email', 'telephone', 'ville', 'typePrestation', 'budget', 'description'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, request[field as keyof PrestationRequest]);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleSubmit = async () => {
    try {
      // Validation complète avant soumission
      if (!validateAllFields(prestationRequest)) {
        setError("Veuillez corriger les erreurs dans le formulaire");
        return;
      }

      // Réinitialiser le formulaire et fermer le modal
      setPrestationRequest({
        nom: "Dominique Dupont",
        etablissement: "Le concept",
        email: "dominique.dupont@leconcept.com",
        telephone: "06 00 00 00 00",
        ville: "Nantes",
        instagram: "url",
        typePrestation: "Graphisme",
        budget: "1500€",
        description: "-"
      });
      setError(null);
      setFieldErrors({});
      onClose();
      onPrestationRequested();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleClose = () => {
    setError(null);
    setFieldErrors({});
    setPrestationRequest({
      nom: "Dominique Dupont",
      etablissement: "Le concept",
      email: "dominique.dupont@leconcept.com",
      telephone: "06 00 00 00 00",
      ville: "Nantes",
      instagram: "url",
      typePrestation: "Graphisme",
      budget: "1500€",
      description: "-"
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={handleClose}
    >
      <ModalContent>
        <ModalHeader>Nouvelle demande du studio ! 🚀</ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
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
              errorMessage={fieldErrors.nom}
              isInvalid={!!fieldErrors.nom}
              label="Nom / Prénom"
              placeholder="Nom et prénom"
              value={prestationRequest.nom}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  nom: value,
                }));
                validateField('nom', value);
              }}
            />
            <Input
              isRequired
              errorMessage={fieldErrors.etablissement}
              isInvalid={!!fieldErrors.etablissement}
              label="Nom de l'établissement"
              placeholder="Nom de l'établissement"
              value={prestationRequest.etablissement}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  etablissement: value,
                }));
                validateField('etablissement', value);
              }}
            />
            <Input
              isRequired
              errorMessage={fieldErrors.email}
              isInvalid={!!fieldErrors.email}
              label="Adresse mail"
              type="email"
              placeholder="email@exemple.com"
              value={prestationRequest.email}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  email: value,
                }));
                validateField('email', value);
              }}
            />
            <Input
              isRequired
              errorMessage={fieldErrors.telephone}
              isInvalid={!!fieldErrors.telephone}
              label="Numéro de téléphone"
              placeholder="06 00 00 00 00"
              value={prestationRequest.telephone}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  telephone: value,
                }));
                validateField('telephone', value);
              }}
            />
            <Input
              isRequired
              errorMessage={fieldErrors.ville}
              isInvalid={!!fieldErrors.ville}
              label="Ville"
              placeholder="Ville"
              value={prestationRequest.ville}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  ville: value,
                }));
                validateField('ville', value);
              }}
            />
            <Input
              label="Instagram"
              placeholder="URL Instagram"
              value={prestationRequest.instagram}
              onChange={(e) =>
                setPrestationRequest((prev) => ({
                  ...prev,
                  instagram: e.target.value,
                }))
              }
            />
            <StyledSelect
              isRequired
              errorMessage={fieldErrors.typePrestation}
              isInvalid={!!fieldErrors.typePrestation}
              label="Type de prestation"
              selectedKeys={[prestationRequest.typePrestation]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setPrestationRequest((prev) => ({
                  ...prev,
                  typePrestation: selected,
                }));
                validateField('typePrestation', selected);
              }}
            >
              <SelectItem key="Graphisme">Graphisme</SelectItem>
              <SelectItem key="Motion Design">Motion Design</SelectItem>
              <SelectItem key="Photos / Vidéos">Photos / Vidéos</SelectItem>
              <SelectItem key="Dev web">Dev web</SelectItem>
              <SelectItem key="Référencement SEO">Référencement SEO</SelectItem>
              <SelectItem key="CM">CM</SelectItem>
              <SelectItem key="Data analyse">Data analyse</SelectItem>
              <SelectItem key="Sérigraphie et textiles">Sérigraphie et textiles</SelectItem>
            </StyledSelect>
            <Input
              isRequired
              errorMessage={fieldErrors.budget}
              isInvalid={!!fieldErrors.budget}
              label="Budget client estimé"
              placeholder="1500€"
              value={prestationRequest.budget}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  budget: value,
                }));
                validateField('budget', value);
              }}
            />
            <Textarea
              isRequired
              errorMessage={fieldErrors.description}
              isInvalid={!!fieldErrors.description}
              label="Description de la demande"
              placeholder="Décrivez votre demande..."
              value={prestationRequest.description}
              onChange={(e) => {
                const value = e.target.value;
                setPrestationRequest((prev) => ({
                  ...prev,
                  description: value,
                }));
                validateField('description', value);
              }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Annuler
          </Button>
          <Button
            className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            isDisabled={Object.keys(fieldErrors).length > 0}
            onPress={handleSubmit}
          >
            Envoyer la demande
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
