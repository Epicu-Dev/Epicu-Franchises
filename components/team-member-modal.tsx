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

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  location: string;
  avatar?: string;
  category: "siege" | "franchise" | "prestataire";
  city: string;
  firstName: string;
  lastName: string;
  identifier: string;
  password: string;
  birthDate: string;
  personalEmail: string;
  franchiseEmail: string;
  phone: string;
  postalAddress: string;
  siret: string;
  dipSignatureDate: string;
  franchiseContractSignatureDate: string;
  trainingCertificateSignatureDate: string;
}

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
  editingMember?: TeamMember | null;
  isEditing?: boolean;
}

export function TeamMemberModal({
  isOpen,
  onClose,
  onMemberAdded,
  editingMember = null,
  isEditing = false
}: TeamMemberModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newMember, setNewMember] = useState<TeamMember>({
    name: "",
    role: "Collaborateur Siège",
    location: "Siège",
    avatar: "/api/placeholder/150/150",
    category: "siege",
    city: "",
    firstName: "",
    lastName: "",
    identifier: "",
    password: "",
    birthDate: "",
    personalEmail: "",
    franchiseEmail: "",
    phone: "",
    postalAddress: "",
    siret: "",
    dipSignatureDate: "",
    franchiseContractSignatureDate: "",
    trainingCertificateSignatureDate: "",
  });

  // Initialiser le formulaire avec les données du membre à éditer
  useEffect(() => {
    if (isEditing && editingMember) {
      setNewMember(editingMember);
    } else {
      // Réinitialiser le formulaire pour un nouvel ajout
      setNewMember({
        name: "",
        role: "Collaborateur Siège",
        location: "Siège",
        avatar: "/api/placeholder/150/150",
        category: "siege",
        city: "",
        firstName: "",
        lastName: "",
        identifier: "",
        password: "",
        birthDate: "",
        personalEmail: "",
        franchiseEmail: "",
        phone: "",
        postalAddress: "",
        siret: "",
        dipSignatureDate: "",
        franchiseContractSignatureDate: "",
        trainingCertificateSignatureDate: "",
      });
    }
    setError(null);
    setFieldErrors({});
  }, [isEditing, editingMember, isOpen]);

  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'firstName':
        if (!value || !value.trim()) {
          errors.firstName = 'Le prénom est requis';
        } else {
          delete errors.firstName;
        }
        break;
      case 'lastName':
        if (!value || !value.trim()) {
          errors.lastName = 'Le nom est requis';
        } else {
          delete errors.lastName;
        }
        break;
      case 'city':
        if (!value || !value.trim()) {
          errors.city = 'La ville est requise';
        } else {
          delete errors.city;
        }
        break;
      case 'phone':
        if (!value || !value.trim()) {
          errors.phone = 'Le téléphone est requis';
        } else {
          delete errors.phone;
        }
        break;
      case 'personalEmail':
        if (!value || !value.trim()) {
          errors.personalEmail = 'L\'email personnel est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.personalEmail = 'Format d\'email invalide';
        } else {
          delete errors.personalEmail;
        }
        break;
      case 'franchiseEmail':
        if (!value || !value.trim()) {
          errors.franchiseEmail = 'L\'email franchise est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.franchiseEmail = 'Format d\'email invalide';
        } else {
          delete errors.franchiseEmail;
        }
        break;
      case 'siret':
        if (!value || !value.trim()) {
          errors.siret = 'Le SIRET est requis';
        } else if (value.length !== 14) {
          errors.siret = 'Le SIRET doit contenir 14 chiffres';
        } else {
          delete errors.siret;
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (member: any) => {
    const fields = ['firstName', 'lastName', 'city', 'phone', 'personalEmail', 'franchiseEmail', 'siret'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, member[field]);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleCategoryChange = (category: string) => {
    let role = "Collaborateur Siège";
    let location = "Siège";

    if (category === "franchise") {
      role = "Franchisé";
      location = newMember.city || "Ville non définie";
    } else if (category === "prestataire") {
      role = "Prestataire";
      location = newMember.city || "Ville non définie";
    }

    setNewMember(prev => ({
      ...prev,
      category: category as "siege" | "franchise" | "prestataire",
      role,
      location
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validation complète avant soumission
      if (!validateAllFields(newMember)) {
        setError("Veuillez corriger les erreurs dans le formulaire");
        setIsLoading(false);
        return;
      }

      // Générer l'identifiant automatiquement si vide
      if (!newMember.identifier) {
        const identifier = `${newMember.firstName.toLowerCase().charAt(0)}.${newMember.lastName.toLowerCase()}`;
        setNewMember(prev => ({ ...prev, identifier }));
      }

      // Générer le mot de passe automatiquement si vide
      if (!newMember.password) {
        const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setNewMember(prev => ({ ...prev, password }));
      }

      // Générer l'email franchise si vide
      if (!newMember.franchiseEmail) {
        const franchiseEmail = `${newMember.city.toLowerCase().replace(/\s+/g, '-')}@epicu.fr`;
        setNewMember(prev => ({ ...prev, franchiseEmail }));
      }

      // Ici vous pouvez ajouter l'appel API pour sauvegarder le membre
      // Pour l'instant, on simule une sauvegarde réussie
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Réinitialiser le formulaire et fermer le modal
      setNewMember({
        name: "",
        role: "Collaborateur Siège",
        location: "Siège",
        avatar: "/api/placeholder/150/150",
        category: "siege",
        city: "",
        firstName: "",
        lastName: "",
        identifier: "",
        password: "",
        birthDate: "",
        personalEmail: "",
        franchiseEmail: "",
        phone: "",
        postalAddress: "",
        siret: "",
        dipSignatureDate: "",
        franchiseContractSignatureDate: "",
        trainingCertificateSignatureDate: "",
      });
      setError(null);
      setFieldErrors({});
      setIsLoading(false);
      onClose();
      onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFieldErrors({});
    setNewMember({
      name: "",
      role: "Collaborateur Siège",
      location: "Siège",
      avatar: "/api/placeholder/150/150",
      category: "siege",
      city: "",
      firstName: "",
      lastName: "",
      identifier: "",
      password: "",
      birthDate: "",
      personalEmail: "",
      franchiseEmail: "",
      phone: "",
      postalAddress: "",
      siret: "",
      dipSignatureDate: "",
      franchiseContractSignatureDate: "",
      trainingCertificateSignatureDate: "",
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
        <ModalHeader className="flex justify-center">
          {isEditing ? 'Modifier le membre' : 'Ajouter un nouveau membre'}
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <FormLabel htmlFor="firstName" isRequired={true}>
              Prénom
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.firstName}
              id="firstName"
              isInvalid={!!fieldErrors.firstName}
              placeholder="Prénom"
              value={newMember.firstName}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({
                  ...prev,
                  firstName: value,
                  name: `${value} ${prev.lastName}`.trim()
                }));
                validateField('firstName', value);
              }}
            />

            <FormLabel htmlFor="lastName" isRequired={true}>
              Nom
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.lastName}
              id="lastName"
              isInvalid={!!fieldErrors.lastName}
              placeholder="Nom"
              value={newMember.lastName}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({
                  ...prev,
                  lastName: value,
                  name: `${prev.firstName} ${value}`.trim()
                }));
                validateField('lastName', value);
              }}
            />

            <FormLabel htmlFor="city" isRequired={true}>
              Ville
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.city}
              id="city"
              isInvalid={!!fieldErrors.city}
              placeholder="Ville"
              value={newMember.city}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({
                  ...prev,
                  city: value,
                  location: prev.category === "siege" ? "Siège" : value
                }));
                validateField('city', value);
              }}
            />

            <FormLabel htmlFor="category" isRequired={true}>
              Catégorie
            </FormLabel>
            <StyledSelect
              isRequired
              id="category"
              selectedKeys={[newMember.category]}
              onSelectionChange={(keys) => {
                const category = Array.from(keys)[0] as string;
                handleCategoryChange(category);
              }}
            >
              <SelectItem key="siege">Siège</SelectItem>
              <SelectItem key="franchise">Franchisé</SelectItem>
              <SelectItem key="prestataire">Prestataire</SelectItem>
            </StyledSelect>

            <FormLabel htmlFor="phone" isRequired={true}>
              Téléphone
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.phone}
              id="phone"
              isInvalid={!!fieldErrors.phone}
              placeholder="01 23 45 67 89"
              value={newMember.phone}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({ ...prev, phone: value }));
                validateField('phone', value);
              }}
            />

            <FormLabel htmlFor="siret" isRequired={true}>
              SIRET
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.siret}
              id="siret"
              isInvalid={!!fieldErrors.siret}
              placeholder="12345678901234"
              value={newMember.siret}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({ ...prev, siret: value }));
                validateField('siret', value);
              }}
            />

            <FormLabel htmlFor="personalEmail" isRequired={true}>
              Email personnel
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.personalEmail}
              id="personalEmail"
              isInvalid={!!fieldErrors.personalEmail}
              placeholder="prenom.nom@gmail.com"
              type="email"
              value={newMember.personalEmail}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({ ...prev, personalEmail: value }));
                validateField('personalEmail', value);
              }}
            />

            <FormLabel htmlFor="franchiseEmail" isRequired={true}>
              Email franchise
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.franchiseEmail}
              id="franchiseEmail"
              isInvalid={!!fieldErrors.franchiseEmail}
              placeholder="ville@epicu.fr"
              type="email"
              value={newMember.franchiseEmail}
              onChange={(e) => {
                const value = e.target.value;
                setNewMember((prev) => ({ ...prev, franchiseEmail: value }));
                validateField('franchiseEmail', value);
              }}
            />

            <FormLabel htmlFor="birthDate" isRequired={false}>
              Date de naissance
            </FormLabel>
            <Input
              id="birthDate"
              type="date"
              value={newMember.birthDate}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, birthDate: e.target.value }));
              }}
            />

            <FormLabel htmlFor="identifier" isRequired={false}>
              Identifiant
            </FormLabel>
            <Input
              id="identifier"
              placeholder="p.nom"
              value={newMember.identifier}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, identifier: e.target.value }));
              }}
            />

            <FormLabel htmlFor="dipSignatureDate" isRequired={false}>
              Date signature DIP
            </FormLabel>
            <Input
              id="dipSignatureDate"
              type="date"
              value={newMember.dipSignatureDate}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, dipSignatureDate: e.target.value }));
              }}
            />

            <FormLabel htmlFor="franchiseContractSignatureDate" isRequired={false}>
              Date signature contrat
            </FormLabel>
            <Input
              id="franchiseContractSignatureDate"
              type="date"
              value={newMember.franchiseContractSignatureDate}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, franchiseContractSignatureDate: e.target.value }));
              }}
            />

            <FormLabel htmlFor="trainingCertificateSignatureDate" isRequired={false}>
              Date signature formation
            </FormLabel>
            <Input
              id="trainingCertificateSignatureDate"
              type="date"
              value={newMember.trainingCertificateSignatureDate}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, trainingCertificateSignatureDate: e.target.value }));
              }}
            />

            <FormLabel htmlFor="password" isRequired={false}>
              Mot de passe
            </FormLabel>
            <Input
              id="password"
              placeholder="Généré automatiquement"
              value={newMember.password}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, password: e.target.value }));
              }}
            />

            <FormLabel htmlFor="postalAddress" isRequired={false}>
              Adresse postale
            </FormLabel>
            <Textarea
              id="postalAddress"
              placeholder="123 Rue de l'établissement, 75001 Ville"
              value={newMember.postalAddress}
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, postalAddress: e.target.value }));
              }}
            />
          </div>
        </ModalBody>
        <ModalFooter className="flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center w-full">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 w-full">
            <Button
              className="flex-1 border-1"
              color='primary'
              isDisabled={isLoading}
              variant="bordered"
              onPress={handleClose}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isDisabled={isLoading || Object.keys(fieldErrors).length > 0 || !newMember.firstName || !newMember.lastName || !newMember.city || !newMember.phone || !newMember.personalEmail || !newMember.franchiseEmail || !newMember.siret}
              isLoading={isLoading}
              onPress={handleSubmit}
            >
              {isLoading ? 'Chargement...' : (isEditing ? 'Modifier' : 'Ajouter')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
