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
  const [error, setError] = useState<string | null>(null);
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
              <Input
                isRequired
                errorMessage={fieldErrors['tournage.establishmentName']}
                isInvalid={!!fieldErrors['tournage.establishmentName']}
                label="Nom de l'établissement "
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={fieldErrors['tournage.shootingDate']}
                  isInvalid={!!fieldErrors['tournage.shootingDate']}
                  label="Date du tournage "
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
                <Input
                  isRequired
                  errorMessage={fieldErrors['tournage.publicationDate']}
                  isInvalid={!!fieldErrors['tournage.publicationDate']}
                  label="Date de la publication "
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Début tournage "
                  type="time"
                  value={newTournage.shootingStartTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    const endTime = calculateEndTime(startTime);

                    setNewTournage((prev) => ({
                      ...prev,
                      shootingStartTime: startTime,
                      shootingEndTime: endTime,
                    }));
                  }}
                />
                <Input
                  isRequired
                  label="Fin tournage "
                  type="time"
                  value={newTournage.shootingEndTime}
                  onChange={(e) =>
                    setNewTournage((prev) => ({
                      ...prev,
                      shootingEndTime: e.target.value,
                    }))
                  }
                />
              </div>

              {newTournage.publicationDate && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Début publication "
                    type="time"
                    value={newTournage.publicationStartTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      const endTime = calculateEndTime(startTime);

                      setNewTournage((prev) => ({
                        ...prev,
                        publicationStartTime: startTime,
                        publicationEndTime: endTime,
                      }));
                    }}
                  />
                  <Input
                    label="Fin publication "
                    type="time"
                    value={newTournage.publicationEndTime}
                    onChange={(e) =>
                      setNewTournage((prev) => ({
                        ...prev,
                        publicationEndTime: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Prestataires </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2" htmlFor="photographers-checkbox">
                    <input
                      checked={newTournage.photographers}
                      className="rounded border-gray-300"
                      id="photographers-checkbox"
                      type="checkbox"
                      onChange={(e) =>
                        setNewTournage((prev) => ({
                          ...prev,
                          photographers: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm">Photographe</span>
                  </label>
                  <label className="flex items-center space-x-2" htmlFor="videographers-checkbox">
                    <input
                      checked={newTournage.videographers}
                      className="rounded border-gray-300"
                      id="videographers-checkbox"
                      type="checkbox"
                      onChange={(e) =>
                        setNewTournage((prev) => ({
                          ...prev,
                          videographers: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm">Vidéaste</span>
                  </label>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsTournageModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                errorMessage={fieldErrors['publication.categoryName']}
                isInvalid={!!fieldErrors['publication.categoryName']}
                label="Nom catégorie "
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
              <Input
                isRequired
                errorMessage={fieldErrors['publication.establishmentName']}
                isInvalid={!!fieldErrors['publication.establishmentName']}
                label="Nom établissement "
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={fieldErrors['publication.publicationDate']}
                  isInvalid={!!fieldErrors['publication.publicationDate']}
                  label="Date de la publication "
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
                <Input
                  isRequired
                  errorMessage={fieldErrors['publication.shootingDate']}
                  isInvalid={!!fieldErrors['publication.shootingDate']}
                  label="Date du tournage "
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Début publication "
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
                  label="Fin publication "
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

              {newPublication.shootingDate && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Début tournage "
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
                    label="Fin tournage "
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

              <Input
                isRequired
                label="Gagnant "
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
                <label className="text-sm font-medium" htmlFor="draw-completed-checkbox">
                  Tirage au sort effectué
                </label>
                <input
                  checked={newPublication.drawCompleted}
                  className="rounded border-gray-300"
                  id="draw-completed-checkbox"
                  type="checkbox"
                  onChange={(e) =>
                    setNewPublication((prev) => ({
                      ...prev,
                      drawCompleted: e.target.checked,
                    }))
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsPublicationModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
              <Input
                isRequired
                errorMessage={fieldErrors['rdv.categoryName']}
                isInvalid={!!fieldErrors['rdv.categoryName']}
                label="Nom catégorie "
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
              <Input
                isRequired
                errorMessage={fieldErrors['rdv.establishmentName']}
                isInvalid={!!fieldErrors['rdv.establishmentName']}
                label="Nom établissement "
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

              <Input
                isRequired
                errorMessage={fieldErrors['rdv.appointmentType']}
                isInvalid={!!fieldErrors['rdv.appointmentType']}
                label="Type de rendez-vous "
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

              <Input
                isRequired
                errorMessage={fieldErrors['rdv.appointmentDate']}
                isInvalid={!!fieldErrors['rdv.appointmentDate']}
                label="Date du rendez-vous "
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
                  label="Début "
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
                  label="Fin "
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
          <ModalFooter>
            <Button variant="light" onPress={() => setIsRdvModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
