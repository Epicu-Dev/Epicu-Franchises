"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { SelectItem } from "@heroui/select";

import { StyledSelect } from "./styled-select";
import { Checkbox } from "@heroui/checkbox";
import { Spinner } from "@heroui/spinner";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { FormLabel } from "./form-label";
import SlotSelectionModal from "./slot-selection-modal";

import { GoogleCalendarEvent } from "@/types/googleCalendar";
import { Client } from "@/types/client";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useUser } from "@/contexts/user-context";

type EventType = "tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar";

interface FormData {
  // Champs Google Calendar de base
  summary: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;

  // Champs spécifiques tournage
  selectedClient: Client | null;
  photographers: boolean;
  videographers: boolean;

  // Champs spécifiques publication
  winner: string;
  drawCompleted: boolean;

  // Champs spécifiques rendez-vous
  appointmentType: string;

  // Champs spécifiques événement
  eventFor: string;

  // Créneau sélectionné
  selectedSlotId: string | null;
}

interface UnifiedEventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: EventType;
  onEventCreated?: (event: GoogleCalendarEvent) => void;
  onEventAdded?: () => void;
}

export function UnifiedEventModal({
  isOpen,
  onOpenChange,
  eventType,
  onEventCreated,
  onEventAdded
}: UnifiedEventModalProps) {
  const { authFetch } = useAuthFetch();
  const { userProfile } = useUser();

  // États communs
  const [formData, setFormData] = useState<FormData>({
    // Champs Google Calendar de base
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',

    // Champs spécifiques tournage
    selectedClient: null as Client | null,
    photographers: false,
    videographers: false,

    // Champs spécifiques publication
    winner: '',
    drawCompleted: false,

    // Champs spécifiques rendez-vous
    appointmentType: '',

    // Champs spécifiques événement
    eventFor: '',

    // Créneau sélectionné
    selectedSlotId: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<{
    isConnected: boolean;
    message?: string;
  }>({ isConnected: false });
  const [isEndTimeManuallyModified, setIsEndTimeManuallyModified] = useState(false);

  // États pour la recherche de client (comme dans invoice-modal)
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSearchResults, setShowClientSearchResults] = useState(false);

  // Fonction pour gérer la sélection de créneau
  const handleSlotSelection = (slot: any) => {
    // Le slot vient maintenant du modal modifié avec la structure TimeSlot
    // On utilise directement la date ISO et l'heure
    if (!slot.DATE) {
      // eslint-disable-next-line no-console
      console.error('Date manquante dans le créneau sélectionné');

      return;
    }

    // Utiliser directement la date ISO
    const date = new Date(slot.DATE);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    // Formater la date en format ISO (YYYY-MM-DD)
    const formattedDate = `${year}-${month}-${day}`;

    // Extraire l'heure du créneau (format: "14h00 - 15h00")
    let startTime = '18:00';
    let endTime = '19:00';

    if (slot.HEURE) {
      // Parser l'heure du format "14h00 - 15h00"
      const timeMatch = slot.HEURE.match(/(\d{1,2})h(\d{2})/);
      if (timeMatch) {
        const hour = timeMatch[1].padStart(2, '0');
        const minute = timeMatch[2];

        startTime = `${hour}:${minute}`;

        // Calculer l'heure de fin (ajouter 1 heure)
        const endHour = (parseInt(hour) + 1).toString().padStart(2, '0');

        endTime = `${endHour}:${minute}`;
      }
    }

    setFormData(prev => ({
      ...prev,
      startDate: formattedDate,
      startTime: startTime,
      endTime: endTime,
      selectedSlotId: slot.id // Stocker l'ID du créneau sélectionné
    }));
  };

  // Charger les catégories (plus nécessaire pour rendez-vous)
  useEffect(() => {
    // Plus de chargement de catégories nécessaire
  }, [isOpen, eventType]);

  // Vérifier le statut Google Calendar au chargement du modal
  useEffect(() => {
    if (isOpen) {
      checkGoogleCalendarStatus();
    }
  }, [isOpen]);

  const checkGoogleCalendarStatus = async () => {
    try {
      const statusResponse = await authFetch('/api/google-calendar/status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setGoogleSyncStatus({
          isConnected: status.isConnected,
          message: status.isConnected ? "Synchronisé avec Google Calendar" : "Non connecté à Google Calendar"
        });
      }
    } catch (error) {
      setGoogleSyncStatus({
        isConnected: false,
        message: "Impossible de vérifier le statut Google Calendar"
      });
    }
  };

  // Initialiser la date par défaut à la date du jour
  useEffect(() => {
    if (isOpen && !formData.startDate) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, startDate: today }));
    }
  }, [isOpen, formData.startDate]);

  // Initialiser automatiquement les dates de fin pour rendez-vous et tournages
  useEffect(() => {
    if (isOpen && (eventType === 'rendez-vous' || eventType === 'tournage')) {
      // Initialiser la date de fin avec la date de début si elle est définie
      if (formData.startDate && !formData.endDate) {
        setFormData(prev => ({ ...prev, endDate: formData.startDate }));
      }

      // Initialiser l'heure de fin avec l'heure de début + 1h si elle est définie et pas encore modifiée manuellement
      if (formData.startTime && formData.startTime !== '10:00' && !isEndTimeManuallyModified) {
        const [hours, minutes] = formData.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        // Ajouter 1 heure
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        // Formatter en HH:MM
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        const endTime = `${endHours}:${endMinutes}`;

        setFormData(prev => ({ ...prev, endTime }));
      }
    }
  }, [isOpen, eventType, formData.startDate, formData.startTime, isEndTimeManuallyModified]);

  // Fonctions de recherche de client (comme dans invoice-modal)
  const searchClients = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientSearchResults([]);
      setShowClientSearchResults(false);
      return;
    }

    try {
      setIsSearchingClient(true);

      const response = await authFetch(`/api/etablissements/etablissements?q=${encodeURIComponent(searchTerm)}&limit=10`);

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche de clients");
      }

      const data = await response.json();
      setClientSearchResults(data.clients || []);
      setShowClientSearchResults(true);
    } catch (err) {
      console.error("Erreur lors de la recherche de clients:", err);
    } finally {
      setIsSearchingClient(false);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.nomEtablissement);
    setShowClientSearchResults(false);

    // Mettre à jour formData avec les informations du client
    setFormData(prev => ({
      ...prev,
      selectedClient: client,
      summary: eventType === 'tournage'
        ? `Tournage - ${client.nomEtablissement}`
        : eventType === 'publication'
          ? `Publication - ${client.nomEtablissement}`
          : `RDV - ${client.nomEtablissement}`,
      location: client.nomEtablissement
    }));
  };

  const clearSelectedClient = () => {
    setSelectedClient(null);
    setClientSearchTerm("");
    setFormData(prev => ({
      ...prev,
      selectedClient: null,
      summary: '',
      location: ''
    }));
    setClientSearchResults([]);
    setShowClientSearchResults(false);
  };

  // Recherche de clients avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm) {
        searchClients(clientSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (eventType === 'google-calendar') {
        await handleGoogleCalendarSubmit();
      } else {
        await handleLocalEventSubmit();
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la création de l&apos;événement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCalendarSubmit = async () => {
    // Préparer les données pour Google Calendar
    const eventData: Partial<GoogleCalendarEvent> = {
      summary: formData.summary,
      description: formData.description || undefined,
      location: formData.location || undefined,
      start: {
        dateTime: `${formData.startDate}T${formData.startTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: `${formData.endDate || formData.startDate}T${formData.endTime || formData.startTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const response = await authFetch('/api/google-calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      const createdEvent = await response.json();
      onEventCreated?.(createdEvent);
      handleClose();
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  };

  const handleLocalEventSubmit = async () => {
    const events = [];

    // Combiner la date et l'heure pour créer une date complète
    const createDateTime = (date: string, time: string) => {
      return new Date(`${date}T${time}:00`).toISOString();
    };

    if (eventType === 'tournage') {
      // Créer l'événement de tournage
      const tournageEvent = {
        title: `Tournage - ${formData.selectedClient?.nomEtablissement || 'Client'}`,
        type: "tournage",
        date: createDateTime(formData.startDate, formData.startTime),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.selectedClient?.nomEtablissement || formData.location,
        description: `Tournage avec ${formData.photographers ? "photographe" : ""}${formData.photographers && formData.videographers ? " et " : ""}${formData.videographers ? "vidéaste" : ""}${formData.description ? ` - ${formData.description}` : ""}`,
        category: "siege",
        collaborator: userProfile?.id,
        etablissement: formData.selectedClient?.id || null,
      };
      events.push(tournageEvent);

    } else if (eventType === 'publication') {
      // Créer l'événement de publication
      const publicationEvent = {
        title: `Publication - ${formData.selectedClient?.nomEtablissement || 'Client'}`,
        type: "publication",
        date: createDateTime(formData.startDate, formData.startTime),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.selectedClient?.nomEtablissement || formData.location,
        description: `Publication ${formData.selectedClient?.categorie || ''} - Gagnant: ${formData.winner || "À déterminer"} - Tirage: ${formData.drawCompleted ? "Effectué" : "En attente"}${formData.description ? ` - ${formData.description}` : ""}`,
        category: "siege",
        collaborator: userProfile?.id,
        etablissement: formData.selectedClient?.id || null,
      };
      events.push(publicationEvent);

    } else if (eventType === 'rendez-vous') {
      const rdvEvent = {
        title: `RDV - ${formData.selectedClient?.nomEtablissement || 'Client'}`,
        type: "rendez-vous",
        date: createDateTime(formData.startDate, formData.startTime),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.selectedClient?.nomEtablissement || formData.location,
        description: `Rendez-vous ${formData.appointmentType}${formData.description ? ` - ${formData.description}` : ""}`,
        category: "siege",
        collaborator: userProfile?.id,
        etablissement: formData.selectedClient?.id || null,
      };
      events.push(rdvEvent);

    } else if (eventType === 'evenement') {
      const eventData = {
        title: formData.summary,
        type: "evenement",
        date: createDateTime(formData.startDate, formData.startTime),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location || undefined,
        description: formData.description || undefined,
        category: "siege",
        collaborator: userProfile?.id,
        etablissement: formData.selectedClient?.id || null,
      };
      events.push(eventData);
    }

    // Utiliser le statut Google Calendar déjà vérifié
    const isGoogleConnected = googleSyncStatus.isConnected;

    // Créer les événements localement ET dans Google Calendar
    let eventCreatedSuccessfully = false;
    let createdEventId = null;

    for (const eventData of events) {
      // Créer l'événement local
      const localResponse = await authFetch("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!localResponse.ok) {
        throw new Error("Erreur lors de l'ajout de l'événement local");
      }

      const localEventData = await localResponse.json();
      createdEventId = localEventData.id;
      eventCreatedSuccessfully = true;

      // Créer l'événement dans Google Calendar seulement si connecté
      if (isGoogleConnected) {
        try {
          const googleEventData: Partial<GoogleCalendarEvent> = {
            summary: eventData.title,
            description: eventData.description || undefined,
            location: eventData.location || undefined,
            start: {
              dateTime: `${formData.startDate}T${eventData.startTime}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: `${formData.startDate}T${eventData.endTime}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          };

          const googleResponse = await authFetch('/api/google-calendar/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEventData),
          });

          if (googleResponse.ok) {
            const createdGoogleEvent = await googleResponse.json();
            onEventCreated?.(createdGoogleEvent);
            console.log("✅ Événement créé avec succès dans Google Calendar");

            // Mettre à jour l'événement Airtable avec l'ID Google Calendar
            if (createdEventId && createdGoogleEvent.id) {
              // Préparer les données à mettre à jour
              const updateData: any = {
                googleEventId: createdGoogleEvent.id
              };

              // Si c'est un événement de publication avec un créneau sélectionné, ajouter l'ID du créneau
              if (eventData.type === 'publication' && formData.selectedSlotId) {
                updateData['Creneau'] = [formData.selectedSlotId];
              }

              await authFetch(`/api/agenda?id=${createdEventId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
              });
              console.log("✅ ID Google Calendar et créneau stockés dans l'événement Airtable");
            }

            // Mettre à jour le statut pour indiquer le succès
            setGoogleSyncStatus(prev => ({
              ...prev,
              message: "Synchronisé avec Google Calendar - Événement créé"
            }));
          } else {
            const errorData = await googleResponse.json();
            console.warn("⚠️ Impossible de créer l'événement dans Google Calendar:", errorData.error);
            // Mettre à jour le statut pour indiquer l'erreur
            setGoogleSyncStatus(prev => ({
              ...prev,
              message: `Erreur Google Calendar: ${errorData.error || 'Erreur inconnue'}`
            }));
          }
        } catch (googleError) {
          console.warn("⚠️ Erreur lors de la création dans Google Calendar:", googleError);
          // Mettre à jour le statut pour indiquer l'erreur
          setGoogleSyncStatus(prev => ({
            ...prev,
            message: `Erreur Google Calendar: ${googleError instanceof Error ? googleError.message : 'Erreur inconnue'}`
          }));
          // On continue même si Google Calendar échoue
        }
      } else {
        console.log("ℹ️ Google Calendar non connecté - événement créé localement uniquement");
        // Mettre à jour le statut pour indiquer que l'événement a été créé localement
        setGoogleSyncStatus(prev => ({
          ...prev,
          message: "Événement créé localement - Google Calendar non connecté"
        }));
      }
    }

    // Marquer le créneau comme indisponible et stocker l'ID du créneau seulement si l'événement a été créé avec succès
    if (eventCreatedSuccessfully && formData.selectedSlotId) {
      try {
        const slotResponse = await authFetch(`/api/publications/creneaux?id=${formData.selectedSlotId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            statutPublication: ['recsdyl2X41rpj7LG'] // ID du statut "Indisponible" en tableau
          }),
        });

        if (slotResponse.ok) {
          console.log(`✅ Créneau ${formData.selectedSlotId} marqué comme indisponible`);

          // Mettre à jour l'événement créé avec l'ID du créneau seulement si Google Calendar n'était pas connecté
          // (sinon c'est déjà fait dans la section Google Calendar ci-dessus)
          if (createdEventId && !isGoogleConnected) {
            await authFetch(`/api/agenda?id=${createdEventId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                'Creneau': [formData.selectedSlotId] // Champ de liaison (array)
              }),
            });
            console.log(`✅ ID du créneau ${formData.selectedSlotId} lié à l'événement publication`);
          } else if (isGoogleConnected) {
            console.log(`ℹ️ ID du créneau déjà lié lors de la synchronisation Google Calendar`);
          }
        } else {
          const errorData = await slotResponse.json();
          console.warn(`⚠️ Erreur lors de la mise à jour du créneau:`, errorData);
        }
      } catch (slotError) {
        console.warn('⚠️ Erreur lors de la mise à jour du créneau:', slotError);
        // On continue même si la mise à jour du créneau échoue
      }
    } else if (!eventCreatedSuccessfully) {
      console.log('ℹ️ Événement non créé, pas de mise à jour du créneau');
    } else {
      console.log('ℹ️ Aucun créneau sélectionné, pas de mise à jour nécessaire');
    }

    onEventAdded?.();
    handleClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-calculer la date de fin pour rendez-vous et tournages
    if ((eventType === 'rendez-vous' || eventType === 'tournage') && field === 'startDate' && value) {
      // La date de fin est la même que la date de début
      setFormData(prev => ({ ...prev, endDate: value }));
    }

    // Auto-calculer l'heure de fin quand l'heure de début change (seulement pour tournage et rendez-vous)
    if ((eventType === 'rendez-vous' || eventType === 'tournage') && field === 'startTime' && value && !isEndTimeManuallyModified) {
      const [hours, minutes] = value.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      // Ajouter 1 heure
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Formatter en HH:MM
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      const endTime = `${endHours}:${endMinutes}`;

      setFormData(prev => ({ ...prev, endTime }));
    }

    // Marquer l'heure de fin comme modifiée manuellement si l'utilisateur la change
    if (field === 'endTime') {
      setIsEndTimeManuallyModified(true);
    }
  };

  const handleClose = () => {
    // Réinitialiser le formulaire
    setFormData({
      summary: '',
      description: '',
      location: '',
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      selectedClient: null,
      photographers: false,
      videographers: false,
      winner: '',
      drawCompleted: false,
      appointmentType: '',
      eventFor: '',
      selectedSlotId: null
    });
    // Réinitialiser les états de recherche de client
    setClientSearchTerm('');
    setClientSearchResults([]);
    setSelectedClient(null);
    setShowClientSearchResults(false);
    // Réinitialiser l'état de modification manuelle de l'heure de fin
    setIsEndTimeManuallyModified(false);
    onOpenChange(false);
  };

  const getModalTitle = () => {
    switch (eventType) {
      case 'tournage': return 'Ajouter un tournage';
      case 'publication': return 'Ajouter une publication';
      case 'rendez-vous': return 'Créer un rendez-vous';
      case 'evenement': return 'Ajouter un événement';
      case 'google-calendar': return 'Créer un événement Google Calendar';
      default: return 'Créer un événement';
    }
  };

  // Définir la date d'aujourd'hui comme valeur par défaut
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          <ModalHeader className="flex  gap-1 justify-center">
            {getModalTitle()}
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="space-y-4">

                {/* Sélection de client pour tournage, publication et rendez-vous */}
                {(eventType === 'tournage' || eventType === 'publication' || eventType === 'rendez-vous') && (
                  <div className="space-y-2">
                    <div className="relative">
                      <FormLabel htmlFor="clientSearch" isRequired={true}>
                        Rechercher un client/prospect
                      </FormLabel>
                      <Input
                        isRequired
                        endContent={
                          isSearchingClient ? (
                            <Spinner size="sm" />
                          ) : (
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                          )
                        }
                        id="clientSearch"
                        placeholder="Rechercher par nom, email, téléphone..."
                        classNames={{
                          inputWrapper: "bg-page-bg",
                        }}
                        value={clientSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setClientSearchTerm(value);
                          if (!value) {
                            clearSelectedClient();
                          }
                        }}
                        onFocus={() => {
                          if (clientSearchTerm && clientSearchResults.length > 0) {
                            setShowClientSearchResults(true);
                          }
                        }}
                      />

                      {/* Résultats de recherche */}
                      {showClientSearchResults && clientSearchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {clientSearchResults.map((client) => (
                            <div
                              key={client.id}
                              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              onClick={() => selectClient(client)}
                              onKeyDown={(e) => e.key === 'Enter' && selectClient(client)}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {client.nomEtablissement}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {client.raisonSociale}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {client.ville && `${client.ville} • `}
                                {client.email && `${client.email} • `}
                                {client.telephone && client.telephone}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Encart d'informations du client sélectionné */}
                    {selectedClient && (
                      <div className="bg-page-bg border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-sm text-primary-light mb-1">
                              Client sélectionné
                            </h4>
                            <p className="font-medium text-lg">
                              {selectedClient.nomEtablissement}
                            </p>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="text-primary-light"
                            onPress={clearSelectedClient}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}



                {/* Type de rendez-vous */}
                {eventType === 'rendez-vous' && (
                  <>
                    <FormLabel htmlFor="appointmentType" isRequired={true}>
                      Type de rendez-vous
                    </FormLabel>
                    <StyledSelect
                      id="appointmentType"
                      placeholder="Sélectionner un type"
                      selectedKeys={formData.appointmentType ? [formData.appointmentType] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange('appointmentType', value);
                      }}
                      required
                    >
                      <SelectItem key="prospection">Prospection</SelectItem>
                      <SelectItem key="post-campagne">Post-campagne</SelectItem>
                      <SelectItem key="studio">Studio</SelectItem>
                    </StyledSelect>
                  </>

                )}

                {/* Titre de l'événement - editable pour tous les types */}
                {
                  eventType === 'evenement' &&
                  <Input
                    id="summary"
                    placeholder={
                      "Titre de l'événement"
                    }
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    required
                  />}

                {/* Dropdowns pour événement */}
                {eventType === 'evenement' && (
                  <>
                    <FormLabel htmlFor="appointmentType" isRequired={true}>
                      Type d&apos;événement
                    </FormLabel>
                    <StyledSelect
                      id="appointmentType"
                      placeholder="Sélectionner un type"
                      selectedKeys={formData.appointmentType ? [formData.appointmentType] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange('appointmentType', value);
                      }}
                      required
                    >
                      <SelectItem key="brunch">Brunch</SelectItem>
                      <SelectItem key="seminaire">Séminaire</SelectItem>
                      <SelectItem key="formation">Formation</SelectItem>
                      <SelectItem key="reunion">Réunion</SelectItem>
                      <SelectItem key="autre">Autre</SelectItem>
                    </StyledSelect>

                    <FormLabel htmlFor="eventFor" isRequired={true}>
                      Pour qui
                    </FormLabel>
                    <StyledSelect
                      id="eventFor"
                      placeholder="Sélectionner un destinataire"
                      selectedKeys={formData.eventFor ? [formData.eventFor] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange('eventFor', value);
                      }}
                      required
                    >
                      <SelectItem key="franchises">Franchisés</SelectItem>
                      <SelectItem key="sieges">Sièges</SelectItem>
                      <SelectItem key="partenaires">Partenaires</SelectItem>
                    </StyledSelect>
                  </>
                )}



                {/* Lieu */}
                {(eventType === 'google-calendar' || eventType === 'evenement') && (
                  <>
                    <FormLabel htmlFor="description" isRequired={false}>
                      Description
                    </FormLabel>
                    <Textarea
                      id="description"
                      placeholder="Description de l'événement (optionnel)"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                    <FormLabel htmlFor="location" isRequired={true}>
                      Lieu
                    </FormLabel>
                    <Input
                      classNames={{
                        inputWrapper: "bg-page-bg",
                      }}
                      id="location"
                      placeholder="Ex: Bureau principal"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </>
                )}

                {/* Checkboxes prestataires pour tournage */}
                {eventType === 'tournage' && (
                  <div className="space-y-2">
                    <FormLabel htmlFor="prestataires" isRequired={false}>
                      Partenaires
                    </FormLabel>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        isSelected={formData.photographers}
                        onValueChange={(checked) => handleInputChange('photographers', checked)}
                      >
                        Photographe
                      </Checkbox>
                      <Checkbox
                        isSelected={formData.videographers}
                        onValueChange={(checked) => handleInputChange('videographers', checked)}
                      >
                        Vidéaste
                      </Checkbox>
                    </div>
                  </div>
                )}

                {/* Date de publication avec sélection de créneau */}
                {eventType === 'publication' && (
                  <div>
                    <FormLabel htmlFor="startDate" isRequired={true}>
                      Date de publication
                    </FormLabel>
                    <div
                      className={`p-3 border rounded-lg transition-colors ${selectedClient
                          ? "border-gray-300 bg-white cursor-pointer hover:border-blue-400"
                          : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                        }`}
                      onClick={() => {
                        if (selectedClient) {
                          setIsSlotModalOpen(true);
                        }
                      }}
                      role="button"
                      tabIndex={selectedClient ? 0 : -1}
                      onKeyDown={(e) => {
                        if (selectedClient && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setIsSlotModalOpen(true);
                        }
                      }}
                    >
                      {formData.startDate ? (
                        <span className="text-gray-900">
                          {new Date(formData.startDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} - 18h00 - 19h00
                        </span>
                      ) : (
                        <span className={selectedClient ? "text-gray-500" : "text-gray-400"}>
                          {selectedClient
                            ? "Cliquez pour sélectionner un créneau"
                            : "Sélectionnez d'abord un établissement"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates et heures pour les autres types d'événements */}
                {eventType !== 'publication' && (
                  <div >
                    <div>
                      <FormLabel htmlFor="startDate" isRequired={true}>
                        Date
                      </FormLabel>
                        <Input
                          classNames={{
                            inputWrapper: "bg-page-bg",
                          }}
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          required
                        />
                    </div>


                  </div>
                )}

                {/* Champs de date et heure de fin */}
                {eventType !== 'publication' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel htmlFor="startTime" isRequired={true}>
                        Heure de début
                      </FormLabel>
                      <Input
                        classNames={{
                          inputWrapper: "bg-page-bg",
                        }}
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="endTime" isRequired={true}>
                        Heure de fin
                      </FormLabel>
                      <Input
                        classNames={{
                          inputWrapper: "bg-page-bg",
                        }}
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        defaultValue={formData.startTime}
                      />
                    </div>
                  </div>
                )}

              </div>
            </ModalBody>

            <ModalFooter className="flex justify-between">
              <Button
                className="flex-1 border-1"
                color="primary"
                variant="light"
                onPress={handleClose}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                color="primary"
                type="submit"
                isLoading={isLoading}
              >
                {eventType === 'google-calendar' ? 'Créer dans Google Calendar' : "Créer l'événement"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de sélection de créneaux pour les publications */}
      {eventType === 'publication' && (
        <SlotSelectionModal
          isOpen={isSlotModalOpen}
          onClose={() => setIsSlotModalOpen(false)}
          onSelectSlot={handleSlotSelection}
          category={selectedClient?.categorie}
          ville={selectedClient?.villeEpicu}
        />
      )}
    </>
  );
}
