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
import { PlusIcon } from "@heroicons/react/24/outline";

import { useUser } from "../contexts/user-context";
import { useAuthFetch } from "../hooks/use-auth-fetch";
import { useToastContext } from "../contexts/toast-context";

import { StyledSelect } from "./styled-select";
import { FormLabel } from "./form-label";

import { Prospect } from "@/types/prospect";

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
  const { authFetch } = useAuthFetch();
  const { userProfile } = useUser();
  const { showSuccess, showError } = useToastContext();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState<{ id: string; nomComplet: string; villes?: string[] }[]>([]);
  const [newProspect, setNewProspect] = useState<Prospect>({
    id: "",
    nomEtablissement: "",
    ville: "",
    villeEpicu: "",
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
      // Si le prospect a un suiviPar (nom), trouver l'ID correspondant
      let prospectToSet = { ...editingProspect };

      if (editingProspect.suiviPar && collaborateurs.length > 0) {
        const collaborateur = collaborateurs.find(collab => collab.nomComplet === editingProspect.suiviPar);

        if (collaborateur) {
          prospectToSet.suiviPar = collaborateur.id;
        }
      }

      // Si le prospect n'a pas de ville Epicu définie, utiliser la première ville de l'utilisateur par défaut
      if (!prospectToSet.villeEpicu && userProfile?.villes && userProfile.villes.length > 0) {
        prospectToSet.villeEpicu = userProfile.villes[0].id;
      }


      setNewProspect(prospectToSet);
    } else {
      // Réinitialiser le formulaire pour un nouvel ajout
      // Définir la première ville Epicu par défaut si l'utilisateur a des villes
      const defaultVilleEpicu = userProfile?.villes && userProfile.villes.length > 0 
        ? userProfile.villes[0].id 
        : "";
      
      // Définir l'utilisateur actuel comme suivi par défaut
      const defaultSuiviPar = userProfile?.id || "";
        
      setNewProspect({
        id: "",
        nomEtablissement: "",
        ville: "",
        villeEpicu: defaultVilleEpicu,
        telephone: "",
        categorie: ["FOOD"],
        statut: "a_contacter",
        datePriseContact: "",
        dateRelance: "",
        commentaires: "",
        suiviPar: defaultSuiviPar,
        email: "",
        adresse: "",
      });
    }
    setError(null);
    setFieldErrors({});
  }, [isEditing, editingProspect, isOpen, collaborateurs, userProfile?.villes]);

  // Récupérer la liste des membres d'équipe au chargement du modal
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        
        const response = await authFetch('/api/equipe?limit=200&offset=0');
        
        if (response.ok) {
          const data = await response.json();
          let allMembers = data.results || [];

          // Filtrer les membres selon les villes de l'utilisateur connecté
          if (userProfile?.villes && userProfile.villes.length > 0) {
            const userVilles = userProfile.villes.map(v => v.ville);

            allMembers = allMembers.filter((member: any) => {
              // Si le membre a des villes, vérifier qu'il y a au moins une intersection
              if (member.villeEpicu && member.villeEpicu.length > 0) {
                return member.villeEpicu.some((ville: string) => userVilles.includes(ville));
              }

              // Si le membre n'a pas de villes spécifiées, l'inclure (probablement un admin)
              return true;
            });
          }

          // Mapper les données pour correspondre au format attendu par le dropdown
          const mappedMembers = allMembers.map((member: any) => ({
            id: member.id, // Utiliser l'identifiant de l'utilisateur
            nomComplet: `${member.prenom} ${member.nom}`,
            villes: member.villeEpicu || []
          }));

          // S'assurer que l'utilisateur actuel est dans la liste des collaborateurs
          if (userProfile?.id && !mappedMembers.find((member: any) => member.id === userProfile.id)) {
            mappedMembers.unshift({
              id: userProfile.id,
              nomComplet: `${userProfile.firstname} ${userProfile.lastname}`,
              villes: userProfile.villes?.map(v => v.ville) || []
            });
          }

          setCollaborateurs(mappedMembers);
        }
        
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Erreur lors de la récupération des membres d\'équipe:', err);
        }
    };

    if (isOpen) {
      fetchMembers();
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
      
      case 'datePriseContact':
        if (!value || !value.trim()) {
          errors.datePriseContact = 'La date de prise de contact est requise';
        } else {
          delete errors.datePriseContact;
        }
        break;
      case 'dateRelance':
        // La date de relance est optionnelle, pas de validation requise
        delete errors.dateRelance;
        break;
      case 'villeEpicu':
        if (!value || !value.trim()) {
          errors.villeEpicu = 'La ville Epicu est requise';
        } else {
          delete errors.villeEpicu;
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (prospect: any) => {
    const fields = ['nomEtablissement', 'ville', 'datePriseContact', 'villeEpicu'];
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
        'Ville': newProspect.ville,
        'Téléphone': newProspect.telephone,
        'Catégorie': newProspect.categorie,
        'Statut': newProspect.statut,
        'Date de prise de contact': newProspect.datePriseContact,
        'Date de relance': newProspect.dateRelance,
        'Commentaires': newProspect.commentaires,
        'Email': newProspect.email,
        'Adresse': newProspect.adresse,
      };

      // Gérer la ville Epicu : envoyer l'ID directement à l'API
      if (newProspect.villeEpicu) {
        // Envoyer l'ID de la ville EPICU sélectionnée
        prospectData['Ville EPICU'] = [newProspect.villeEpicu];
      } else if (userProfile?.villes && userProfile.villes.length > 0) {
        // Fallback sur la première ville si aucune n'est sélectionnée
        prospectData['Ville EPICU'] = [userProfile.villes[0].id];
      }

      // Gérer le suivi par : envoyer comme un tableau avec l'ID du collaborateur
      if (newProspect.suiviPar) {
        prospectData['Suivi par'] = [newProspect.suiviPar];
      }




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

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prospectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `Erreur lors de ${isEditing ? 'la modification' : 'l\'ajout'} du prospect`;
        
        showError(errorMessage);
        throw new Error(errorMessage);
      }

      // Afficher le toast de succès
      
      showSuccess(isEditing ? 'Prospect modifié avec succès' : 'Prospect ajouté avec succès');

      // Réinitialiser le formulaire et fermer le modal
      // Définir la première ville Epicu par défaut si l'utilisateur a des villes
      const defaultVilleEpicu = userProfile?.villes && userProfile.villes.length > 0 
        ? userProfile.villes[0].id 
        : "";
      
      // Définir l'utilisateur actuel comme suivi par défaut
      const defaultSuiviPar = userProfile?.id || "";
        
      setNewProspect({
        id: "",
        nomEtablissement: "",
        ville: "",
        villeEpicu: defaultVilleEpicu,
        telephone: "",
        categorie: ["FOOD"],
        statut: "a_contacter",
        datePriseContact: "",
        dateRelance: "",
        commentaires: "",
        suiviPar: defaultSuiviPar,
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
    // Définir la première ville Epicu par défaut si l'utilisateur a des villes
    const defaultVilleEpicu = userProfile?.villes && userProfile.villes.length > 0 
      ? userProfile.villes[0].ville 
      : "";
    
    // Définir l'utilisateur actuel comme suivi par défaut
    const defaultSuiviPar = userProfile?.id || "";
      
    setNewProspect({
      id: "",
      nomEtablissement: "",
      ville: "",
      villeEpicu: defaultVilleEpicu,
      telephone: "",
      categorie: ["FOOD"],
      statut: "a_contacter",
      datePriseContact: "",
      dateRelance: "",
      commentaires: "",
      suiviPar: defaultSuiviPar,
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
      className="pb-20 md:pb-0"
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
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY" | 'none';
                    
                    if (selectedKey === "none") {
                      
                      setNewProspect((prev) => ({ ...prev, categorie: [prev.categorie[0]] }));
                    } else {
                      setNewProspect((prev) => ({ 
                        ...prev, 
                        categorie: [prev.categorie[0], selectedKey as "FOOD" | "SHOP" | "TRAVEL" | "FUN" | "BEAUTY"] 
                      }));
                    }
                  }}
                >
                  <SelectItem key="none">Aucune</SelectItem>
                  <SelectItem key="FOOD">FOOD</SelectItem>
                  <SelectItem key="SHOP">SHOP</SelectItem>
                  <SelectItem key="TRAVEL">TRAVEL</SelectItem>
                  <SelectItem key="FUN">FUN</SelectItem>
                  <SelectItem key="BEAUTY">BEAUTY</SelectItem>
                </StyledSelect>
              </div>
            ) : (
              <Button 
                className="border-1" 
                color='primary' 
                endContent={<PlusIcon className="h-4 w-4" />} 
                variant="bordered" 
                onPress={() => setNewProspect((prev) => ({ ...prev, categorie: [...prev.categorie, "FUN"] }))}
              >
                Ajouter une catégorie (Optionnel)
              </Button>
            )}

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
            <Input
              isRequired
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              errorMessage={fieldErrors.ville}
              id="ville"
              isInvalid={!!fieldErrors.ville}
              placeholder="Nom de la ville"
              value={newProspect.ville}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  ville: value,
                }));
                validateField('ville', value);
              }}
            />

            {userProfile?.villes && userProfile.villes.length > 0 && (
              <>
                <FormLabel htmlFor="villeEpicu" isRequired={true}>
                  Ville Epicu
                </FormLabel>
                <StyledSelect
                  id="villeEpicu"
                  placeholder="Sélectionner une ville Epicu"
                  selectedKeys={newProspect.villeEpicu ? [newProspect.villeEpicu] : []}
                  errorMessage={fieldErrors.villeEpicu}
                  isInvalid={!!fieldErrors.villeEpicu}
                  onSelectionChange={(keys) => {
                    const selectedVilleEpicu = Array.from(keys)[0] as string;

                    setNewProspect((prev) => ({ ...prev, villeEpicu: selectedVilleEpicu }));
                    validateField('villeEpicu', selectedVilleEpicu);
                  }}
                >
                  {userProfile.villes.map((ville) => (
                    <SelectItem key={ville.id}>
                      {ville.ville}
                    </SelectItem>
                  ))}
                </StyledSelect>
              </>
            )}
            <FormLabel htmlFor="telephone" isRequired={false}>
              Téléphone
            </FormLabel>
            <Input
              isRequired
              classNames={{
                inputWrapper: "bg-page-bg",
              }}
              id="telephone"
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

            <FormLabel htmlFor="email" isRequired={false}>
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
                inputWrapper:  "bg-page-bg hover:!bg-page-bg focus-within:!bg-page-bg data-[focus=true]:!bg-page-bg data-[hover=true]:!bg-page-bg" ,
                input: newProspect.datePriseContact ? "text-black" : "text-gray-300"
              }}
              color={newProspect.datePriseContact ? "default" : "danger"}
              errorMessage={fieldErrors.datePriseContact}
              id="datePriseContact"
              isInvalid={!!fieldErrors.datePriseContact}
              type="date"
              value={newProspect.datePriseContact || undefined}
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
                inputWrapper:  "bg-page-bg hover:!bg-page-bg focus-within:!bg-page-bg data-[focus=true]:!bg-page-bg data-[hover=true]:!bg-page-bg" ,
                input: newProspect.dateRelance ? "text-black" : "text-gray-300"
              }}
              color={newProspect.dateRelance ? "default" : "danger"}
              errorMessage={fieldErrors.dateRelance}
              id="dateRelance"
              isInvalid={!!fieldErrors.dateRelance}
              type="date"
              value={newProspect.dateRelance || undefined}
              onChange={(e) => {
                const value = e.target.value;

                setNewProspect((prev) => ({
                  ...prev,
                  dateRelance: value,
                }));
                validateField('dateRelance', value);
              }}
            />

            <FormLabel htmlFor="statut" >
              Etat du prospect
            </FormLabel>
            <div>

              <Input
                isReadOnly
                classNames={{
                  inputWrapper: "bg-page-bg",
                }}
                id="statut"
                value={
                  newProspect.statut === "a_contacter" ? "Contacté" :
                    newProspect.statut === "en_discussion" ? "En discussion" :
                      newProspect.statut === "glacial" ? "Glacial" :
                        newProspect.statut
                }
              />
              <p className="text-xs mt-2">
                Pour changer l&apos;état du prospect, utilisez le bouton &quot;Convertir&quot; dans l&apos;onglet Prospects
              </p>
            </div>

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
              isDisabled={isLoading || Object.keys(fieldErrors).length > 0 || !newProspect.nomEtablissement || !newProspect.ville || !newProspect.datePriseContact || !newProspect.villeEpicu}
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
