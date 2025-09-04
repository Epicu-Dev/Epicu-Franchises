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

import { useUser } from "../contexts/user-context";

import { StyledSelect } from "./styled-select";
import { FormLabel } from "./form-label";
import { Prospect } from "@/types/prospect";
import { PlusIcon } from "@heroicons/react/24/outline";

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
  const { userProfile } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState<{ id: string; nomComplet: string; villes?: string[] }[]>([]);
  const [newProspect, setNewProspect] = useState<Prospect>({
    id: "",
    nomEtablissement: "",
    ville: "",
    telephone: "",
    categorie: ["FOOD"],
    statut: "a_contacter",
    datePriseContact: "",
    dateRelance: "",
    commentaires: "",
    suiviPar: "",
    email: "",
    adresse: "",
  });

  // Initialiser le formulaire avec les données du prospect à éditer
  useEffect(() => {
    if (isEditing && editingProspect) {
      setNewProspect(editingProspect);
    } else {
      // Réinitialiser le formulaire pour un nouvel ajout
      setNewProspect({
        id: "",
        nomEtablissement: "",
        ville: "",
        telephone: "",
        categorie: ["FOOD"],
        statut: "a_contacter",
        datePriseContact: "",
        dateRelance: "",
        commentaires: "",
        suiviPar: "",
        email: "",
        adresse: "",
      });
    }
    setError(null);
    setFieldErrors({});
  }, [isEditing, editingProspect, isOpen]);

  // Récupérer la liste des collaborateurs au chargement du modal
  useEffect(() => {
    const fetchCollaborateurs = async () => {
      try {
        const response = await fetch('/api/collaborateurs?limit=200&offset=0');
        if (response.ok) {
          const data = await response.json();
          let allCollaborateurs = data.results || [];

          // Filtrer les collaborateurs selon les villes de l'utilisateur connecté
          if (userProfile?.villes && userProfile.villes.length > 0) {
            const userVilles = userProfile.villes.map(v => v.ville);
            allCollaborateurs = allCollaborateurs.filter((collab: any) => {
              // Si le collaborateur a des villes, vérifier qu'il y a au moins une intersection
              if (collab.villes && collab.villes.length > 0) {
                return collab.villes.some((ville: string) => userVilles.includes(ville));
              }
              // Si le collaborateur n'a pas de villes spécifiées, l'inclure (probablement un admin)
              return true;
            });
          }

          setCollaborateurs(allCollaborateurs);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des collaborateurs:', err);
      }
    };

    if (isOpen) {
      fetchCollaborateurs();
    }
  }, [isOpen, userProfile?.villes]);

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
      case 'datePriseContact':
        if (!value) {
          errors.datePriseContact = 'La date de prise de contact est requise';
        } else {
          delete errors.datePriseContact;
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
    const fields = ['nomEtablissement', 'ville', 'telephone', 'datePriseContact', 'dateRelance'];
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
        "Nom de l'établissement": newProspect.nomEtablissement,
        'Ville EPICU': newProspect.ville,
        'Téléphone': newProspect.telephone,
        'Catégorie': newProspect.categorie,
        'Statut': newProspect.statut,
        'Date de prise de contact': newProspect.datePriseContact,
        'Date de relance': newProspect.dateRelance,
        'Commentaires': newProspect.commentaires,
        'Email': newProspect.email,
        'Adresse': newProspect.adresse,
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
        id: "",
        nomEtablissement: "",
        ville: "",
        telephone: "",
        categorie: ["FOOD"],
        statut: "a_contacter",
        datePriseContact: "",
        dateRelance: "",
        commentaires: "",
        suiviPar: "",
        email: "",
        adresse: "",
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
      id: "",
      nomEtablissement: "",
      ville: "",
      telephone: "",
      categorie: ["FOOD"],
      statut: "a_contacter",
      datePriseContact: "",
      dateRelance: "",
      commentaires: "",
      suiviPar: "",
      email: "",
      adresse: "",
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
          {isEditing ? 'Modifier le prospect' : 'Ajouter un nouveau prospect'}
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <FormLabel htmlFor="categorie" isRequired={true}>
              Catégorie 1
            </FormLabel>
            <StyledSelect
              isRequired
              id="categorie1"
              selectedKeys={[newProspect.categorie[0] ?? ""]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys).filter(
                  (key): key is "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY" =>
                    ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"].includes(key as string)
                );
                // Always keep categorie as a tuple of length 1 (for categorie1)
                setNewProspect((prev) => ({
                  ...prev,
                  categorie: [selected[0] ?? prev.categorie[0]],
                }));
              }}
            >
              <SelectItem key="FOOD">FOOD</SelectItem>
              <SelectItem key="SHOP">SHOP</SelectItem>
              <SelectItem key="TRAVEL">TRAVEL</SelectItem>
              <SelectItem key="FUN">FUN</SelectItem>
              <SelectItem key="BEAUTY">BEAUTY</SelectItem>
            </StyledSelect>
            {newProspect.categorie.length > 1 ? (
              <div>
                <FormLabel htmlFor="categorie" isRequired={false}>
                  Catégorie 2
                </FormLabel>
                <StyledSelect
                  id="categorie2"
                  selectedKeys={[newProspect.categorie[1] || ""]}
                  onSelectionChange={(keys) =>
                    Array.from(keys).map((key) => key as "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY" | 'none') == "none" ? setNewProspect((prev) => ({ ...prev, categorie: [prev.categorie[0]] })) : setNewProspect((prev) => ({ ...prev, categorie: [prev.categorie[0], ...Array.from(keys).map((key) => key as "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY")] }))
                  }
                >
                  <SelectItem key="none">Aucune</SelectItem>
                  <SelectItem key="FOOD">FOOD</SelectItem>
                  <SelectItem key="SHOP">SHOP</SelectItem>
                  <SelectItem key="TRAVEL">TRAVEL</SelectItem>
                  <SelectItem key="FUN">FUN</SelectItem>
                  <SelectItem key="BEAUTY">BEAUTY</SelectItem>
                </StyledSelect>
              </div>
            ) : <Button endContent={<PlusIcon className="h-4 w-4" />} color='primary' variant="bordered" className="border-1" onPress={() => setNewProspect((prev) => ({ ...prev, categorie: [...prev.categorie, "FUN"] }))}>Ajouter une catégorie (Optionnel)</Button>}
            <FormLabel htmlFor="nomEtablissement" isRequired={true}>
              Nom établissement
            </FormLabel>
            <Input
              isRequired
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel htmlFor="suiviPar" isRequired={true}>
              Suivi par
            </FormLabel>
            <StyledSelect
              id="suiviPar"
              placeholder="Sélectionner un suivi"
              selectedKeys={newProspect.suiviPar ? [newProspect.suiviPar] : []}
              onSelectionChange={(keys) => {
                const selectedSuiviPar = Array.from(keys)[0] as string;
                setNewProspect((prev) => ({ ...prev, suiviPar: selectedSuiviPar }));
              }}
            >
              {collaborateurs.length > 0 ? (
                <>
                  {collaborateurs.map((collab) => (
                    <SelectItem key={collab.id}>
                      {collab.nomComplet}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <SelectItem key="loading">Chargement...</SelectItem>
              )}
            </StyledSelect>

            <FormLabel htmlFor="ville" isRequired={true}>
              Ville
            </FormLabel>
            <StyledSelect
              id="ville"
              isRequired
              errorMessage={fieldErrors.ville}
              isInvalid={!!fieldErrors.ville}
              placeholder="Sélectionner une ville"
              selectedKeys={newProspect.ville ? [newProspect.ville] : []}
              onSelectionChange={(keys) => {
                const selectedVille = Array.from(keys)[0] as string;

                setNewProspect((prev) => ({ ...prev, ville: selectedVille }));
                validateField('ville', selectedVille);
              }}
            >
              {userProfile?.villes?.map((ville) => (
                <SelectItem key={ville.ville}>
                  {ville.ville}
                </SelectItem>
              )) || []}
            </StyledSelect>
            <FormLabel htmlFor="telephone" isRequired={true}>
              Téléphone
            </FormLabel>
            <Input
              isRequired
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel htmlFor="email" isRequired={true}>
              Mail
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              id="email"
              placeholder="contact@etablissement.fr"
              type="email"
              value={newProspect.email || ""}
              onChange={(e) =>
                setNewProspect((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />


            <FormLabel htmlFor="datePriseContact" isRequired={true}>
              Date de prise de contact
            </FormLabel>
            <Input
              isRequired
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              errorMessage={fieldErrors.datePriseContact}
              id="datePriseContact"
              isInvalid={!!fieldErrors.datePriseContact}
              type="date"
              value={newProspect.datePriseContact}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  datePriseContact: value,
                }));
                validateField('datePriseContact', value);
              }}
            />
            <FormLabel htmlFor="dateRelance" isRequired={false}>
              Date de la relance
            </FormLabel>
            <Input
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
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

            <FormLabel htmlFor="statut" isRequired={true}>
              Etat du prospect
            </FormLabel>
            <StyledSelect
              isRequired
              id="statut"
              selectedKeys={[newProspect.statut]}
              onSelectionChange={(keys) =>
                setNewProspect((prev) => ({
                  ...prev,
                  statut: Array.from(keys)[0] as "a_contacter" | "en_discussion" | "glacial",
                }))
              }
            >
              <SelectItem key="a_contacter">À contacter</SelectItem>
              <SelectItem key="en_discussion">En discussion</SelectItem>
              <SelectItem key="glacial">Glacial</SelectItem>
            </StyledSelect>

            <FormLabel htmlFor="commentaires" isRequired={false}>
              Commentaire
            </FormLabel>
            <Textarea
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              id="commentaires"
              placeholder="..."
              value={newProspect.commentaires}
              onChange={(e) =>
                setNewProspect((prev) => ({
                  ...prev,
                  commentaires: e.target.value,
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
              isDisabled={isLoading}
              variant="bordered"
              onPress={handleClose}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isDisabled={isLoading || Object.keys(fieldErrors).length > 0 || !newProspect.nomEtablissement || !newProspect.ville || !newProspect.telephone || !newProspect.datePriseContact || !newProspect.dateRelance}
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
