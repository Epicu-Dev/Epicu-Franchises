"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { TrashIcon, CalendarIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";

import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { getEventColorFromEstablishmentCategories } from "@/components/badges";

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
  isGoogleEvent?: boolean;
  htmlLink?: string;
  establishmentCategories?: string[];
}

interface EventDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEventDeleted: () => void;
}

export function EventDetailModal({ isOpen, onOpenChange, event, onEventDeleted }: EventDetailModalProps) {
  const { authFetch } = useAuthFetch();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    if (!event) return;

    // Demander confirmation avant suppression
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Si c'est un événement Google Calendar, le supprimer de Google Calendar
      if (event.isGoogleEvent && event.id.startsWith('google-')) {
        const googleEventId = event.id.replace('google-', '');
        const response = await authFetch(`/api/google-calendar/events/delete?eventId=${googleEventId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de l'événement Google Calendar");
        }
      } else {
        // Supprimer l'événement de l'agenda Airtable
        const response = await authFetch(`/api/agenda?id=${event.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de l'événement");
        }
      }

      onEventDeleted();
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l&apos;événement');
    } finally {
      setIsDeleting(false);
    }
  };

  const getEventColor = (event: Event) => {
    if (event.establishmentCategories && event.establishmentCategories.length > 0) {
      return getEventColorFromEstablishmentCategories(event.establishmentCategories);
    }

    switch (event.type) {
      case "rendez-vous":
        return "bg-custom-blue-rdv/14 text-custom-blue-rdv";
      case "tournage":
        return "bg-custom-rose/14 text-custom-rose";
      case "publication":
        return "bg-custom-blue-pub/14 text-custom-blue-pub";
      case "evenement":
        return "bg-custom-orange-event/14 text-custom-orange-event";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "rendez-vous":
        return "Rendez-vous";
      case "tournage":
        return "Tournage";
      case "publication":
        return "Publication";
      case "evenement":
        return "Événement";
      default:
        return type;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "siege":
        return "Siège";
      case "franchises":
        return "Franchises";
      case "prestataires":
        return "Prestataires";
      default:
        return category;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      size="2xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-semibold text-primary">{event.title}</h2>
                <div className="flex items-center gap-2">
                  <Chip
                    className={getEventColor(event)}
                    size="sm"
                    variant="flat"
                  >
                    {getTypeLabel(event.type)}
                  </Chip>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Date et heure */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Date et heure
                  </h3>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(event.date)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                {event.location && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      Localisation
                    </h3>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <MapPinIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <p className="text-gray-900 dark:text-gray-100">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      Description
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Informations supplémentaires */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Informations
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Catégorie</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getCategoryLabel(event.category)}</p>
                    </div>
                    {event.establishmentCategories && event.establishmentCategories.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Établissements</p>
                        <div className="flex flex-wrap gap-1">
                          {event.establishmentCategories.map((category, index) => (
                            <Chip
                              key={index}
                              className={getEventColorFromEstablishmentCategories([category])}
                              size="sm"
                              variant="flat"
                            >
                              {category}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lien Google Calendar */}
                {event.isGoogleEvent && event.htmlLink && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      Google Calendar
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Événement Google Calendar</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Cliquez pour ouvrir dans Google Calendar
                        </p>
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() => window.open(event.htmlLink, '_blank')}
                      >
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button 
                color="danger" 
                isLoading={isDeleting}
                startContent={<TrashIcon className="h-4 w-4" />}
                variant="flat" 
                onPress={handleDelete}
              >
                Supprimer l&apos;événement
              </Button>
              <Button 
                color="primary" 
                variant="light" 
                onPress={onClose}
              >
                Fermer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
