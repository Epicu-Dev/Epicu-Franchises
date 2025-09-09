"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { GoogleCalendarSync } from "@/components/google-calendar-sync";
import { UnifiedEventModal } from "@/components/unified-event-modal";
import { getValidAccessToken } from "@/utils/auth";
import { GoogleCalendarEvent } from "@/types/googleCalendar";
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
  isGoogleEvent?: boolean; // Marqueur pour identifier les événements Google Calendar
  htmlLink?: string; // Lien vers l'événement dans Google Calendar
  establishmentCategories?: string[]; // Catégories des établissements associés
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
  type: string;
  description?: string;
  collaborators?: string[];
  establishmentCategories?: string[];
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view] = useState<"semaine" | "mois">("mois");
  const [selectedCategory] = useState<string>("tout");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingGoogleConnection, setIsCheckingGoogleConnection] = useState(true);

  // États pour la modal unifiée
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<"tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar">("tournage");
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  // Gestionnaires pour Google Calendar
  const handleGoogleEventsFetched = (events: GoogleCalendarEvent[]) => {
    setGoogleEvents(events);
  };

  const handleGoogleEventCreated = (event: GoogleCalendarEvent) => {
    // Ajouter l'événement créé à la liste locale
    setGoogleEvents(prev => [event, ...prev]);
  };

  // Fonctions pour ouvrir les modals avec le bon type
  const openModal = (type: "tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar") => {
    setCurrentEventType(type);
    setIsUnifiedModalOpen(true);
  };

  // Fonction pour connecter à Google Calendar
  const connectToGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/google-calendar/auth');

      if (response.ok) {
        const { authUrl } = await response.json();

        window.location.href = authUrl;
      }
    } catch {
      // Erreur lors de la connexion
      setError('Erreur lors de la connexion à Google Calendar');
    }
  };

  // Vérifier le statut de Google Calendar
  const checkGoogleCalendarStatus = async () => {
    try {
      setIsCheckingGoogleConnection(true);
      const response = await fetch('/api/google-calendar/status');

      if (response.ok) {
        const status = await response.json();

        setIsGoogleConnected(status.isConnected);
      } else {
        setIsGoogleConnected(false);
      }
    } catch {
      // Erreur lors de la vérification du statut
      setIsGoogleConnected(false);
    } finally {
      setIsCheckingGoogleConnection(false);
    }
  };

  // Fonction pour transformer les événements Google Calendar en format compatible
  const transformGoogleEvents = (googleEvents: GoogleCalendarEvent[]): Event[] => {
    return googleEvents.map((googleEvent) => {
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

      return {
        id: `google-${googleEvent.id || Date.now()}`,
        title: googleEvent.summary,
        type: "evenement" as Event['type'], // Type par défaut pour Google Calendar
        date: startDate.toISOString().split('T')[0],
        startTime,
        endTime,
        location: googleEvent.location,
        description: googleEvent.description,
        category: "siege" as Event['category'], // Catégorie par défaut
        isGoogleEvent: true, // Marqueur pour identifier les événements Google Calendar
        htmlLink: googleEvent.htmlLink,
      };
    });
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier d'abord le statut Google Calendar
      await checkGoogleCalendarStatus();

      // Récupérer le token d'authentification
      const token = await getValidAccessToken();

      if (!token) {
        throw new Error("Non authentifié");
      }

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
        // Vue mois
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        endOfMonth.setHours(23, 59, 59, 999);

        dateStart = startOfMonth.toISOString().split('T')[0];
        dateEnd = endOfMonth.toISOString().split('T')[0];
      }

      const params = new URLSearchParams({
        dateStart,
        dateEnd,
        limit: '100', // Récupérer plus d'événements pour couvrir la période
      });

      const response = await fetch(`/api/agenda?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des événements");
      }

      const data = await response.json();

      // Transformer les données de l'API en format Event
      const transformedEvents: Event[] = (data.events || []).map((apiEvent: ApiEvent) => {
        const eventDate = new Date(apiEvent.date);
        const startTime = eventDate.toTimeString().slice(0, 5);

        // Calculer l'heure de fin (par défaut +1h)
        const endDate = new Date(eventDate);

        endDate.setHours(endDate.getHours() + 1);
        const endTime = endDate.toTimeString().slice(0, 5);

        // Mapper le type de l'API vers le type de l'interface
        let mappedType: Event['type'] = "evenement";

        if (apiEvent.type.toLowerCase().includes("rendez") || apiEvent.type.toLowerCase().includes("rdv")) {
          mappedType = "rendez-vous";
        } else if (apiEvent.type.toLowerCase().includes("tournage")) {
          mappedType = "tournage";
        } else if (apiEvent.type.toLowerCase().includes("publication")) {
          mappedType = "publication";
        }

        // Déterminer la catégorie (par défaut siège)
        let category: Event['category'] = "siege";

        if (apiEvent.type.toLowerCase().includes("franchise")) {
          category = "franchises";
        } else if (apiEvent.type.toLowerCase().includes("prestataire")) {
          category = "prestataires";
        }

        console.log(apiEvent.establishmentCategories);
        

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

  // Fonction helper pour obtenir la couleur d'un événement
  const getEventColor = (event: Event) => {
    // Si l'événement a des catégories d'établissement, utiliser ces couleurs
    if (event.establishmentCategories && event.establishmentCategories.length > 0) {
      return getEventColorFromEstablishmentCategories(event.establishmentCategories);
    }
    
    // Sinon, utiliser les couleurs par type d'événement (comportement actuel)
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    // Transformer les événements Google Calendar
    const transformedGoogleEvents = transformGoogleEvents(googleEvents);

    // Combiner les événements locaux et Google Calendar
    const allEvents = [...events, ...transformedGoogleEvents];

    while (currentDate <= lastDay || days.length < 42) {
      const dayEvents = allEvents.filter((event) => {
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

    // Transformer les événements Google Calendar
    const transformedGoogleEvents = transformGoogleEvents(googleEvents);

    // Combiner les événements locaux et Google Calendar
    const allEvents = [...events, ...transformedGoogleEvents];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);

      currentDate.setDate(startOfWeek.getDate() + i);

      const dayEvents = allEvents.filter((event) => {
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
        <div className="grid grid-cols-7 ">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 p-2 border border-gray-100 ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                } `}
            >
              <div
                className={`text-sm w-8 h-8 flex items-center justify-center font-medium ${day.isToday
                  ? "text-white bg-red-500 rounded-full  flex items-center justify-center "
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
                    className={`text-xs p-1 rounded cursor-pointer ${getEventColor(event)} ${event.isGoogleEvent ? "border border-2 border-blue-500" : ""}`}
                    title={`${event.title}${event.startTime && event.endTime ? ` (${event.startTime} - ${event.endTime})` : ''}${event.isGoogleEvent ? ' (Google Calendar)' : ''}`}
                    role={event.isGoogleEvent ? "button" : undefined}
                    tabIndex={event.isGoogleEvent ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (event.isGoogleEvent && event.htmlLink && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        window.open(event.htmlLink, '_blank');
                      }
                    }}
                    onClick={() => {
                      if (event.isGoogleEvent && event.htmlLink) {
                        window.open(event.htmlLink, '_blank');
                      }
                    }}
                  >
                    <div className="font-medium truncate flex items-center gap-1">
                      {event.title}

                    </div>
                    {event.startTime && (
                      <div className="text-xs opacity-75">
                        {event.startTime}
                      </div>
                    )}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{day.events.length - 3} autres
                    {day.events.some(e => e.isGoogleEvent) && (
                      <span className="text-blue-600 ml-1">• GC</span>
                    )}
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
          <div className="grid grid-cols-8  mb-2">
            <div className="p-2 text-center font-medium text-gray-600 text-sm" />
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
                className="p-2 text-center gap-4 flex items-center font-semibold text-primary-light"
              >
                <div
                  className={` w-8 h-8 flex items-center justify-center ${day.isToday
                    ? "text-white bg-red-500 rounded-full flex items-center justify-center"
                    : ""
                    }`}
                >
                  {day.dayNumber}
                </div>
                <div >{day.dayName}</div>

              </div>
            ))}
          </div>

          {/* Grille horaire */}
          <div className="grid grid-cols-8 ">
            {timeSlots.map((hour) => (
              <div key={hour} className="contents">
                {/* Heure */}
                <div className="p-2 text-sm text-gray-500 text-right pr-4 border-r border-gray-100 h-20 flex items-center justify-end">
                  {hour}:00
                </div>

                {/* Cellules des jours */}
                {weekDays.map((day) => {
                  const hourEvents = day.events.filter((event) => {
                    // Vérifier que startTime existe et n'est pas undefined
                    if (!event.startTime) {
                      return false;
                    }

                    const eventStartHour = parseInt(
                      event.startTime.split(":")[0]
                    );

                    return eventStartHour === hour;
                  });

                  return (
                    <div
                      key={`${day.date.toISOString()}-${hour}`}
                      className={`h-20 p-1 border border-gray-100 relative ${day.isToday ? "bg-red-50" : "bg-white"
                        }`}
                    >
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded mb-1 cursor-pointer ${getEventColor(event)} ${event.isGoogleEvent ? "border border-2 border-blue-500" : ""}`}
                          title={`${event.title}${event.startTime && event.endTime ? ` (${event.startTime} - ${event.endTime})` : ''}${event.isGoogleEvent ? ' (Google Calendar)' : ''}`}
                          role={event.isGoogleEvent ? "button" : undefined}
                          tabIndex={event.isGoogleEvent ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (event.isGoogleEvent && event.htmlLink && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              window.open(event.htmlLink, '_blank');
                            }
                          }}
                          onClick={() => {
                            if (event.isGoogleEvent && event.htmlLink) {
                              window.open(event.htmlLink, '_blank');
                            }
                          }}
                        >
                          <div className="font-medium truncate flex items-center gap-1">
                            {event.title}
                          </div>
                          {event.startTime && event.endTime && (
                            <div className="text-xs opacity-75 mt-0.5">
                              {event.startTime} - {event.endTime}
                            </div>
                          )}
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

  // Afficher le loading général pendant la vérification de connexion Google
  if (isCheckingGoogleConnection) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Spinner className="text-black dark:text-white mb-4" size="lg" />
                <div className="text-lg mb-2">Vérification de la connexion Google Calendar...</div>
                <div className="text-sm text-gray-600">Veuillez patienter pendant que nous vérifions votre connexion</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Afficher le message d'invitation si Google Calendar n'est pas connecté
  if (isGoogleConnected === false) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
          <CardBody className="p-6">
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
        <CardBody className="p-6">

          {/* En-tête avec navigation et boutons */}
          {

            <div className="flex justify-end items-center mb-6">


              <div className="flex items-center space-x-4">

                <Button
                  color='primary'
                  endContent={<PlusIcon className="h-4 w-4" />}
                  onPress={() => openModal("tournage")}
                >
                  Ajouter un tournage
                </Button>

                <Button
                  color='primary'
                  endContent={<PlusIcon className="h-4 w-4" />}
                  onPress={() => openModal("publication")}
                >
                  Ajouter une publication
                </Button>

                <Button
                  color='primary'
                  endContent={<PlusIcon className="h-4 w-4" />}
                  onPress={() => openModal("rendez-vous")}
                >
                  Ajouter un rendez-vous
                </Button>

                <Button
                  color='primary'
                  endContent={<PlusIcon className="h-4 w-4" />}
                  onPress={() => openModal("evenement")}
                >
                  Ajouter un évènement
                </Button>

              </div>
            </div>}
          {/* Synchronisation Google Calendar - seulement si connecté */}






          {/* Filtres et vues */}
          <div className="flex justify-between items-center mb-6 w-full">

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
                  <span>
                    {view === "semaine"
                      ? formatWeekRange(currentDate)
                      : formatMonthYear(currentDate)}
                  </span>
                  <Button isIconOnly aria-label="Mois suivant" variant="light" onPress={handleNextMonth}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {isGoogleConnected && (
              <GoogleCalendarSync
                onEventsFetched={handleGoogleEventsFetched}
                onEventCreated={handleGoogleEventCreated}
              />
            )}
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
    </div>
  );
}
