"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { StyledSelect } from "./styled-select";
import { FormLabel } from "./form-label";

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

export function PrestationModal({ isOpen, onClose, onPrestationRequested }: PrestationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [prestationRequest, setPrestationRequest] = useState<PrestationRequest>({
    nom: "",
    etablissement: "",
    email: "",
    telephone: "",
    ville: "",
    instagram: "",
    typePrestation: "",
    budget: "",
    description: ""
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
        if (!value || !value.trim() || value.trim() === '') {
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
        nom: "",
        etablissement: "",
        email: "",
        telephone: "",
        ville: "",
        instagram: "",
        typePrestation: "",
        budget: "",
        description: ""
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
      nom: "",
      etablissement: "",
      email: "",
      telephone: "",
      ville: "",
      instagram: "",
      typePrestation: "",
      budget: "",
      description: ""
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      className="pb-20 md:pb-0"
      onOpenChange={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-center">Demander une prestation</ModalHeader>
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

            <FormLabel
              htmlFor="nom"
              isRequired={true}
            >
              Nom / Prénom
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.nom}
              id="nom"
              isInvalid={!!fieldErrors.nom}
              placeholder="Nom et prénom"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel
              htmlFor="etablissement"
              isRequired={true}
            >
              Nom de l&apos;établissement
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.etablissement}
              id="etablissement"
              isInvalid={!!fieldErrors.etablissement}
              placeholder="Nom de l&apos;établissement"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel
              htmlFor="email"
              isRequired={true}
            >
              Adresse mail
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.email}
              id="email"
              isInvalid={!!fieldErrors.email}
              placeholder="email@exemple.com"
              type="email"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel
              htmlFor="telephone"
              isRequired={true}
            >
              Numéro de téléphone
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.telephone}
              id="telephone"
              isInvalid={!!fieldErrors.telephone}
              placeholder="06 00 00 00 00"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel
              htmlFor="ville"
              isRequired={true}
            >
              Ville
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.ville}
              id="ville"
              isInvalid={!!fieldErrors.ville}
              placeholder="Ville"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel
              htmlFor="instagram"
              isRequired={true}
            >
              Instagram
            </FormLabel>
            <Input
              id="instagram"
              placeholder="URL Instagram"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              value={prestationRequest.instagram}
              onChange={(e) =>
                setPrestationRequest((prev) => ({
                  ...prev,
                  instagram: e.target.value,
                }))
              }
            />

            <FormLabel
              htmlFor="typePrestation"
              isRequired={true}
            >
              Type de prestation
            </FormLabel>
            <StyledSelect
              isRequired
              errorMessage={fieldErrors.typePrestation}
              id="typePrestation"
              isInvalid={!!fieldErrors.typePrestation}
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

            <FormLabel
              htmlFor="budget"
              isRequired={true}
            >
              Budget client estimé
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.budget}
              id="budget"
              isInvalid={!!fieldErrors.budget}
              placeholder="1500€"
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel
              htmlFor="description"
              isRequired={true}
            >
              Description de la demande
            </FormLabel>
            <Textarea
              isRequired
              errorMessage={fieldErrors.description}
              id="description"
              isInvalid={!!fieldErrors.description}
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
          <Button
            color='primary'

            className="flex-1 border border-1"
            variant="bordered"
            onPress={handleClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            color='primary'
            isDisabled={Object.keys(fieldErrors).length > 0}
            onPress={handleSubmit}
          >
            Envoyer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
