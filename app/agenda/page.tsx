"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

import { AgendaModals } from "@/components/agenda-modals";

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

  // États pour les différents modals
  const [isTournageModalOpen, setIsTournageModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);

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
                onPress={() => setIsRdvModalOpen(true)}
              >
                Créer un rendez-vous
              </Button>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onPress={() => setIsTournageModalOpen(true)}
              >
                Ajouter un tournage
              </Button>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onPress={() => setIsPublicationModalOpen(true)}
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
