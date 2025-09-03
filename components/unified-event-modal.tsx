"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";
import { GoogleCalendarEvent } from "@/types/googleCalendar";
import { Client } from "@/app/api/clients/data";
import { FormLabel } from "./form-label";

type EventType = "tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar";

interface Category {
  id: string;
  name: string;
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
  // États communs
  const [formData, setFormData] = useState({
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
    establishmentName: '',
    categoryId: '',
    categoryName: '',
    appointmentType: '',

    // Champs spécifiques événement
    eventFor: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Charger les clients et catégories
  useEffect(() => {
    if (isOpen && (eventType === 'tournage' || eventType === 'publication')) {
      fetchClients();
    }
    if (isOpen && eventType === 'rendez-vous') {
      fetchCategories();
    }
  }, [isOpen, eventType]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.results || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

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
      alert('Erreur lors de la création de l\'événement');
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

    const response = await fetch('/api/google-calendar/events', {
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

    if (eventType === 'tournage') {
      // Créer l'événement de tournage
      const tournageEvent = {
        title: `Tournage - ${formData.selectedClient?.nomEtablissement || 'Client'}`,
        type: "tournage",
        date: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.selectedClient?.nomEtablissement || formData.location,
        description: `Tournage avec ${formData.photographers ? "photographe" : ""}${formData.photographers && formData.videographers ? " et " : ""}${formData.videographers ? "vidéaste" : ""}${formData.description ? ` - ${formData.description}` : ""}`,
        category: "siege",
      };
      events.push(tournageEvent);

    } else if (eventType === 'publication') {
      // Créer l'événement de publication
      const publicationEvent = {
        title: `Publication - ${formData.selectedClient?.nomEtablissement || 'Client'}`,
        type: "publication",
        date: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.selectedClient?.nomEtablissement || formData.location,
        description: `Publication ${formData.selectedClient?.categorie || ''} - Gagnant: ${formData.winner || "À déterminer"} - Tirage: ${formData.drawCompleted ? "Effectué" : "En attente"}${formData.description ? ` - ${formData.description}` : ""}`,
        category: "siege",
      };
      events.push(publicationEvent);

    } else if (eventType === 'rendez-vous') {
      const rdvEvent = {
        title: `RDV - ${formData.establishmentName}`,
        type: "rendez-vous",
        date: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.establishmentName,
        description: `Rendez-vous ${formData.appointmentType} - Catégorie: ${formData.categoryName}${formData.description ? ` - ${formData.description}` : ""}`,
        category: "siege",
      };
      events.push(rdvEvent);

    } else if (eventType === 'evenement') {
      const eventData = {
        title: formData.summary,
        type: "evenement",
        date: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location || undefined,
        description: formData.description || undefined,
        category: "siege",
      };
      events.push(eventData);
    }

    // Créer les événements via l'API
    for (const eventData of events) {
      const response = await fetch("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de l'événement");
      }
    }

    onEventAdded?.();
    handleClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-calculer l'heure de fin quand l'heure de début change
    if (field === 'startTime' && value) {
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
      establishmentName: '',
      categoryId: '',
      categoryName: '',
      appointmentType: '',
      eventFor: ''
    });
    setClientSearchQuery('');
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

  // Filtrer les clients selon la recherche
  const filteredClients = clients.filter(client =>
    client.nomEtablissement.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.raisonSociale.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {getModalTitle()}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">

              {/* Sélection de client pour tournage et publication */}
              {(eventType === 'tournage' || eventType === 'publication') && (
                <div className="space-y-2">
                  <FormLabel htmlFor="clientSearch" isRequired={true}>
                    Client
                  </FormLabel>
                  <Input
                    placeholder="Rechercher un client..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                  />
                  {clientSearchQuery && filteredClients.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {filteredClients.slice(0, 5).map((client) => (
                        <div
                          key={client.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            handleInputChange('selectedClient', client);
                            const title = eventType === 'tournage'
                              ? `Tournage - ${client.nomEtablissement}`
                              : `Publication - ${client.nomEtablissement}`;
                            handleInputChange('summary', title);
                            handleInputChange('location', client.nomEtablissement);
                            setClientSearchQuery('');
                          }}
                        >
                          <div className="font-medium">{client.nomEtablissement}</div>
                          <div className="text-sm text-gray-600">{client.raisonSociale}</div>
                          <div className="text-xs text-gray-500">{client.ville} - {client.categorie}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.selectedClient && (
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <div className="font-medium">Client sélectionné:</div>
                      <div>{formData.selectedClient.nomEtablissement}</div>
                      <div className="text-sm text-gray-600">{formData.selectedClient.ville} - {formData.selectedClient.categorie}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Nom de l'établissement pour rendez-vous */}
              {eventType === 'rendez-vous' && (
                <>
                  <FormLabel htmlFor="establishmentName" isRequired={true}>
                    Nom de l'établissement
                  </FormLabel>
                  <Input
                    id="establishmentName"
                    placeholder="Nom de l'établissement"
                    value={formData.establishmentName}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange('establishmentName', value);
                      // Auto-remplir le titre
                      if (value) {
                        handleInputChange('summary', `RDV - ${value}`);
                        handleInputChange('location', value);
                      }
                    }}
                    required
                  />
                </>

              )}

              {/* Catégorie pour rendez-vous */}
              {eventType === 'rendez-vous' && (
                <>
                  <FormLabel htmlFor="categoryId" isRequired={true}>
                    Catégorie
                  </FormLabel>
                  <Select
                    id="categoryId"
                    placeholder="Sélectionner une catégorie"
                    selectedKeys={formData.categoryId ? [formData.categoryId] : []}
                    onSelectionChange={(keys) => {
                      const selectedId = Array.from(keys)[0] as string;
                      const selectedCategory = categories.find(cat => cat.id === selectedId);
                      handleInputChange('categoryId', selectedId);
                      handleInputChange('categoryName', selectedCategory?.name || '');
                    }}
                    required
                  >
                    {categories.map((category) => (
                      <SelectItem key={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </Select>
                </>

              )}

              {/* Type de rendez-vous */}
              {eventType === 'rendez-vous' && (
                <>
                  <FormLabel htmlFor="appointmentType" isRequired={true}>
                    Type de rendez-vous
                  </FormLabel>
                  <Input
                    id="appointmentType"
                    placeholder="Ex: Fidélisation"
                    value={formData.appointmentType}
                    onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                    required
                  />
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
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  required
                />}

              {/* Dropdowns pour événement */}
              {eventType === 'evenement' && (
                <>
                  <FormLabel htmlFor="appointmentType" isRequired={true}>
                    Type d'événement
                  </FormLabel>
                  <Select
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
                  </Select>

                  <FormLabel htmlFor="eventFor" isRequired={true}>
                    Pour qui
                  </FormLabel>
                  <Select
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
                  </Select>
                </>
              )}

              {/* Description */}
              <FormLabel htmlFor="description" isRequired={true}>
                Description
              </FormLabel>
              <Textarea
                id="description"
                placeholder="Description de l'événement (optionnel)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />

              {/* Lieu */}
              {(eventType === 'google-calendar' || eventType === 'evenement') && (
                <>
                  <FormLabel htmlFor="location" isRequired={true}>
                    Lieu
                  </FormLabel>
                  <Input
                    id="location"
                    placeholder="Ex: Bureau principal"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </>
              )}

              {/* Gagnant pour publication */}
              {eventType === 'publication' && (
                <>
                  <FormLabel htmlFor="winner" isRequired={true}>
                    Gagnant
                  </FormLabel>
                  <Input
                    id="winner"
                    placeholder="Nom Prénom"
                    value={formData.winner}
                    onChange={(e) => handleInputChange('winner', e.target.value)}
                  />
                </>
              )}

              {/* Switch tirage au sort pour publication */}
              {eventType === 'publication' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tirage au sort effectué</span>
                  <Switch
                    isSelected={formData.drawCompleted}
                    onValueChange={(checked) => handleInputChange('drawCompleted', checked)}
                  />
                </div>
              )}

              {/* Checkboxes prestataires pour tournage */}
              {eventType === 'tournage' && (
                <div className="space-y-2">
                  <FormLabel htmlFor="prestataires" isRequired={true}>
                    Prestataires
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

              {/* Dates et heures */}
              <div className="grid grid-cols-2 gap-4">
                <div>

                  <FormLabel htmlFor="startDate" isRequired={true}>
                    Date de début
                  </FormLabel>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    defaultValue={today}
                    required
                  />
                </div>


                <div>
                  <FormLabel htmlFor="startTime" isRequired={true}>
                    Heure de début
                  </FormLabel>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    required
                  />


                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="endDate" isRequired={true}>
                    Date de fin
                  </FormLabel>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    defaultValue={formData.startDate || today}
                  />
                </div>

                <div>
                  <FormLabel htmlFor="endTime" isRequired={true}>
                    Heure de fin
                  </FormLabel>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    defaultValue={formData.startTime}
                  />
                </div>
              </div>

            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isLoading}
            >
              {eventType === 'google-calendar' ? 'Créer dans Google Calendar' : 'Créer l\'événement'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
