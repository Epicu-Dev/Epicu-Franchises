"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { UnifiedEventModal } from "@/components/unified-event-modal";
import { EventDetailModal } from "@/components/event-detail-modal";
import { AgendaDropdown } from "@/components/agenda-dropdown";
import { GoogleCalendarEvent } from "@/types/googleCalendar";
import { useUser } from "@/contexts/user-context";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { GoogleCalendarSync } from "@/components/google-calendar-sync";

interface Event {
  id: string;
  title: string;
  type: "rendez-vous" | "tournage" | "publication" | "evenement" | "google-agenda";
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  category: "siege" | "franchises" | "prestataires";
  isGoogleEvent?: boolean; // Marqueur pour identifier les événements Google Calendar
  htmlLink?: string; // Lien vers l'événement dans Google Calendar
  establishmentCategories?: string[]; // Catégories des établissements associés
  googleEventId?: string; // ID de l'événement dans Google Calendar
  creneauId?: string; // ID du créneau de publication associé (extrait du champ de liaison)
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

// Interface pour les données de l'API agenda
interface ApiEvent {
  id: string;
  task: string;
  date: string;
  dateFinRdv?: string; // Nouveau champ pour la date de fin du rendez-vous
  type: string;
  description?: string;
  collaborators?: string[];
  establishmentCategories?: string[];
  googleEventId?: string; // ID de l'événement dans Google Calendar
  creneauId?: string; // ID du créneau de publication associé (extrait du champ de liaison)
}

export default function AgendaPage() {
  const { userProfile } = useUser();
  const { authFetch } = useAuthFetch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"semaine" | "mois" | "planning">("planning");
  const [selectedCategory] = useState<string>("tout");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingGoogleConnection, setIsCheckingGoogleConnection] = useState(false);

  // États pour la modal unifiée
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<"tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar">("tournage");
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [hasEpicuCalendar, setHasEpicuCalendar] = useState<boolean>(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string>('');

  // États pour la modal de détail d'événement
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Référence pour le conteneur scrollable de la vue planning
  const planningScrollRef = useRef<HTMLDivElement>(null);

  // Fonction pour vérifier si l'utilisateur peut ajouter des événements (même logique que la sidebar)
  const canAddEvents = () => {
    if (!userProfile?.role) {
      return false;
    }

    // Mapper les rôles de l'API vers les permissions
    const roleMapping: { [key: string]: boolean } = {
      'Admin': true,
      'Franchisé': false,
      'Collaborateur': false,
    };

    return roleMapping[userProfile.role] || false;
  };

  // Gestionnaires pour Google Calendar

  const handleGoogleEventCreated = (event: GoogleCalendarEvent) => {
    // Ajouter l'événement créé à la liste locale
    setGoogleEvents(prev => [event, ...prev]);
  };

  // Fonctions pour ouvrir les modals avec le bon type
  const openModal = (type: "tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar") => {
    setCurrentEventType(type);
    setIsUnifiedModalOpen(true);
  };

  // Fonction pour ouvrir la modal de détail d'événement
  const openEventDetailModal = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailModalOpen(true);
  };

  // Fonction appelée après suppression d'un événement
  const handleEventDeleted = () => {
    // Recharger les événements
    fetchEvents();
  };

  // Fonction pour connecter à Google Calendar
  const connectToGoogleCalendar = async () => {
    try {
      const response = await authFetch('/api/google-calendar/auth');

      if (response.ok) {
        const { authUrl } = await response.json();

        window.location.href = authUrl;
      }
    } catch {
      // Erreur lors de la connexion
      setError('Erreur lors de la connexion à Google Calendar');
    }
  };

  // Fonction pour synchroniser les événements Google Calendar
  const syncGoogleEvents = async () => {
    try {
      const response = await authFetch('/api/google-calendar/sync');

      if (response.ok) {
        const { events } = await response.json();
        setGoogleEvents(events);
        // Re-vérifier le statut après synchronisation
        checkGoogleCalendarStatus();
      }
    } catch {
      // Erreur lors de la synchronisation
      setError('Erreur lors de la synchronisation avec Google Calendar');
    }
  };

  // Fonction pour se déconnecter de Google Calendar
  const disconnectFromGoogleCalendar = async () => {
    try {
      const response = await authFetch('/api/google-calendar/disconnect', {
        method: 'POST'
      });

      if (response.ok) {
        // Réinitialiser les états
        setIsGoogleConnected(false);
        setHasEpicuCalendar(false);
        setGoogleUserEmail('');
        setGoogleEvents([]);
      }
    } catch {
      // Erreur lors de la déconnexion
      setError('Erreur lors de la déconnexion de Google Calendar');
    }
  };

  // Vérifier le statut de Google Calendar en arrière-plan
  const checkGoogleCalendarStatus = async () => {
    try {
      const response = await authFetch('/api/google-calendar/status');

      if (response.ok) {
        const status = await response.json();

        setIsGoogleConnected(status.isConnected);

        // Vérifier s'il y a un calendrier EPICU et extraire l'email
        if (status.isConnected && status.calendars) {
          const hasEpicu = status.calendars.some((calendar: any) =>
            calendar.summary?.toLowerCase().includes('epicu agenda')
          );
          setHasEpicuCalendar(hasEpicu);

          // Extraire l'email du calendrier principal (primary)
          const primaryCalendar = status.calendars.find((calendar: any) => calendar.primary);
          if (primaryCalendar && primaryCalendar.id) {
            // L'ID du calendrier principal contient l'email de l'utilisateur
            setGoogleUserEmail(primaryCalendar.id);
          }
        } else {
          setHasEpicuCalendar(false);
          setGoogleUserEmail('');
        }
      } else {
        // Si pas connecté, déconnecter automatiquement
        setIsGoogleConnected(false);
        setHasEpicuCalendar(false);
        setGoogleUserEmail('');
      }
    } catch {
      // Erreur lors de la vérification du statut - déconnecter automatiquement
      setIsGoogleConnected(false);
      setHasEpicuCalendar(false);
      setGoogleUserEmail('');
    }
  };


  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le statut Google Calendar en arrière-plan (non bloquant)
      checkGoogleCalendarStatus();

      // Calculer les dates de début et fin selon la vue
      let dateStart: string;
      let dateEnd: string;

      if (view === "semaine") {
        const startOfWeek = new Date(currentDate);

        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);

        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        dateStart = startOfWeek.toISOString().split('T')[0];
        dateEnd = endOfWeek.toISOString().split('T')[0];
      } else {
        // Vue mois - étendre la plage pour inclure les mois précédents et suivants
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Étendre la plage pour couvrir les jours visibles du calendrier (6 semaines)
        const startOfCalendar = new Date(startOfMonth);
        startOfCalendar.setDate(startOfMonth.getDate() - startOfMonth.getDay() + 1);

        const endOfCalendar = new Date(endOfMonth);
        endOfCalendar.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));
        endOfCalendar.setHours(23, 59, 59, 999);

        dateStart = startOfCalendar.toISOString().split('T')[0];
        dateEnd = endOfCalendar.toISOString().split('T')[0];
      }

      const params = new URLSearchParams({
        dateStart,
        dateEnd,
      });

      const response = await authFetch(`/api/agenda?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des événements");
      }

      const data = await response.json();

      // Transformer les données de l'API en format Event
      const transformedEvents: Event[] = (data.events || []).map((apiEvent: ApiEvent) => {
        const eventDate = new Date(apiEvent.date);
        const startTime = eventDate.toTimeString().slice(0, 5);

        // Utiliser la date de fin du rendez-vous si disponible, sinon calculer +1h
        let endTime: string;
        if (apiEvent.dateFinRdv) {
          const endDate = new Date(apiEvent.dateFinRdv);
          endTime = endDate.toTimeString().slice(0, 5);
        } else {
          // Calculer l'heure de fin (par défaut +1h)
          const endDate = new Date(eventDate);
          endDate.setHours(endDate.getHours() + 1);
          endTime = endDate.toTimeString().slice(0, 5);
        }

        // Mapper le type de l'API vers le type de l'interface
        let mappedType: Event['type'] = "evenement";

        if (apiEvent.type.toLowerCase().includes("rendez") || apiEvent.type.toLowerCase().includes("rdv")) {
          mappedType = "rendez-vous";
        } else if (apiEvent.type.toLowerCase().includes("tournage")) {
          mappedType = "tournage";
        } else if (apiEvent.type.toLowerCase().includes("publication")) {
          mappedType = "publication";
        } else if (apiEvent.type.toLowerCase().includes("google-agenda")) {
          mappedType = "google-agenda";
        }

        // Déterminer la catégorie (par défaut siège)
        let category: Event['category'] = "siege";

        if (apiEvent.type.toLowerCase().includes("franchise")) {
          category = "franchises";
        } else if (apiEvent.type.toLowerCase().includes("prestataire")) {
          category = "prestataires";
        }



        return {
          id: apiEvent.id,
          title: apiEvent.task,
          type: mappedType,
          date: apiEvent.date.split('T')[0], // Extraire juste la date
          startTime,
          endTime,
          description: apiEvent.description,
          category,
          establishmentCategories: apiEvent.establishmentCategories,
          googleEventId: apiEvent.googleEventId, // Inclure l'ID Google Calendar
          creneauId: apiEvent.creneauId, // Inclure l'ID du créneau (extrait du champ de liaison)
        };
      });

      // Filtrer par catégorie si nécessaire
      const filteredEvents = selectedCategory === "tout"
        ? transformedEvents
        : transformedEvents.filter(event => event.category === selectedCategory);

      setEvents(filteredEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view, selectedCategory]);

  // Effet pour scroller vers la date du jour dans la vue planning
  useEffect(() => {
    if (view === "planning" && !loading && events.length > 0) {
      // Délai pour s'assurer que le DOM est rendu
      const timeoutId = setTimeout(() => {
        scrollToTodayInPlanning();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [view, loading, events]);

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
        // Vérifier si on ne dépasse pas M+5 (mois actuel + 5 mois)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const maxMonth = currentMonth + 12;
        const maxYear = currentYear + Math.floor(maxMonth / 12);
        const maxMonthInYear = maxMonth % 12;

        const newMonth = prev.getMonth() + 1;
        const newYear = prev.getFullYear() + Math.floor(newMonth / 12);
        const newMonthInYear = newMonth % 12;

        // Si on dépasse la limite M+5, ne pas avancer
        if (newYear > maxYear || (newYear === maxYear && newMonthInYear > maxMonthInYear)) {
          return prev;
        }

        newDate.setMonth(prev.getMonth() + 1);
      }

      return newDate;
    });
  };

  // Fonction pour vérifier si on peut avancer au mois suivant
  const canGoToNextMonth = (currentDate: Date) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const maxMonth = currentMonth + 12;
    const maxYear = currentYear + Math.floor(maxMonth / 12);
    const maxMonthInYear = maxMonth % 12;

    const newMonth = currentDate.getMonth() + 1;
    const newYear = currentDate.getFullYear() + Math.floor(newMonth / 12);
    const newMonthInYear = newMonth % 12;

    return !(newYear > maxYear || (newYear === maxYear && newMonthInYear > maxMonthInYear));
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

  // Fonction pour scroller vers la date du jour dans la vue planning
  const scrollToTodayInPlanning = () => {
    if (view !== "planning" || !planningScrollRef.current) {
      return;
    }

    const today = new Date();
    const todayString = today.toDateString();

    // Trouver l'élément correspondant à la date du jour
    const todayElement = planningScrollRef.current.querySelector(`[data-date="${todayString}"]`);

    if (todayElement) {
      // Scroller vers l'élément d'aujourd'hui
      todayElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } else {
      // Si pas d'événement aujourd'hui, trouver l'événement le plus proche
      const allDateElements = planningScrollRef.current.querySelectorAll('[data-date]');
      let closestElement: HTMLElement | null = null;
      let minDiff = Infinity;

      allDateElements.forEach((element) => {
        const elementDate = new Date(element.getAttribute('data-date') || '');
        const diff = Math.abs(elementDate.getTime() - today.getTime());

        if (diff < minDiff) {
          minDiff = diff;
          closestElement = element as HTMLElement;
        }
      });

      if (closestElement) {
        (closestElement as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  // Fonction pour filtrer les événements par mois
  const filterEventsByMonth = (events: Event[], targetDate: Date) => {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === targetYear && eventDate.getMonth() === targetMonth;
    });
  };

  // Fonction pour dédupliquer les événements (priorité à Airtable)
  const deduplicateEvents = (airtableEvents: Event[], googleEvents: GoogleCalendarEvent[]) => {
    const uniqueEvents = new Map<string, Event>();

    // D'abord, ajouter tous les événements d'Airtable
    airtableEvents.forEach(event => {
      uniqueEvents.set(event.id, event);
    });

    // Ensuite, ajouter les événements Google seulement s'ils n'ont pas de correspondance Airtable
    googleEvents.forEach(googleEvent => {
      // Vérifier si cet événement Google a un correspondant dans Airtable
      const hasAirtableCorrespondent = airtableEvents.some(airtableEvent =>
        airtableEvent.googleEventId === googleEvent.id
      );

      // Si pas de correspondant Airtable, ajouter l'événement Google
      if (!hasAirtableCorrespondent) {
        const startDate = googleEvent.start.dateTime
          ? new Date(googleEvent.start.dateTime)
          : googleEvent.start.date
            ? new Date(googleEvent.start.date)
            : new Date();

        const endDate = googleEvent.end.dateTime
          ? new Date(googleEvent.end.dateTime)
          : googleEvent.end.date
            ? new Date(googleEvent.end.date)
            : new Date(startDate.getTime() + 60 * 60 * 1000); // +1h par défaut

        const startTime = startDate.toTimeString().slice(0, 5);
        const endTime = endDate.toTimeString().slice(0, 5);

        const transformedGoogleEvent: Event = {
          id: `google-${googleEvent.id || Date.now()}`,
          title: googleEvent.summary,
          type: "google-agenda" as Event['type'],
          date: startDate.toISOString().split('T')[0],
          startTime,
          endTime,
          location: googleEvent.location,
          description: googleEvent.description,
          category: "siege" as Event['category'],
          isGoogleEvent: true,
          htmlLink: googleEvent.htmlLink,
        };

        uniqueEvents.set(transformedGoogleEvent.id, transformedGoogleEvent);
      }
    });

    // Trier les événements par date et heure de début
    return Array.from(uniqueEvents.values()).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Fonction helper pour obtenir la couleur d'un événement
  const getEventColor = (event: Event) => {
    // Couleur spécifique pour les événements Google Agenda
    if (event.type === "google-agenda") {
      return "bg-gray-100 text-gray-800";
    }

    // Sinon, utiliser les couleurs par type d'événement (comportement actuel)
    switch (event.type) {
      case "tournage":
        return "bg-custom-green-filming/14 text-custom-green-filming";
      case "publication":
        return "bg-custom-red-publication/14 text-custom-red-publication";
      case "evenement":
        return "bg-custom-orange-event/14 text-custom-orange-event";
      case "rendez-vous":
        return "bg-custom-blue-meeting/14 text-custom-blue-meeting";
      default:
        return "bg-custom-text-color text-custom-text-color";
    }
  };
  // Fonction helper pour obtenir la couleur d'un événement
  const getEventBorderColor = (event: Event) => {
    // Couleur spécifique pour les événements Google Agenda
    if (event.type === "google-agenda") {
      return "border-gray-800";
    }

    // Sinon, utiliser les couleurs par type d'événement (comportement actuel)
    switch (event.type) {
      case "tournage":
        return "border-custom-green-filming";
      case "publication":
        return "border-custom-red-publication";
      case "evenement":
        return "border-custom-orange-event";
      case "rendez-vous":
        return "border-custom-blue-meeting";
      default:
        return "border-black";
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

    // Dédupliquer les événements (priorité à Airtable)
    const allEvents = deduplicateEvents(events, googleEvents);

    // Filtrer les événements par mois
    const filteredEvents = filterEventsByMonth(allEvents, date);

    while (currentDate <= lastDay || days.length < 42) {
      const dayEvents = filteredEvents.filter((event) => {
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

    // Dédupliquer les événements (priorité à Airtable)
    const allEvents = deduplicateEvents(events, googleEvents);

    // Filtrer les événements par mois
    const filteredEvents = filterEventsByMonth(allEvents, date);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);

      currentDate.setDate(startOfWeek.getDate() + i);

      const dayEvents = filteredEvents.filter((event) => {
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
        <div className="grid grid-cols-7 gap-1 mb-2 bg-page-bg rounded-md">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-1 sm:p-2 text-start font-medium  text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 ">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 sm:min-h-32 p-1 sm:p-2 border border-1 border-[#FAFAFA] ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                } `}
            >
              <div
                className={`text-xs sm:text-sm w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-medium ${day.isToday
                  ? "text-white bg-red-500 rounded-full"
                  : day.isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
                  }`}
              >
                {day.dayNumber}
              </div>

              <div className="mt-1 space-y-1">
                {day.events
                  .sort((a, b) => {
                    const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
                    const timeB = new Date(`${b.date}T${b.startTime}`).getTime();
                    return timeA - timeB;
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded cursor-pointer ${getEventColor(event)} border border-1 ${getEventBorderColor(event)} ${!day.isCurrentMonth ? 'shadow-sm' : ''}`}
                      title={`${event.title}${event.startTime && event.endTime ? ` (${event.startTime} - ${event.endTime})` : ''}`}
                      role={event.isGoogleEvent ? "button" : undefined}
                      tabIndex={event.isGoogleEvent ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (event.isGoogleEvent && event.htmlLink && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          window.open(event.htmlLink, '_blank');
                        }
                      }}
                      onClick={() => openEventDetailModal(event)}
                    >
                      <div className="font-light truncate flex items-center gap-1">
                        {event.title}

                      </div>

                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const timeSlots = Array.from({ length: 15 }, (_, i) => i + 6); // 6h à 20h
    const slotHeight = 60; // Hauteur de chaque créneau horaire en pixels

    // Fonction pour calculer la position et la hauteur d'un événement
    const calculateEventPosition = (event: Event, currentHour: number) => {
      if (!event.startTime || !event.endTime) return null;

      const startTime = new Date(`${event.date}T${event.startTime}`);
      const endTime = new Date(`${event.date}T${event.endTime}`);

      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();

      // L'événement ne s'affiche que dans la cellule où il commence
      if (startHour !== currentHour) return null;

      // Calculer la position verticale relative à cette cellule (basée sur les minutes)
      const topPosition = (startMinute / 60) * slotHeight;

      // Calculer la hauteur totale de l'événement
      const totalDurationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
      const height = Math.max(totalDurationMinutes * (slotHeight / 60), 20); // Minimum 20px

      return {
        top: topPosition,
        height: height
      };
    };

    // Fonction pour détecter les chevauchements et calculer les colonnes
    const calculateEventColumns = (events: Event[]) => {
      if (events.length === 0) return { columns: [], eventColumns: {} };

      // Trier les événements par heure de début
      const sortedEvents = [...events].sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
        const timeB = new Date(`${b.date}T${b.startTime}`).getTime();
        return timeA - timeB;
      });

      const columns: Event[][] = [];
      const eventColumns: { [key: string]: number } = {};

      sortedEvents.forEach(event => {
        if (!event.startTime || !event.endTime) return;

        const startTime = new Date(`${event.date}T${event.startTime}`);
        const endTime = new Date(`${event.date}T${event.endTime}`);

        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();

        // Calculer la position absolue pour la détection de chevauchement
        const startPosition = ((startHour - 6) * 60 + startMinute) * (slotHeight / 60);
        const endPosition = ((endHour - 6) * 60 + endMinute) * (slotHeight / 60);

        // Trouver une colonne disponible
        let columnIndex = 0;
        while (columnIndex < columns.length) {
          const column = columns[columnIndex];
          const lastEvent = column[column.length - 1];

          if (!lastEvent.startTime || !lastEvent.endTime) {
            break;
          }

          const lastStartTime = new Date(`${lastEvent.date}T${lastEvent.startTime}`);
          const lastEndTime = new Date(`${lastEvent.date}T${lastEvent.endTime}`);

          const lastStartPosition = ((lastStartTime.getHours() - 6) * 60 + lastStartTime.getMinutes()) * (slotHeight / 60);
          const lastEndPosition = ((lastEndTime.getHours() - 6) * 60 + lastEndTime.getMinutes()) * (slotHeight / 60);

          // Vérifier s'il y a chevauchement
          if (startPosition >= lastEndPosition || endPosition <= lastStartPosition) {
            break;
          }
          columnIndex++;
        }

        // Si aucune colonne disponible, créer une nouvelle
        if (columnIndex >= columns.length) {
          columns.push([]);
        }

        columns[columnIndex].push(event);
        eventColumns[event.id] = columnIndex;
      });

      return { columns, eventColumns };
    };

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] sm:min-w-[1000px]">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-8 mb-2 bg-page-bg rounded-md">
            <div className="p-1 sm:p-2 text-center font-medium text-gray-600 text-xs sm:text-sm" />
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
                className="p-1 sm:p-2 text-center gap-2 sm:gap-4 flex flex-col sm:flex-row items-center font-semibold text-primary-light"
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm ${day.isToday
                    ? "text-white bg-red-500 rounded-full"
                    : ""
                    }`}
                >
                  {day.dayNumber}
                </div>
                <div className="text-xs sm:text-sm hidden sm:block">{day.dayName}</div>
              </div>
            ))}
          </div>

          {/* Grille horaire */}
          <div className="grid grid-cols-8">
            {timeSlots.map((hour) => (
              <div key={hour} className="contents">
                {/* Heure */}
                <div
                  className="p-1 sm:p-2 text-xs sm:text-sm text-gray-500 text-right pr-2 sm:pr-4 border-r border-gray-100 flex items-center justify-end"
                  style={{ height: `${slotHeight}px` }}
                >
                  {hour}:00
                </div>

                {/* Cellules des jours */}
                {weekDays.map((day) => {
                  const dayEvents = day.events.filter(event => event.startTime && event.endTime);
                  const { eventColumns } = calculateEventColumns(dayEvents);

                  return (
                    <div
                      key={`${day.date.toISOString()}-${hour}`}
                      className={`border border-1 border-[#FAFAFA] relative ${day.isToday ? "bg-red-50" : "bg-white"}`}
                      style={{ height: `${slotHeight}px` }}
                    >
                      {/* Afficher seulement les événements qui COMMENCENT à cette heure */}
                      {dayEvents
                        .filter(event => {
                          const eventStartHour = parseInt(event.startTime!.split(":")[0]);
                          return eventStartHour === hour;
                        })
                        .map((event) => {
                          const position = calculateEventPosition(event, hour);
                          if (!position) return null;

                          const columnIndex = eventColumns[event.id] || 0;
                          const totalColumns = Math.max(...Object.values(eventColumns)) + 1;
                          const columnWidth = totalColumns > 1 ? `${100 / totalColumns}%` : '100%';
                          const leftPosition = totalColumns > 1 ? `${(columnIndex * 100) / totalColumns}%` : '0%';

                          return (
                            <div
                              key={event.id}
                              className={`absolute text-xs p-1 rounded cursor-pointer ${getEventColor(event)} border border-1 ${getEventBorderColor(event)} ${day.date.getMonth() !== currentDate.getMonth() ? 'shadow-sm' : ''}`}
                              style={{
                                top: `${position.top}px`,
                                height: `${position.height}px`,
                                width: columnWidth,
                                left: leftPosition,
                                zIndex: 10
                              }}
                              title={`${event.title} (${event.startTime} - ${event.endTime})`}
                              tabIndex={event.isGoogleEvent ? 0 : undefined}
                              onKeyDown={(e) => {
                                if (event.isGoogleEvent && event.htmlLink && (e.key === 'Enter' || e.key === ' ')) {
                                  e.preventDefault();
                                  window.open(event.htmlLink, '_blank');
                                }
                              }}
                              onClick={() => openEventDetailModal(event)}
                            >
                              <div className=" truncate text-xs">
                                {event.title}
                              </div>
                              <div className="text-xs opacity-75 mt-0.5 truncate">
                                {event.startTime} - {event.endTime}
                              </div>
                            </div>
                          );
                        })}
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

  const renderPlanningView = () => {
    // Dédupliquer les événements (priorité à Airtable)
    const allEvents = deduplicateEvents(events, googleEvents);

    // Filtrer les événements par mois
    const filteredEvents = filterEventsByMonth(allEvents, currentDate);

    // Grouper les événements par date
    const eventsByDate = filteredEvents.reduce((acc, event) => {
      const eventDate = new Date(event.date).toDateString();
      if (!acc[eventDate]) {
        acc[eventDate] = [];
      }
      acc[eventDate].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

    // Trier les dates et les événements dans chaque date
    const sortedDates = Object.keys(eventsByDate).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Trier les événements par heure dans chaque date
    Object.keys(eventsByDate).forEach(date => {
      eventsByDate[date].sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
        const timeB = new Date(`${b.date}T${b.startTime}`).getTime();
        return timeA - timeB;
      });
    });

    // Fonction pour formater la date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('fr-FR', { month: 'long' });
      return `${day} ${month}`;
    };

    // Fonction pour calculer la hauteur dynamique d'une ligne
    const calculateRowHeight = (eventCount: number) => {
      const baseHeight = 50; // Hauteur de base (4rem = 64px)
      const eventHeight = 45; // Hauteur par événement (2.5rem = 40px)
      const padding = 16; // Padding vertical (1rem = 16px)

      if (eventCount === 0) {
        return baseHeight;
      }

      return Math.max(baseHeight, eventCount * eventHeight + padding);
    };


    // Si pas d'événements, afficher un message
    if (sortedDates.length === 0) {
      return (
        <div className="w-full text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Aucun événement à afficher</div>
          <div className="text-gray-400 text-sm">Les événements apparaîtront ici une fois créés</div>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto" ref={planningScrollRef}>
        <div className="flex min-w-[600px]">
          {/* Colonne des dates */}
          <div className="w-24 sm:w-32 flex-shrink-0">
            {sortedDates.map((dateString) => {
              const eventCount = eventsByDate[dateString].length;
              const rowHeight = calculateRowHeight(eventCount);

              return (
                <div
                  key={dateString}
                  data-date={new Date(dateString).toDateString()}
                  className="flex items-center text-xs sm:text-sm text-[#9C9C9C] border-b border-gray-100 px-2"
                  style={{ height: `${rowHeight}px` }}
                >
                  {formatDate(dateString)}
                </div>
              );
            })}
          </div>

          {/* Colonne des événements */}
          <div className="flex-1 min-w-0">
            {sortedDates.map((dateString) => {
              const eventCount = eventsByDate[dateString].length;
              const rowHeight = calculateRowHeight(eventCount);

              return (
                <div
                  key={dateString}
                  data-date={new Date(dateString).toDateString()}
                  className="border-b border-gray-100 flex flex-col justify-center p-1"
                  style={{ height: `${rowHeight}px` }}
                >
                  <div className="">
                    {eventsByDate[dateString].map((event) => (
                      <div
                        key={event.id}
                        className={`${getEventColor(event)} px-2 py-1 rounded text-xs sm:text-sm cursor-pointer hover:opacity-80 border border-1 ${getEventBorderColor(event)}`}
                        onClick={() => openEventDetailModal(event)}
                      >
                        <div className=" truncate">{event.title}</div>
                        <div className="text-xs opacity-90 truncate">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };


  // Afficher le message d'invitation si Google Calendar n'est pas connecté
  if (isGoogleConnected === false) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
          <CardBody className="p-12">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-lg mb-2">Google Calendar non connecté</div>
                <div className="text-sm mb-4">Connectez-vous à Google Calendar pour avoir accès à l&apos;agenda</div>
                <Button
                  className="mt-4"
                  color="primary"
                  onPress={connectToGoogleCalendar}
                >
                  Se connecter à Google Calendar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Afficher le message si Google Calendar est connecté mais qu'il n'y a pas de calendrier EPICU
  if (isGoogleConnected === true && !hasEpicuCalendar) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
          <CardBody className="p-12">
            <div className="flex justify-center items-center">
              <div className="text-center">
                <div className="text-lg mb-2">Agenda EPICU non trouvé</div>
                {googleUserEmail && (
                  <div className="text-sm text-gray-600 mb-2">
                    Connecté avec : <span className="font-medium">{googleUserEmail}</span>
                  </div>
                )}
                <div className="text-sm mb-4">Créez un agenda EPICU dans Google Calendar pour synchroniser vos événements</div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto mb-4">
                  <p className="text-sm text-amber-800 mb-3 font-medium">
                    Instructions :
                  </p>
                  <ol className="text-sm text-amber-800 list-decimal list-inside space-y-2 text-left">
                    <li>Ouvrez Google Calendar</li>
                    <li>Cliquez sur le &quot;+&quot; à côté de &quot;Autres agendas&quot;</li>
                    <li>Créez un nouveau calendrier nommé &quot;EPICU AGENDA&quot;</li>
                    <li>Revenez ici et cliquez sur &quot;Synchroniser&quot;</li>
                  </ol>
                </div>
                <div className="flex gap-3 mt-4 justify-center">
                  <Button
                    color="primary"
                    onPress={syncGoogleEvents}
                  >
                    Synchroniser maintenant
                  </Button>
                  <Button
                    className="border-1"
                    color="primary"
                    variant="bordered"
                    onPress={disconnectFromGoogleCalendar}
                  >
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
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
    <div className="w-full text-primary">
      <Card className="w-full" shadow="none">
        <CardBody className="p-3 sm:p-6">

          {/* En-tête avec navigation et bouton plus - style cohérent avec la page d'accueil */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            {/* Navigation mois/semaine - toujours visible */}
            {/* Synchronisation Google Calendar - seulement si connecté */}
            {isGoogleConnected && (
              <div className="w-full sm:w-auto">
                <GoogleCalendarSync
                  onEventsFetched={setGoogleEvents}
                  onEventCreated={handleGoogleEventCreated}
                />
              </div>
            )}

            <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
              <AgendaDropdown
                onPublicationSelect={() => openModal("publication")}
                onRendezVousSelect={() => openModal("rendez-vous")}
                onTournageSelect={() => openModal("tournage")}
                onEvenementSelect={() => openModal("evenement")}
                isGoogleConnected={isGoogleConnected || false}
                canAddEvents={canAddEvents()}
              />
            </div>
          </div>

          {/* Sélecteur de vue - toujours visible */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                isIconOnly
                variant="light"
                onPress={handlePreviousMonth}
                className="flex-shrink-0"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm sm:text-base text-center flex-1 sm:flex-none">
                {view === "semaine"
                  ? formatWeekRange(currentDate)
                  : formatMonthYear(currentDate)}
              </span>
              {canGoToNextMonth(currentDate) && <Button
                isIconOnly
                aria-label="Mois suivant"
                variant="light"
                onPress={handleNextMonth}
                className="flex-shrink-0"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>}
            </div>
            {/* Sélecteur de vue */}
            <div className="flex rounded-md overflow-hidden w-full sm:w-auto">
              {[
                { key: "mois", label: "Mois" },
                { key: "semaine", label: "Semaine" },
                { key: "planning", label: "Vue liste" }
              ].map((viewOption) => {
                const isSelected = view === viewOption.key;
                return (
                  <Button
                    key={viewOption.key}
                    className={
                      isSelected
                        ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none flex-1 sm:flex-none"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-none flex-1 sm:flex-none"
                    }
                    size="sm"
                    variant="solid"
                    onPress={() => setView(viewOption.key as "semaine" | "mois" | "planning")}
                  >
                    {viewOption.label}
                  </Button>
                );
              })}
            </div>


          </div>


          {/* Contenu du calendrier */}
          {
            loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner className="text-black dark:text-white" size="lg" />
              </div>
            ) : (
              <div className="mt-6">
                {view === "mois" && renderCalendarView()}
                {view === "semaine" && renderWeekView()}
                {view === "planning" && renderPlanningView()}
              </div>
            )
          }
        </CardBody>
      </Card>

      {/* Modal unifiée pour tous les types d'événements */}
      <UnifiedEventModal
        isOpen={isUnifiedModalOpen}
        onOpenChange={setIsUnifiedModalOpen}
        eventType={currentEventType}
        onEventCreated={handleGoogleEventCreated}
        onEventAdded={fetchEvents}
      />

      {/* Modal de détail d'événement */}
      <EventDetailModal
        isOpen={isEventDetailModalOpen}
        onOpenChange={setIsEventDetailModalOpen}
        event={selectedEvent}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
}
