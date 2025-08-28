"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";

import { FormLabel } from "./form-label";

interface Event {
  id: string;
  title: string;
  type: "rendez-vous" | "tournage" | "publication" | "evenement";
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  category: "siege" | "franchises" | "prestataires";
}

interface AgendaModalsProps {
  isTournageModalOpen: boolean;
  setIsTournageModalOpen: (open: boolean) => void;
  isPublicationModalOpen: boolean;
  setIsPublicationModalOpen: (open: boolean) => void;
  isRdvModalOpen: boolean;
  setIsRdvModalOpen: (open: boolean) => void;
  onEventAdded?: () => void;
}

export function AgendaModals({
  isTournageModalOpen,
  setIsTournageModalOpen,
  isPublicationModalOpen,
  setIsPublicationModalOpen,
  isRdvModalOpen,
  setIsRdvModalOpen,
  onEventAdded,
}: AgendaModalsProps) {
  const [, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // États pour les formulaires spécifiques
  const [newTournage, setNewTournage] = useState({
    establishmentName: "",
    shootingDate: "",
    shootingStartTime: "09:00",
    shootingEndTime: "17:00",
    publicationDate: "",
    publicationStartTime: "09:00",
    publicationEndTime: "10:00",
    photographers: false,
    videographers: false,
  });

  const [newPublication, setNewPublication] = useState({
    categoryName: "",
    establishmentName: "",
    publicationDate: "",
    publicationStartTime: "09:00",
    publicationEndTime: "10:00",
    shootingDate: "",
    shootingStartTime: "09:00",
    shootingEndTime: "17:00",
    winner: "",
    drawCompleted: false,
  });

  const [newRdv, setNewRdv] = useState({
    categoryName: "",
    establishmentName: "",
    appointmentType: "",
    appointmentDate: "",
    startTime: "09:00",
    endTime: "10:00",
  });

  // Fonction utilitaire pour calculer l'heure de fin (+1h)
  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();

    startDate.setHours(hours, minutes, 0, 0);

    // Ajouter 1 heure
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    // Formatter en HH:MM
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

    return `${endHours}:${endMinutes}`;
  };

  // Fonctions de validation
  const validateField = (fieldName: string, value: any, modalType?: string) => {
    const errors = { ...fieldErrors };
    const key = modalType ? `${modalType}.${fieldName}` : fieldName;

    switch (fieldName) {
      case 'establishmentName':
        if (!value || !value.trim()) {
          errors[key] = 'Le nom de l\'établissement est requis';
        } else {
          delete errors[key];
        }
        break;
      case 'categoryName':
        if (!value || !value.trim()) {
          errors[key] = 'Le nom de la catégorie est requis';
        } else {
          delete errors[key];
        }
        break;
      case 'shootingDate':
        if (!value) {
          errors[key] = 'La date de tournage est requise';
        } else {
          delete errors[key];
        }
        break;
      case 'publicationDate':
        if (!value) {
          errors[key] = 'La date de publication est requise';
        } else {
          delete errors[key];
        }
        break;
      case 'appointmentDate':
        if (!value) {
          errors[key] = 'La date de rendez-vous est requise';
        } else {
          delete errors[key];
        }
        break;
      case 'appointmentType':
        if (!value || !value.trim()) {
          errors[key] = 'Le type de rendez-vous est requis';
        } else {
          delete errors[key];
        }
        break;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAllFields = (data: any, modalType: string) => {
    let isValid = true;

    if (modalType === 'tournage') {
      const fields = ['establishmentName', 'shootingDate', 'publicationDate'];

      fields.forEach(field => {
        const fieldValid = validateField(field, data[field], modalType);

        if (!fieldValid) isValid = false;
      });
    } else if (modalType === 'publication') {
      const fields = ['categoryName', 'establishmentName', 'publicationDate', 'shootingDate'];

      fields.forEach(field => {
        const fieldValid = validateField(field, data[field], modalType);

        if (!fieldValid) isValid = false;
      });
    } else if (modalType === 'rdv') {
      const fields = ['categoryName', 'establishmentName', 'appointmentType', 'appointmentDate'];

      fields.forEach(field => {
        const fieldValid = validateField(field, data[field], modalType);

        if (!fieldValid) isValid = false;
      });
    }

    return isValid;
  };

  const handleAddTournage = async () => {
    try {
      // Validation complète avant soumission
      if (!validateAllFields(newTournage, 'tournage')) {
        setError("Veuillez corriger les erreurs dans le formulaire");

        return;
      }
      // Créer l'événement de tournage
      const tournageEvent = {
        title: `Tournage - ${newTournage.establishmentName}`,
        type: "tournage" as Event["type"],
        date: newTournage.shootingDate,
        startTime: newTournage.shootingStartTime,
        endTime: newTournage.shootingEndTime,
        location: newTournage.establishmentName,
        description: `Tournage avec ${newTournage.photographers ? "photographe" : ""}${newTournage.photographers && newTournage.videographers ? " et " : ""}${newTournage.videographers ? "vidéaste" : ""}`,
        category: "siege" as Event["category"],
      };

      const tournageResponse = await fetch("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournageEvent),
      });

      if (!tournageResponse.ok) {
        throw new Error("Erreur lors de l'ajout du tournage");
      }

      // Créer l'événement de publication si une date est spécifiée
      if (newTournage.publicationDate) {
        const publicationEvent = {
          title: `Publication - ${newTournage.establishmentName}`,
          type: "publication" as Event["type"],
          date: newTournage.publicationDate,
          startTime: newTournage.publicationStartTime,
          endTime: newTournage.publicationEndTime,
          location: newTournage.establishmentName,
          description: `Publication suite au tournage du ${new Date(newTournage.shootingDate).toLocaleDateString('fr-FR')}`,
          category: "siege" as Event["category"],
        };

        const publicationResponse = await fetch("/api/agenda", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(publicationEvent),
        });

        if (!publicationResponse.ok) {
          throw new Error("Erreur lors de l'ajout de la publication");
        }
      }

      setNewTournage({
        establishmentName: "",
        shootingDate: "",
        shootingStartTime: "09:00",
        shootingEndTime: "17:00",
        publicationDate: "",
        publicationStartTime: "09:00",
        publicationEndTime: "10:00",
        photographers: false,
        videographers: false,
      });
      setIsTournageModalOpen(false);
      setError(null);
      setFieldErrors({});
      onEventAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleAddPublication = async () => {
    try {
      // Validation complète avant soumission
      if (!validateAllFields(newPublication, 'publication')) {
        setError("Veuillez corriger les erreurs dans le formulaire");

        return;
      }
      // Créer l'événement de tournage si une date est spécifiée
      if (newPublication.shootingDate) {
        const tournageEvent = {
          title: `Tournage - ${newPublication.establishmentName}`,
          type: "tournage" as Event["type"],
          date: newPublication.shootingDate,
          startTime: newPublication.shootingStartTime,
          endTime: newPublication.shootingEndTime,
          location: newPublication.establishmentName,
          description: `Tournage pour publication ${newPublication.categoryName} prévue le ${new Date(newPublication.publicationDate).toLocaleDateString('fr-FR')}`,
          category: "siege" as Event["category"],
        };

        const tournageResponse = await fetch("/api/agenda", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tournageEvent),
        });

        if (!tournageResponse.ok) {
          throw new Error("Erreur lors de l'ajout du tournage");
        }
      }

      // Créer l'événement de publication
      const publicationEvent = {
        title: `Publication - ${newPublication.establishmentName}`,
        type: "publication" as Event["type"],
        date: newPublication.publicationDate,
        startTime: newPublication.publicationStartTime,
        endTime: newPublication.publicationEndTime,
        location: newPublication.establishmentName,
        description: `Publication ${newPublication.categoryName} - Gagnant: ${newPublication.winner || "À déterminer"} - Tirage: ${newPublication.drawCompleted ? "Effectué" : "En attente"}`,
        category: "siege" as Event["category"],
      };

      const publicationResponse = await fetch("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(publicationEvent),
      });

      if (!publicationResponse.ok) {
        throw new Error("Erreur lors de l'ajout de la publication");
      }

      setNewPublication({
        categoryName: "",
        establishmentName: "",
        publicationDate: "",
        publicationStartTime: "09:00",
        publicationEndTime: "10:00",
        shootingDate: "",
        shootingStartTime: "09:00",
        shootingEndTime: "17:00",
        winner: "",
        drawCompleted: false,
      });
      setIsPublicationModalOpen(false);
      setError(null);
      setFieldErrors({});
      onEventAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const handleAddRdv = async () => {
    try {
      // Validation complète avant soumission
      if (!validateAllFields(newRdv, 'rdv')) {
        setError("Veuillez corriger les erreurs dans le formulaire");

        return;
      }
      const rdvEvent = {
        title: `RDV - ${newRdv.establishmentName}`,
        type: "rendez-vous" as Event["type"],
        date: newRdv.appointmentDate,
        startTime: newRdv.startTime,
        endTime: newRdv.endTime,
        location: newRdv.establishmentName,
        description: `Rendez-vous ${newRdv.appointmentType} - Catégorie: ${newRdv.categoryName}`,
        category: "siege" as Event["category"],
      };

      const response = await fetch("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rdvEvent),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du rendez-vous");
      }

      setNewRdv({
        categoryName: "",
        establishmentName: "",
        appointmentType: "",
        appointmentDate: "",
        startTime: "09:00",
        endTime: "10:00",
      });
      setIsRdvModalOpen(false);
      setError(null);
      setFieldErrors({});
      onEventAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <>
      {/* Modal Ajouter un tournage */}
      <Modal isOpen={isTournageModalOpen} onOpenChange={setIsTournageModalOpen}>
        <ModalContent>
          <ModalHeader>Ajouter un tournage</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <FormLabel htmlFor="establishmentName" isRequired={true}>
                Nom de l&apos;établissement
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['tournage.establishmentName']}
                id="establishmentName"
                isInvalid={!!fieldErrors['tournage.establishmentName']}
                placeholder="Nom de l'établissement"
                value={newTournage.establishmentName}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTournage((prev) => ({
                    ...prev,
                    establishmentName: value,
                  }));
                  validateField('establishmentName', value, 'tournage');
                }}
              />


              <FormLabel htmlFor="publicationDate" isRequired={true}>
                Date de la publication
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['tournage.publicationDate']}
                id="publicationDate"
                isInvalid={!!fieldErrors['tournage.publicationDate']}
                type="date"
                value={newTournage.publicationDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTournage((prev) => ({
                    ...prev,
                    publicationDate: value,
                  }));
                  validateField('publicationDate', value, 'tournage');
                }}
              />

              <FormLabel htmlFor="shootingDate" isRequired={true}>
                Date du tournage
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['tournage.shootingDate']}
                id="shootingDate"
                isInvalid={!!fieldErrors['tournage.shootingDate']}
                type="date"
                value={newTournage.shootingDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewTournage((prev) => ({
                    ...prev,
                    shootingDate: value,
                  }));
                  validateField('shootingDate', value, 'tournage');
                }}
              />


              <div className="space-y-2">
                <div className="text-sm font-medium">Prestataires </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    isSelected={newTournage.photographers}
                    onValueChange={(checked) =>
                      setNewTournage((prev) => ({
                        ...prev,
                        photographers: checked,
                      }))
                    }
                  >
                    Photographe
                  </Checkbox>
                  <Checkbox
                    isSelected={newTournage.videographers}
                    onValueChange={(checked) =>
                      setNewTournage((prev) => ({
                        ...prev,
                        videographers: checked,
                      }))
                    }
                  >
                    Vidéaste
                  </Checkbox>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button
              className="flex-1 border-1"
              color='primary'
              variant="bordered"
              onPress={() => setIsTournageModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isDisabled={Object.keys(fieldErrors).some(key => key.startsWith('tournage.')) || !newTournage.establishmentName || !newTournage.shootingDate || !newTournage.publicationDate}
              onPress={handleAddTournage}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Ajouter une publication */}
      <Modal
        isOpen={isPublicationModalOpen}
        onOpenChange={setIsPublicationModalOpen}
      >
        <ModalContent>
          <ModalHeader>Ajouter une publication</ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <FormLabel htmlFor="categoryName" isRequired={true}>
                Nom catégorie
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['publication.categoryName']}
                id="categoryName"
                isInvalid={!!fieldErrors['publication.categoryName']}
                placeholder="FOOD"
                value={newPublication.categoryName}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewPublication((prev) => ({
                    ...prev,
                    categoryName: value,
                  }));
                  validateField('categoryName', value, 'publication');
                }}
              />
              <FormLabel htmlFor="establishmentName" isRequired={true}>
                Nom établissement
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['publication.establishmentName']}
                id="establishmentName"
                isInvalid={!!fieldErrors['publication.establishmentName']}
                placeholder="Nom de l'établissement"
                value={newPublication.establishmentName}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewPublication((prev) => ({
                    ...prev,
                    establishmentName: value,
                  }));
                  validateField('establishmentName', value, 'publication');
                }}
              />

              <Input
                isRequired
                errorMessage={fieldErrors['publication.publicationDate']}
                id="publicationDate"
                isInvalid={!!fieldErrors['publication.publicationDate']}
                type="date"
                value={newPublication.publicationDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewPublication((prev) => ({
                    ...prev,
                    publicationDate: value,
                  }));
                  validateField('publicationDate', value, 'publication');
                }}
              />
              <FormLabel htmlFor="shootingDate" isRequired={true}>
                Date du tournage
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['publication.shootingDate']}
                id="shootingDate"
                isInvalid={!!fieldErrors['publication.shootingDate']}
                type="date"
                value={newPublication.shootingDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewPublication((prev) => ({
                    ...prev,
                    shootingDate: value,
                  }));
                  validateField('shootingDate', value, 'publication');
                }}
              />
              {newPublication.shootingDate && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    value={newPublication.shootingStartTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      const endTime = calculateEndTime(startTime);

                      setNewPublication((prev) => ({
                        ...prev,
                        shootingStartTime: startTime,
                        shootingEndTime: endTime,
                      }));
                    }}
                  />
                  <Input
                    type="time"
                    value={newPublication.shootingEndTime}
                    onChange={(e) =>
                      setNewPublication((prev) => ({
                        ...prev,
                        shootingEndTime: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
              <FormLabel htmlFor="publicationDate" isRequired={true}>
                Date de la publication
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['publication.publicationDate']}
                id="publicationDate"
                isInvalid={!!fieldErrors['publication.publicationDate']}
                type="date"
                value={newPublication.publicationDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewPublication((prev) => ({
                    ...prev,
                    publicationDate: value,
                  }));
                  validateField('publicationDate', value, 'publication');
                }}
              />



              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  type="time"
                  value={newPublication.publicationStartTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    const endTime = calculateEndTime(startTime);

                    setNewPublication((prev) => ({
                      ...prev,
                      publicationStartTime: startTime,
                      publicationEndTime: endTime,
                    }));
                  }}
                />
                <Input
                  isRequired
                  type="time"
                  value={newPublication.publicationEndTime}
                  onChange={(e) =>
                    setNewPublication((prev) => ({
                      ...prev,
                      publicationEndTime: e.target.value,
                    }))
                  }
                />
              </div>

              <FormLabel htmlFor="winner" isRequired={true}>
                Gagnant
              </FormLabel>
              <Input
                isRequired
                id="winner"
                placeholder="Nom Prénom"
                value={newPublication.winner}
                onChange={(e) =>
                  setNewPublication((prev) => ({
                    ...prev,
                    winner: e.target.value,
                  }))
                }
              />

              <div className="flex items-center justify-between">
                <span className="text-base ">Tirage au sort effectué</span>
                <Switch
                  isSelected={newPublication.drawCompleted}
                  onValueChange={(checked) =>
                    setNewPublication((prev) => ({
                      ...prev,
                      drawCompleted: checked,
                    }))
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button
              className="flex-1 border-1"
              color='primary'
              variant="bordered"
              onPress={() => setIsPublicationModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isDisabled={Object.keys(fieldErrors).some(key => key.startsWith('publication.')) || !newPublication.categoryName || !newPublication.establishmentName || !newPublication.publicationDate || !newPublication.shootingDate}
              onPress={handleAddPublication}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Créer un rendez-vous */}
      <Modal isOpen={isRdvModalOpen} onOpenChange={setIsRdvModalOpen}>
        <ModalContent>
          <ModalHeader>Créer un rendez-vous</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <FormLabel htmlFor="categoryName" isRequired={true}>
                Nom catégorie
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['rdv.categoryName']}
                id="categoryName"
                isInvalid={!!fieldErrors['rdv.categoryName']}
                placeholder="FOOD"
                value={newRdv.categoryName}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewRdv((prev) => ({
                    ...prev,
                    categoryName: value,
                  }));
                  validateField('categoryName', value, 'rdv');
                }}
              />
              <FormLabel htmlFor="establishmentName" isRequired={true}>
                Nom établissement
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['rdv.establishmentName']}
                id="establishmentName"
                isInvalid={!!fieldErrors['rdv.establishmentName']}
                placeholder="Nom de l'établissement"
                value={newRdv.establishmentName}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewRdv((prev) => ({
                    ...prev,
                    establishmentName: value,
                  }));
                  validateField('establishmentName', value, 'rdv');
                }}
              />

              <FormLabel htmlFor="appointmentType" isRequired={true}>
                Type de rendez-vous
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['rdv.appointmentType']}
                id="appointmentType"
                isInvalid={!!fieldErrors['rdv.appointmentType']}
                placeholder="Fidélisation"
                value={newRdv.appointmentType}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewRdv((prev) => ({
                    ...prev,
                    appointmentType: value,
                  }));
                  validateField('appointmentType', value, 'rdv');
                }}
              />

              <FormLabel htmlFor="appointmentDate" isRequired={true}>
                Date du rendez-vous
              </FormLabel>
              <Input
                isRequired
                errorMessage={fieldErrors['rdv.appointmentDate']}
                id="appointmentDate"
                isInvalid={!!fieldErrors['rdv.appointmentDate']}
                type="date"
                value={newRdv.appointmentDate}
                onChange={(e) => {
                  const value = e.target.value;

                  setNewRdv((prev) => ({
                    ...prev,
                    appointmentDate: value,
                  }));
                  validateField('appointmentDate', value, 'rdv');
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  id="startTime"
                  type="time"
                  value={newRdv.startTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    const endTime = calculateEndTime(startTime);

                    setNewRdv((prev) => ({
                      ...prev,
                      startTime: startTime,
                      endTime: endTime,
                    }));
                  }}
                />

                <Input
                  isRequired
                  id="endTime"
                  type="time"
                  value={newRdv.endTime}
                  onChange={(e) =>
                    setNewRdv((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button className="flex-1 border-1" color='primary' variant="bordered" onPress={() => setIsRdvModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
              isDisabled={Object.keys(fieldErrors).some(key => key.startsWith('rdv.')) || !newRdv.categoryName || !newRdv.establishmentName || !newRdv.appointmentType || !newRdv.appointmentDate}
              onPress={handleAddRdv}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
