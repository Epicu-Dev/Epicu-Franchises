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

import { Collaborator } from "../types/collaborator";
import { useAuthFetch } from "../hooks/use-auth-fetch";

import { StyledSelect } from "./styled-select";
import { FormLabel } from "./form-label";

interface City {
  id: string;
  ville: string;
}

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: (member?: Collaborator) => void;
  editingMember?: Collaborator | null;
  isEditing?: boolean;
}

export function TeamMemberModal({
  isOpen,
  onClose,
  onMemberAdded,
  editingMember = null,
  isEditing = false
}: TeamMemberModalProps) {
  const { authFetch } = useAuthFetch();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [newMember, setNewMember] = useState<Partial<Collaborator>>({
    nom: "",
    prenom: "",
    role: "Franchisé",
    villeEpicu: [],
    emailEpicu: "",
    emailPerso: "",
    etablissements: [],
    trombi: null,
    dateNaissance: null,
    telephone: null,
    adresse: null,
    siret: null,
    dateDIP: null,
    dateSignatureContrat: null,
    dateSignatureAttestation: null,
  });

  // Récupérer les villes Epicu
  const fetchCities = async () => {
    try {
      const response = await authFetch('/api/villes?limit=100');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des villes');
      }

      const data = await response.json();

      setCities(data.results || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la récupération des villes:', error);
    }
  };

  // Initialiser le formulaire avec les données du membre à éditer
  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }

    if (isEditing && editingMember) {
      setNewMember(editingMember);
    } else {
      // Réinitialiser le formulaire pour un nouvel ajout
      setNewMember({
        nom: "",
        prenom: "",
        role: "Franchisé",
        villeEpicu: [],
        emailEpicu: "",
        emailPerso: "",
        etablissements: [],
        trombi: null,
        dateNaissance: null,
        telephone: null,
        adresse: null,
        siret: null,
        dateDIP: null,
        dateSignatureContrat: null,
        dateSignatureAttestation: null,
      });
      setSelectedCityId("");
    }
    setError(null);
    setFieldErrors({});
  }, [isEditing, editingMember, isOpen]);

  // Effet séparé pour gérer la sélection de la ville après le chargement des villes
  useEffect(() => {
    if (isEditing && editingMember && cities.length > 0) {
      // Si le membre a des villes Epicu, sélectionner la première
      if (editingMember.villeEpicu && editingMember.villeEpicu.length > 0) {
        // Trouver l'ID de la ville à partir de son nom
        const villeName = editingMember.villeEpicu[0];
        const city = cities.find(c => c.ville === villeName);

        if (city) {
          setSelectedCityId(city.id);
        }
      }
    }
  }, [cities, isEditing, editingMember]);

  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'prenom':
        if (!value || !value.trim()) {
          errors.prenom = 'Le prénom est requis';
        } else {
          delete errors.prenom;
        }
        break;
      case 'nom':
        if (!value || !value.trim()) {
          errors.nom = 'Le nom est requis';
        } else {
          delete errors.nom;
        }
        break;
      case 'villeEpicu':
        if (!value || value.length === 0) {
          errors.villeEpicu = 'La ville Epicu est requise';
        } else {
          delete errors.villeEpicu;
        }
        break;
      case 'telephone':
        if (!value || !value.trim()) {
          errors.telephone = 'Le téléphone est requis';
        } else {
          delete errors.telephone;
        }
        break;
      case 'emailPerso':
        if (!value || !value.trim()) {
          errors.emailPerso = 'L\'email personnel est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.emailPerso = 'Format d\'email invalide';
        } else {
          delete errors.emailPerso;
        }
        break;
      case 'emailEpicu':
        if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.emailEpicu = 'Format d\'email invalide';
        } else {
          delete errors.emailEpicu;
        }
        break;
      case 'siret':
        // Le SIRET n'est pas requis pour le rôle Siège
        if (newMember.role === "Siège") {
          delete errors.siret;
        } else if (!value || !value.trim()) {
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
    // Champs de base toujours requis
    const baseFields = ['prenom', 'nom', 'villeEpicu', 'telephone', 'emailPerso'];
    
    // Ajouter le SIRET seulement si le rôle n'est pas "Siège"
    const fields = member.role === "Siège" ? baseFields : [...baseFields, 'siret'];
    
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, member[field]);

      if (!fieldValid) isValid = false;
    });

    return isValid;
  };


  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mettre à jour les villes Epicu avec la ville sélectionnée
      const memberWithCity = {
        ...newMember,
        villeEpicu: selectedCityId ? [selectedCityId] : []
      };

      // Validation complète avant soumission
      if (!validateAllFields(memberWithCity)) {
        setError("Veuillez corriger les erreurs dans le formulaire");

        setIsLoading(false);

        return;
      }

      // Préparer les données pour l'API équipe
      const requestData = {
        nom: memberWithCity.nom,
        prenom: memberWithCity.prenom,
        role: memberWithCity.role,
        villeEpicu: memberWithCity.villeEpicu,
        emailEpicu: memberWithCity.emailEpicu,
        emailPerso: memberWithCity.emailPerso,
        dateNaissance: memberWithCity.dateNaissance,
        telephone: memberWithCity.telephone,
        adresse: memberWithCity.adresse,
        siret: memberWithCity.siret,
        dateDIP: memberWithCity.dateDIP,
        dateSignatureContrat: memberWithCity.dateSignatureContrat,
        dateSignatureAttestation: memberWithCity.dateSignatureAttestation,
      };

      // Appel API pour créer/modifier le collaborateur
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `/api/equipe?id=${editingMember?.id}` : '/api/equipe';

      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      const savedMember: Collaborator = data.member || {
        id: data.id || Date.now().toString(),
        nom: memberWithCity.nom || "",
        prenom: memberWithCity.prenom || "",
        role: memberWithCity.role || "Franchisé",
        villeEpicu: memberWithCity.villeEpicu || [],
        emailEpicu: memberWithCity.emailEpicu || "",
        emailPerso: memberWithCity.emailPerso || "",
        etablissements: memberWithCity.etablissements || [],
        trombi: memberWithCity.trombi || null,
        dateNaissance: memberWithCity.dateNaissance || null,
        telephone: memberWithCity.telephone || null,
        adresse: memberWithCity.adresse || null,
        siret: memberWithCity.siret || null,
        dateDIP: memberWithCity.dateDIP || null,
        dateSignatureContrat: memberWithCity.dateSignatureContrat || null,
        dateSignatureAttestation: memberWithCity.dateSignatureAttestation || null,
      };

      // Réinitialiser le formulaire et fermer le modal
      setNewMember({
        nom: "",
        prenom: "",
        role: "Franchisé",
        villeEpicu: [],
        emailEpicu: "",
        emailPerso: "",
        etablissements: [],
        trombi: null,
        dateNaissance: null,
        telephone: null,
        adresse: null,
        siret: null,
        dateDIP: null,
        dateSignatureContrat: null,
        dateSignatureAttestation: null,
      });
      setSelectedCityId("");
      setError(null);
      setFieldErrors({});
      setIsLoading(false);
      onClose();
      onMemberAdded(savedMember);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFieldErrors({});
    setNewMember({
      nom: "",
      prenom: "",
      role: "Franchisé",
      villeEpicu: [],
      emailEpicu: "",
      emailPerso: "",
      etablissements: [],
      trombi: null,
      dateNaissance: null,
      telephone: null,
      adresse: null,
      siret: null,
      dateDIP: null,
      dateSignatureContrat: null,
      dateSignatureAttestation: null,
    });
    setSelectedCityId("");
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
        <ModalHeader className="flex justify-center">
          {isEditing ? 'Modifier le membre' : 'Ajouter un nouveau membre'}
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <FormLabel htmlFor="prenom" isRequired={true}>
              Prénom
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              isRequired
              errorMessage={fieldErrors.prenom}
              id="prenom"
              isInvalid={!!fieldErrors.prenom}
              placeholder="Prénom"
              value={newMember.prenom || ""}
              onChange={(e) => {
                const value = e.target.value;

                setNewMember((prev) => ({
                  ...prev,
                  prenom: value
                }));
                validateField('prenom', value);
              }}
            />

            <FormLabel htmlFor="nom" isRequired={true}>
              Nom
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.nom}
              id="nom"
              isInvalid={!!fieldErrors.nom}
              placeholder="Nom"
              value={newMember.nom || ""}
              onChange={(e) => {
                const value = e.target.value;

                setNewMember((prev) => ({
                  ...prev,
                  nom: value
                }));
                validateField('nom', value);
              }}
            />

            <FormLabel htmlFor="villeEpicu" isRequired={true}>
              Ville Epicu
            </FormLabel>
            <StyledSelect
              isRequired
              errorMessage={fieldErrors.villeEpicu}
              id="villeEpicu"
              isInvalid={!!fieldErrors.villeEpicu}
              placeholder="Sélectionner une ville"
              selectedKeys={selectedCityId ? [selectedCityId] : []}
              onSelectionChange={(keys) => {
                const cityId = Array.from(keys)[0] as string;

                setSelectedCityId(cityId);
                validateField('villeEpicu', cityId ? [cityId] : []);
              }}
            >
              {cities.map((city) => (
                <SelectItem key={city.id}>
                  {city.ville}
                </SelectItem>
              ))}
            </StyledSelect>

            <FormLabel htmlFor="role" isRequired={true}>
              Rôle
            </FormLabel>
            <StyledSelect
              isRequired
              id="role"
              selectedKeys={[newMember.role || ""]}
              onSelectionChange={(keys) => {
                const role = Array.from(keys)[0] as string;

                setNewMember((prev) => ({ ...prev, role }));
              }}
            >
              <SelectItem key="Admin">Admin</SelectItem>
              <SelectItem key="Siège">Siège</SelectItem>
              <SelectItem key="Franchisé">Franchisé</SelectItem>
              <SelectItem key="Nouveau franchisé">Nouveau franchisé</SelectItem>
              <SelectItem key="Studio">Studio</SelectItem>
              <SelectItem key="Photographe/Vidéaste">Photographe/Vidéaste</SelectItem>
              <SelectItem key="Community Manager">Community Manager</SelectItem>
            </StyledSelect>

            <FormLabel htmlFor="telephone" isRequired={true}>
              Téléphone
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              isRequired
              errorMessage={fieldErrors.telephone}
              id="telephone"
              isInvalid={!!fieldErrors.telephone}
              placeholder="01 23 45 67 89"
              value={newMember.telephone || ""}
              onChange={(e) => {
                const value = e.target.value;

                setNewMember((prev) => ({ ...prev, telephone: value }));
                validateField('telephone', value);
              }}
            />

            {/* Champs SIRET - masqués pour le rôle Siège */}
            {newMember.role !== "Siège" && (
              <>
                <FormLabel htmlFor="siret" isRequired={true}>
                  SIRET
                </FormLabel>
                <Input
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  isRequired
                  errorMessage={fieldErrors.siret}
                  id="siret"
                  isInvalid={!!fieldErrors.siret}
                  placeholder="12345678901234"
                  value={newMember.siret || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    setNewMember((prev) => ({ ...prev, siret: value }));
                    validateField('siret', value);
                  }}
                />
              </>
            )}


            <FormLabel htmlFor="emailPerso" isRequired={true}>
              Email personnel
            </FormLabel>
            <Input
              isRequired
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              errorMessage={fieldErrors.emailPerso}
              id="emailPerso"
              isInvalid={!!fieldErrors.emailPerso}
              placeholder="prenom.nom@gmail.com"
              type="email"
              value={newMember.emailPerso || ""}
              onChange={(e) => {
                const value = e.target.value;

                setNewMember((prev) => ({ ...prev, emailPerso: value }));
                validateField('emailPerso', value);
              }}
            />

            <FormLabel htmlFor="emailEpicu" isRequired={false}>
              Email Epicu
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              errorMessage={fieldErrors.emailEpicu}
              id="emailEpicu"
              isInvalid={!!fieldErrors.emailEpicu}
              placeholder="prenom.nom@epicu.fr"
              type="email"
              value={newMember.emailEpicu || ""}
              onChange={(e) => {
                const value = e.target.value;

                setNewMember((prev) => ({ ...prev, emailEpicu: value }));
                validateField('emailEpicu', value);
              }}
            />


            <FormLabel htmlFor="dateNaissance" isRequired={false}>
              Date de naissance
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              id="dateNaissance"
              type="date"
              value={newMember.dateNaissance || ""}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, dateNaissance: e.target.value }));
              }}
            />

            {/* Champs de dates de signature - masqués pour le rôle Siège */}
            {newMember.role !== "Siège" && (
              <>
                <FormLabel htmlFor="dateDIP" isRequired={false}>
                  Date signature DIP
                </FormLabel>
                <Input
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  id="dateDIP"
                  type="date"
                  value={newMember.dateDIP || ""}
                  onChange={(e) => {
                    setNewMember((prev) => ({ ...prev, dateDIP: e.target.value }));
                  }}
                />

                <FormLabel htmlFor="dateSignatureContrat" isRequired={false}>
                  Date signature contrat
                </FormLabel>
                <Input
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  id="dateSignatureContrat"
                  type="date"
                  value={newMember.dateSignatureContrat || ""}
                  onChange={(e) => {
                    setNewMember((prev) => ({ ...prev, dateSignatureContrat: e.target.value }));
                  }}
                />

                <FormLabel htmlFor="dateSignatureAttestation" isRequired={false}>
                  Date signature formation
                </FormLabel>
                <Input
                  classNames={{
                    inputWrapper: "bg-page-bg",
                  }}
                  id="dateSignatureAttestation"
                  type="date"
                  value={newMember.dateSignatureAttestation || ""}
                  onChange={(e) => {
                    setNewMember((prev) => ({ ...prev, dateSignatureAttestation: e.target.value }));
                  }}
                />
              </>
            )}

            <FormLabel htmlFor="adresse" isRequired={false}>
              Adresse postale
            </FormLabel>
            <Textarea
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              id="adresse"
              placeholder="123 Rue de l'établissement, 75001 Ville"
              value={newMember.adresse || ""}
              onChange={(e) => {
                setNewMember((prev) => ({ ...prev, adresse: e.target.value }));
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
              isDisabled={isLoading || Object.keys(fieldErrors).length > 0 || !newMember.prenom || !newMember.nom || !selectedCityId || !newMember.telephone || !newMember.emailPerso || (newMember.role !== "Siège" && !newMember.siret)}
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
