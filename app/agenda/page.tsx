"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { AgendaModals } from "@/components/agenda-modals";
import { StyledSelect } from "@/components/styled-select";
import { getValidAccessToken } from "@/utils/auth";

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

// Interface pour les données de l'API agenda
interface ApiEvent {
  id: string;
  task: string;
  date: string;
  type: string;
  description?: string;
  collaborators?: string[];
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"semaine" | "mois">("mois");
  const [selectedCategory, setSelectedCategory] = useState<string>("tout");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les différents modals
  const [isTournageModalOpen, setIsTournageModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

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

        return {
          id: apiEvent.id,
          title: apiEvent.task,
          type: mappedType,
          date: apiEvent.date.split('T')[0], // Extraire juste la date
          startTime,
          endTime,
          description: apiEvent.description,
          category,
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
                    className={`text-xs p-1 rounded ${event.type === "rendez-vous"
                      ? "bg-blue-100 text-blue-800"
                      : event.type === "tournage"
                        ? "bg-pink-100 text-pink-800"
                        : event.type === "publication"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    title={`${event.title}${event.startTime && event.endTime ? ` (${event.startTime} - ${event.endTime})` : ''}`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
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
                <div className="p-2 text-sm text-gray-500 text-right pr-4 border-r border-gray-100">
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
                      className={`min-h-20 p-1 border border-gray-100 relative ${day.isToday ? "bg-red-50" : "bg-white"
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
                          title={`${event.title}${event.startTime && event.endTime ? ` (${event.startTime} - ${event.endTime})` : ''}`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
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



  if (loading) {
    return (
      <div className="w-full">
        <Card className="w-full" shadow="none">
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
                <Button isIconOnly aria-label="Mois suivant" variant="light" onPress={handleNextMonth}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsRdvModalOpen(true)}
              >
                Créer un rendez-vous
              </Button>

              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsTournageModalOpen(true)}
              >
                Ajouter un tournage
              </Button>

              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsPublicationModalOpen(true)}
              >
                Ajouter une publication
              </Button>
            </div>
          </div>

          {/* Filtres et vues */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <StyledSelect
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
              </StyledSelect>
            </div>

            <div className="flex rounded-md overflow-hidden flex-shrink-0">

              <Button
                className={
                  view === "semaine"
                    ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-none"
                }
                color={view === "semaine" ? "primary" : "default"}
                size="sm"
                variant="solid"
                onPress={() => setView("semaine")}
              >
                Semaine
              </Button>
              <Button
                className={
                  view === "mois"
                    ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-none"
                }
                color={view === "mois" ? "primary" : "default"}
                size="sm"
                variant="solid"
                onPress={() => setView("mois")}
              >
                Mois
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

      {/* Modals d'agenda */}
      <AgendaModals
        isPublicationModalOpen={isPublicationModalOpen}
        isRdvModalOpen={isRdvModalOpen}
        isTournageModalOpen={isTournageModalOpen}
        setIsPublicationModalOpen={setIsPublicationModalOpen}
        setIsRdvModalOpen={setIsRdvModalOpen}
        setIsTournageModalOpen={setIsTournageModalOpen}
        onEventAdded={fetchEvents}
      />
    </div>
  );
}
