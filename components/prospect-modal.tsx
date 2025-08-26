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

interface Prospect {
  id?: string;
  siret: string;
  nomEtablissement: string;
  ville: string;
  telephone: string;
  categorie: string;
  statut: string;
  datePremierRendezVous: string;
  dateRelance: string;
  vientDeRencontrer: boolean;
  commentaire: string;
}

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProspectAdded: () => void;
  editingProspect?: Prospect | null;
  isEditing?: boolean;
}

export function ProspectModal({
  isOpen,
  onClose,
  onProspectAdded,
  editingProspect = null,
  isEditing = false
}: ProspectModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newProspect, setNewProspect] = useState<Prospect>({
    siret: "",
    nomEtablissement: "",
    ville: "",
    telephone: "",
    categorie: "",
    statut: "",
    datePremierRendezVous: "",
    dateRelance: "",
    vientDeRencontrer: false,
    commentaire: "",
  });

  // Initialiser le formulaire avec les données du prospect à éditer
  useEffect(() => {
    if (isEditing && editingProspect) {
      setNewProspect(editingProspect);
    } else {
      // Réinitialiser le formulaire pour un nouvel ajout
      setNewProspect({
        siret: "",
        nomEtablissement: "",
        ville: "",
        telephone: "",
        categorie: "FOOD",
        statut: "a_contacter",
        datePremierRendezVous: "",
        dateRelance: "",
        vientDeRencontrer: false,
        commentaire: "",
      });
    }
    setError(null);
    setFieldErrors({});
  }, [isEditing, editingProspect, isOpen]);

  const validateField = (fieldName: string, value: any) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'nomEtablissement':
        if (!value || !value.trim()) {
          errors.nomEtablissement = 'Le nom de l\'établissement est requis';
        } else {
          delete errors.nomEtablissement;
        }
        break;
      case 'ville':
        if (!value || !value.trim()) {
          errors.ville = 'La ville est requise';
        } else {
          delete errors.ville;
        }
        break;
      case 'telephone':
        if (!value || !value.trim()) {
          errors.telephone = 'Le téléphone est requis';
        } else {
          delete errors.telephone;
        }
        break;
      case 'datePremierRendezVous':
        if (!value) {
          errors.datePremierRendezVous = 'La date du premier rendez-vous est requise';
        } else {
          delete errors.datePremierRendezVous;
        }
        break;
      case 'dateRelance':
        if (!value) {
          errors.dateRelance = 'La date de relance est requise';
        } else {
          delete errors.dateRelance;
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (prospect: any) => {
    const fields = ['nomEtablissement', 'ville', 'telephone', 'datePremierRendezVous', 'dateRelance'];
    let isValid = true;

    fields.forEach(field => {
      const fieldValid = validateField(field, prospect[field]);

      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validation complète avant soumission
      if (!validateAllFields(newProspect)) {
        setError("Veuillez corriger les erreurs dans le formulaire");
        setIsLoading(false);
        return;
      }

      // Adapter les données pour l'API Airtable
      const prospectData: Record<string, any> = {
        'SIRET': newProspect.siret,
        "Nom de l'établissement": newProspect.nomEtablissement,
        'Ville EPICU': newProspect.ville,
        'Téléphone': newProspect.telephone,
        'Catégorie': newProspect.categorie,
        'Statut': newProspect.statut,
        'Date du premier contact': newProspect.datePremierRendezVous,
        'Date de relance': newProspect.dateRelance,
        'Je viens de le rencontrer (bool)': newProspect.vientDeRencontrer,
        'Commentaires': newProspect.commentaire,
      };



      let url: string;
      let method: string;

      if (isEditing && newProspect.id) {
        // Mise à jour - utiliser l'API Airtable avec PATCH
        url = `/api/prospects/prospects?id=${encodeURIComponent(newProspect.id)}`;
        method = "PATCH";
      } else {
        // Création - utiliser l'API Airtable
        url = "/api/prospects/prospects";
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prospectData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || `Erreur lors de ${isEditing ? 'la modification' : 'l\'ajout'} du prospect`);
      }

      // Réinitialiser le formulaire et fermer le modal
      setNewProspect({
        siret: "",
        nomEtablissement: "",
        ville: "",
        telephone: "",
        categorie: "",
        statut: "",
        datePremierRendezVous: "",
        dateRelance: "",
        vientDeRencontrer: false,
        commentaire: "",
      });
      setError(null);
      setFieldErrors({});
      setIsLoading(false);
      onClose();
      onProspectAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFieldErrors({});
    setNewProspect({
      siret: "",
      nomEtablissement: "",
      ville: "",
      telephone: "",
      categorie: "",
      statut: "",
      datePremierRendezVous: "",
      dateRelance: "",
      vientDeRencontrer: false,
      commentaire: "",
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
        <ModalHeader>
          {isEditing ? 'Modifier le prospect' : 'Ajouter un nouveau prospect'}
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <FormLabel htmlFor="siret" isRequired={true}>
              N° SIRET
            </FormLabel>
            <Input
              isRequired
              id="siret"
              placeholder="12345678901234"
              value={newProspect.siret}
              onChange={(e) =>
                setNewProspect((prev) => ({ ...prev, siret: e.target.value }))
              }
            />
            <FormLabel htmlFor="nomEtablissement" isRequired={true}>
              Nom établissement
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.nomEtablissement}
              id="nomEtablissement"
              isInvalid={!!fieldErrors.nomEtablissement}
              placeholder="Nom de l'établissement"
              value={newProspect.nomEtablissement}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  nomEtablissement: value,
                }));
                validateField('nomEtablissement', value);
              }}
            />
            <FormLabel htmlFor="ville" isRequired={true}>
              Ville
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.ville}
              id="ville"
              isInvalid={!!fieldErrors.ville}
              placeholder="Paris"
              value={newProspect.ville}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({ ...prev, ville: value }));
                validateField('ville', value);
              }}
            />
            <FormLabel htmlFor="telephone" isRequired={true}>
              Téléphone
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.telephone}
              id="telephone"
              isInvalid={!!fieldErrors.telephone}
              placeholder="01 23 45 67 89"
              value={newProspect.telephone}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  telephone: value,
                }));
                validateField('telephone', value);
              }}
            />

            <FormLabel htmlFor="categorie" isRequired={true}>
              Catégorie
            </FormLabel>
            <StyledSelect
              isRequired
              id="categorie"
              selectedKeys={[newProspect.categorie]}
              onSelectionChange={(keys) =>
                setNewProspect((prev) => ({
                  ...prev,
                  categorie: Array.from(keys)[0] as string,
                }))
              }
            >
              <SelectItem key="FOOD">FOOD</SelectItem>
              <SelectItem key="SHOP">SHOP</SelectItem>
              <SelectItem key="TRAVEL">TRAVEL</SelectItem>
              <SelectItem key="FUN">FUN</SelectItem>
              <SelectItem key="BEAUTY">BEAUTY</SelectItem>
            </StyledSelect>
            <FormLabel htmlFor="statut" isRequired={true}>
              Statut
            </FormLabel>
            <StyledSelect
              isRequired
              id="statut"
              selectedKeys={[newProspect.statut]}
              onSelectionChange={(keys) =>
                setNewProspect((prev) => ({
                  ...prev,
                  statut: Array.from(keys)[0] as string,
                }))
              }
            >
              <SelectItem key="a_contacter">À contacter</SelectItem>
              <SelectItem key="en_discussion">En discussion</SelectItem>
              <SelectItem key="glacial">Glacial</SelectItem>
            </StyledSelect>
            <FormLabel htmlFor="datePremierRendezVous" isRequired={true}>
              Date du premier rendez-vous
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.datePremierRendezVous}
              id="datePremierRendezVous"
              isInvalid={!!fieldErrors.datePremierRendezVous}
              type="date"
              value={newProspect.datePremierRendezVous}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  datePremierRendezVous: value,
                }));
                validateField('datePremierRendezVous', value);
              }}
            />
            <FormLabel htmlFor="dateRelance" isRequired={true}>
              Date de la relance
            </FormLabel>
            <Input
              isRequired
              errorMessage={fieldErrors.dateRelance}
              id="dateRelance"
              isInvalid={!!fieldErrors.dateRelance}
              type="date"
              value={newProspect.dateRelance}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  dateRelance: value,
                }));
                validateField('dateRelance', value);
              }}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                Je viens de le rencontrer
              </span>
              <input
                checked={newProspect.vientDeRencontrer}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                type="checkbox"
                onChange={(e) =>
                  setNewProspect((prev) => ({
                    ...prev,
                    vientDeRencontrer: e.target.checked,
                  }))
                }
              />
            </div>
            <FormLabel htmlFor="commentaire" isRequired={false}>
              Commentaire
            </FormLabel>
            <Textarea
              id="commentaire"
              placeholder="..."
              value={newProspect.commentaire}
              onChange={(e) =>
                setNewProspect((prev) => ({
                  ...prev,
                  commentaire: e.target.value,
                }))
              }
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
              variant="bordered" 
              isDisabled={isLoading}
              onPress={handleClose}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isLoading={isLoading}
              isDisabled={isLoading || Object.keys(fieldErrors).length > 0 || !newProspect.nomEtablissement || !newProspect.ville || !newProspect.telephone || !newProspect.datePremierRendezVous || !newProspect.dateRelance}
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
