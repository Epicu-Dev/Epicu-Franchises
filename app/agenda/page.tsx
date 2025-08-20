"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@heroui/spinner";

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

interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: Event[];
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"semaine" | "mois">("mois");
  const [selectedCategory, setSelectedCategory] = useState<string>("tout");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // États pour les différents modals
  const [isTournageModalOpen, setIsTournageModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        month: (currentDate.getMonth() + 1).toString(),
        year: currentDate.getFullYear().toString(),
        day: currentDate.getDate().toString(),
        view,
        category: selectedCategory,
      });

      const response = await fetch(`/api/agenda?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des événements");
      }

      const data = await response.json();

      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view, selectedCategory]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);

      if (view === "semaine") {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setMonth(prev.getMonth() - 1);
      }

      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);

      if (view === "semaine") {
        newDate.setDate(prev.getDate() + 7);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }

      return newDate;
    });
  };

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
      fetchEvents();
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
      fetchEvents();
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
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const getEventTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "rendez-vous":
        return "primary";
      case "tournage":
        return "secondary";
      case "publication":
        return "success";
      case "evenement":
        return "warning";
      default:
        return "default";
    }
  };

  const getEventTypeLabel = (type: Event["type"]) => {
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

  const formatMonthYear = (date: Date) => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);

    startOfWeek.setDate(date.getDate() - date.getDay() + 1);

    const endOfWeek = new Date(startOfWeek);

    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${months[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
    } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
      return `${startOfWeek.getDate()} ${months[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${months[endOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
    } else {
      return `${startOfWeek.getDate()} ${months[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()} - ${endOfWeek.getDate()} ${months[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || days.length < 42) {
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.date);

        return eventDate.toDateString() === currentDate.toDateString();
      });

      days.push({
        date: currentDate.toISOString().split("T")[0],
        dayNumber: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        events: dayEvents,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);

    startOfWeek.setDate(date.getDate() - date.getDay() + 1);

    const weekDays: WeekDay[] = [];
    const dayNames = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);

      currentDate.setDate(startOfWeek.getDate() + i);

      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.date);

        return eventDate.toDateString() === currentDate.toDateString();
      });

      weekDays.push({
        date: currentDate,
        dayName: dayNames[i],
        dayNumber: currentDate.getDate(),
        isToday: currentDate.toDateString() === new Date().toDateString(),
        events: dayEvents,
      });
    }

    return weekDays;
  };

  const renderCalendarView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];

    return (
      <div className="w-full">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-gray-600 text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 p-2 border border-gray-200 ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${day.isToday ? "ring-2 ring-red-500" : ""}`}
            >
              <div
                className={`text-sm font-medium ${day.isToday
                  ? "text-red-600"
                  : day.isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
                  }`}
              >
                {day.dayNumber}
              </div>

              <div className="mt-1 space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded ${event.type === "rendez-vous"
                      ? "bg-blue-100 text-blue-800"
                      : event.type === "tournage"
                        ? "bg-pink-100 text-pink-800"
                        : event.type === "publication"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {event.startTime}
                    </div>
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{day.events.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const timeSlots = Array.from({ length: 13 }, (_, i) => i + 6); // 6h à 18h

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="p-2 text-center font-medium text-gray-600 text-sm">
              Heure
            </div>
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
                className="p-2 text-center font-medium text-gray-600 text-sm"
              >
                <div className="font-bold">{day.dayName}</div>
                <div
                  className={`text-lg ${day.isToday ? "text-red-600 font-bold" : "text-gray-900"}`}
                >
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Grille horaire */}
          <div className="grid grid-cols-8 gap-1">
            {timeSlots.map((hour) => (
              <div key={hour} className="contents">
                {/* Heure */}
                <div className="p-2 text-sm text-gray-500 text-right pr-4 border-r border-gray-200">
                  {hour}:00
                </div>

                {/* Cellules des jours */}
                {weekDays.map((day) => {
                  const hourEvents = day.events.filter((event) => {
                    const eventStartHour = parseInt(
                      event.startTime.split(":")[0]
                    );

                    return eventStartHour === hour;
                  });

                  return (
                    <div
                      key={`${day.date.toISOString()}-${hour}`}
                      className={`min-h-20 p-1 border border-gray-200 relative ${day.isToday ? "bg-red-50" : "bg-white"
                        }`}
                    >
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded mb-1 ${event.type === "rendez-vous"
                            ? "bg-blue-100 text-blue-800"
                            : event.type === "tournage"
                              ? "bg-pink-100 text-pink-800"
                              : event.type === "publication"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          title={`${event.title} (${event.startTime} - ${event.endTime})`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-75 mt-0.5">
                            {event.startTime} - {event.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    return (
      <div className="w-full">
        <div className="space-y-4">
          {events
            .filter((event) => {
              if (selectedCategory !== "tout") {
                return event.category === selectedCategory;
              }

              return true;
            })
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((event) => {
              const eventDate = new Date(event.date);
              const formattedDate = eventDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              });

              return (
                <div
                  key={event.id}
                  className="flex items-center space-x-4 p-3 bg-white rounded-lg border"
                >
                  <div className="flex-shrink-0 w-20 text-sm text-gray-600">
                    {formattedDate}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Chip
                        color={getEventTypeColor(event.type)}
                        size="sm"
                        variant="flat"
                      >
                        {getEventTypeLabel(event.type)}
                      </Chip>
                      <span className="font-medium">{event.title}</span>
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      {event.startTime} - {event.endTime}
                      {event.location && ` • ${event.location}`}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Erreur: {error}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardBody className="p-6">
          {/* En-tête avec navigation et boutons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  isIconOnly
                  variant="light"
                  onPress={handlePreviousMonth}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold">
                  {view === "semaine"
                    ? formatWeekRange(currentDate)
                    : formatMonthYear(currentDate)}
                </span>
                <Button isIconOnly variant="light" onPress={handleNextMonth}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onPress={() => {
                  setError(null);
                  setFieldErrors({});
                  setIsRdvModalOpen(true);
                }}
              >
                Créer un rendez-vous
              </Button>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onPress={() => {
                  setError(null);
                  setFieldErrors({});
                  setIsTournageModalOpen(true);
                }}
              >
                Ajouter un tournage
              </Button>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onPress={() => {
                  setError(null);
                  setFieldErrors({});
                  setIsPublicationModalOpen(true);
                }}
              >
                Ajouter une publication
              </Button>
            </div>
          </div>

          {/* Filtres et vues */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Select
                className="w-48"
                placeholder="Catégorie"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="tout">Tout</SelectItem>
                <SelectItem key="siege">Siège</SelectItem>
                <SelectItem key="franchises">Franchisés</SelectItem>
                <SelectItem key="prestataires">Prestataires</SelectItem>
              </Select>
            </div>

            <div className="flex items-center space-x-2">

              <Button
                color={view === "semaine" ? "primary" : "default"}
                size="sm"
                variant={view === "semaine" ? "solid" : "light"}
                onPress={() => setView("semaine")}
              >
                Semaine
              </Button>
              <Button
                color={view === "mois" ? "primary" : "default"}
                size="sm"
                variant={view === "mois" ? "solid" : "light"}
                onPress={() => setView("mois")}
              >
                Mois
              </Button>
              <Button isIconOnly size="sm" variant="light">
                <Bars3Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu du calendrier */}
          <div className="mt-6">
            {view === "mois" && renderCalendarView()}
            {view === "semaine" && renderWeekView()}
          </div>
        </CardBody>
      </Card>

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
    </div>
  );
}
