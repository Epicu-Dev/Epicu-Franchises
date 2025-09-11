"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { GoogleCalendarEvent } from "@/types/googleCalendar";

interface GoogleCalendarCreateEventProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: (event: GoogleCalendarEvent) => void;
}

export function GoogleCalendarCreateEvent({ 
  isOpen, 
  onOpenChange, 
  onEventCreated 
}: GoogleCalendarCreateEventProps) {
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Préparer les données de l'événement
      const eventData: Partial<GoogleCalendarEvent> = {
        summary: formData.summary,
        description: formData.description || undefined,
        location: formData.location || undefined,
        start: formData.allDay 
          ? { date: formData.startDate }
          : { 
              dateTime: `${formData.startDate}T${formData.startTime}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
        end: formData.allDay
          ? { date: formData.endDate || formData.startDate }
          : { 
              dateTime: `${formData.endDate || formData.startDate}T${formData.endTime || formData.startTime}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
      };

      // Créer l'événement via l'API
      const response = await fetch('/api/google-calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const createdEvent = await response.json();
        onEventCreated(createdEvent);
        onOpenChange(false);
        
        // Réinitialiser le formulaire
        setFormData({
          summary: '',
          description: '',
          location: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          allDay: false
        });
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      alert('Erreur lors de la création de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Définir la date d'aujourd'hui comme valeur par défaut
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Créer un événement Google Calendar
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titre de l'événement *"
                placeholder="Ex: Réunion équipe"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Description de l'événement (optionnel)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />

              <Input
                label="Lieu"
                placeholder="Ex: Bureau principal"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => handleInputChange('allDay', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="allDay" className="text-sm text-gray-700">
                  Toute la journée
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date de début *"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  defaultValue={today}
                  required
                />

                {!formData.allDay && (
                  <Input
                    label="Heure de début"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    required
                  />
                )}
              </div>

              {!formData.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Date de fin"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    defaultValue={formData.startDate || today}
                  />

                  <Input
                    label="Heure de fin"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    defaultValue={formData.startTime}
                  />
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button 
              color="danger" 
              variant="light" 
              onPress={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              type="submit"
              isLoading={isLoading}
            >
              Créer l&apos;événement
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
