"use client";

import { Button } from "@heroui/button";
import { Calendar } from "@heroui/calendar";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  PlusIcon,
  ChartBarIcon,
  EyeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { Card, CardBody } from "@heroui/card";

import { DashboardLayout } from "../dashboard-layout";

import { MetricCard } from "@/components/metric-card";
import { AgendaModals } from "@/components/agenda-modals";
import { AgendaDropdown } from "@/components/agenda-dropdown";
import { ProspectModal } from "@/components/prospect-modal";
import { StyledSelect } from "@/components/styled-select";
import { AgendaBadge, TodoBadge } from "@/components/badges";

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(
    today(getLocalTimeZone())
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAddTodoModalOpen,
    onOpen: onAddTodoModalOpen,
    onClose: onAddTodoModalClose,
  } = useDisclosure();
  const [newTodo, setNewTodo] = useState({
    mission: "",
    deadline: "",
    status: "En cours" as "En cours" | "En retard" | "Terminé",
  });

  // État pour le filtre de ville
  const [selectedCity, setSelectedCity] = useState<string>("tout");

  // Données des villes disponibles
  const cities = [
    { key: "tout", label: "Tout" },
    { key: "vannes", label: "Vannes" },
    { key: "nantes", label: "Nantes" },
    { key: "saint-brieuc", label: "Saint-Brieuc" },
    { key: "national", label: "National" },
  ];

  // États pour les données dynamiques
  const [prospects, setProspects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les modals d'agenda
  const [isTournageModalOpen, setIsTournageModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);

  // Fonction pour récupérer les données
  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupération des prospects
      const prospectsResponse = await fetch('/api/prospects');
      const prospectsData = await prospectsResponse.json();

      setProspects(prospectsData.prospects || []);

      // Récupération des clients
      const clientsResponse = await fetch('/api/clients');
      const clientsData = await clientsResponse.json();

      setClients(clientsData.clients || []);

      // Récupération des événements d'agenda
      const eventsResponse = await fetch('/api/agenda');
      const eventsData = await eventsResponse.json();

      setEvents(eventsData.events || []);
    } catch {
      // Gestion des erreurs de récupération des données
      setProspects([]);
      setClients([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchData();
  }, []);

  // Fonction pour filtrer les données par ville
  const filterDataByCity = (data: any[], cityKey: string) => {
    if (cityKey === "tout") return data;

    // Mapping des clés vers les noms de villes
    const cityMapping: { [key: string]: string[] } = {
      "vannes": ["Vannes"],
      "nantes": ["Nantes"],
      "saint-brieuc": ["Saint-Brieuc"],
      "national": ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nice", "Strasbourg", "Montpellier", "Rennes"]
    };

    const targetCities = cityMapping[cityKey] || [];

    return data.filter(item =>
      item.ville && targetCities.some(city =>
        item.ville.toLowerCase().includes(city.toLowerCase())
      )
    );
  };

  // Calcul des métriques filtrées
  const filteredProspects = useMemo(() =>
    filterDataByCity(prospects, selectedCity),
    [prospects, selectedCity]
  );

  const filteredClients = useMemo(() =>
    filterDataByCity(clients, selectedCity),
    [clients, selectedCity]
  );

  const filteredEvents = useMemo(() =>
    filterDataByCity(events, selectedCity),
    [events, selectedCity]
  );

  // Calcul du taux de conversion
  const conversionRate = useMemo(() => {
    const totalProspects = filteredProspects.length;
    const convertedClients = filteredClients.length;

    if (totalProspects === 0) return "0%";

    return `${Math.round((convertedClients / totalProspects) * 100)}%`;
  }, [filteredProspects, filteredClients]);

  const metrics = [
    {
      value: loading ? "..." : `+${Math.floor(filteredClients.length * 4.2)}k`,
      label: "Nombre d'abonnés",
      icon: <ChartBarIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-green-stats/40",
      iconColor: "text-custom-green-stats",
    },
    {
      value: loading ? "..." : `+${Math.floor(filteredClients.length * 0.8)}M`,
      label: "Nombre de vues",
      icon: <EyeIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-rose/40",
      iconColor: "text-custom-rose",
    },
    {
      value: loading ? "..." : filteredProspects.length.toString(),
      label: "Prospects",
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: "bg-yellow-100",
      iconColor: "text-yellow-400",
    },
    {
      value: loading ? "..." : conversionRate,
      label: "Taux de conversion",
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-orange-food/40",
      iconColor: "text-custom-orange-food",
    },
  ];

  // Transformation des événements filtrés pour l'affichage
  const agendaEvents = useMemo(() => {
    return filteredEvents.slice(0, 3).map(event => ({
      clientName: event.title || "Nom client",
      date: event.date ? new Date(event.date).toLocaleDateString("fr-FR") : "12.07.2025",
      type: event.type === "rendez-vous" ? "Rendez-vous" :
        event.type === "tournage" ? "Tournage" :
          event.type === "publication" ? "Publication" : "Evènement",
    }));
  }, [filteredEvents]);

  const [todoItems, setTodoItems] = useState([
    {
      id: '1',
      titre: 'Finaliser le design de la page clients',
      description: 'Terminer la mise en page et les interactions de la page clients selon les maquettes',
      priorite: 'haute',
      statut: 'a_faire',
      assigne: 'Nom',
      dateEcheance: '2025-01-15',
      dateCreation: '2024-12-01',
      tags: ['design', 'frontend', 'clients']
    },
    {
      id: '2',
      titre: 'Implémenter l\'API de conversion prospects',
      description: 'Créer l\'endpoint pour convertir un prospect en client avec toutes les validations',
      priorite: 'urgente',
      statut: 'a_faire',
      assigne: 'Prénom',
      dateEcheance: '2024-12-20',
      dateCreation: '2024-12-01',
      tags: ['api', 'backend', 'prospects']
    },
    {
      id: '3',
      titre: 'Tests unitaires pour les composants',
      description: 'Écrire les tests unitaires pour tous les composants React de l\'application',
      priorite: 'moyenne',
      statut: 'a_faire',
      assigne: 'Nom',
      dateEcheance: '2025-01-30',
      dateCreation: '2024-12-01',
      tags: ['tests', 'frontend', 'qualité']
    },
  ]);

  const handleAddTodo = () => {
    if (newTodo.mission.trim()) {
      const todoToAdd = {
        ...newTodo,
      };

      setTodoItems((prev) => [...prev, todoToAdd]);

      // Réinitialiser le formulaire
      setNewTodo({
        mission: "",
        deadline: "",
        status: "En cours",
      });

      onAddTodoModalClose();
    }
  };

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-4xl">
          Re, <span className="font-semibold">Clémence</span> !
        </h1>
      </div>
      <Card className="w-full rounded-2xl" shadow="none" >
        <CardBody className="p-6">
          {/* Location Filters and Add Prospect Button */}
          <div className="mb-4 lg:mb-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-center justify-between">
              {/* Location Filters - Design avec "Tout" séparé et villes groupées */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* Bouton "Tout" séparé */}
                <Button
                  className={
                    selectedCity === "tout"
                      ? "bg-custom-blue-select/14 text-custom-blue-select  border-0 flex-shrink-0 rounded-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 flex-shrink-0 rounded-md"
                  }
                  size="sm"
                  variant="solid"
                  onPress={() => setSelectedCity("tout")}
                >
                  Tout
                </Button>

                {/* Groupe des villes locales */}
                <div className="flex rounded-md overflow-hidden flex-shrink-0">
                  {["vannes", "nantes", "saint-brieuc"].map((cityKey) => {
                    const city = cities.find(c => c.key === cityKey);

                    return (
                      <Button
                        key={cityKey}
                        className={
                          selectedCity === cityKey
                            ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-none"
                        }
                        size="sm"
                        variant="solid"
                        onPress={() => setSelectedCity(cityKey)}
                      >
                        {city?.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Bouton "National" séparé */}
                <Button
                  className={
                    selectedCity === "national"
                      ? "bg-custom-blue-select/14 text-custom-blue-select border-0 flex-shrink-0 rounded-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 flex-shrink-0 rounded-md"
                  }
                  size="sm"
                  variant="solid"
                  onPress={() => setSelectedCity("national")}
                >
                  National
                </Button>
              </div>

              {/* Add Prospect Button */}
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 flex-shrink-0"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsProspectModalOpen(true)}
              >
                Ajouter un prospect
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-start gap-2 lg:gap-4 mb-4 lg:mb-6">
            <Button
              isIconOnly
              className="text-gray-600"
              size="sm"
              variant="light"
              onPress={() => {
                const newDate = selectedDate.subtract({ months: 1 });

                setSelectedDate(newDate);
              }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-md"
              variant="light"
              onPress={onOpen}
            >
              {selectedDate
                .toDate(getLocalTimeZone())
                .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </Button>
            <Button
              isIconOnly
              className="text-gray-600"
              size="sm"
              variant="light"
              onPress={() => {
                const newDate = selectedDate.add({ months: 1 });

                setSelectedDate(newDate);
              }}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Layout - Responsive: stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Metrics Grid - Responsive: 1 column on mobile, 2 columns on tablet, 2 columns on desktop */}
            <div className="flex-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {metrics.map((metric, index) => (
                  <MetricCard
                    key={index}
                    icon={metric.icon}
                    iconBgColor={metric.iconBgColor}
                    iconColor={metric.iconColor}
                    label={metric.label}
                    value={metric.value}
                  />
                ))}
              </div>
            </div>

            {/* Stacked sections - Full width on mobile, sidebar on desktop */}
            <div className="flex-1 space-y-4 lg:space-y-6">
              {/* Agenda Section */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-custom dark:shadow-custom-dark p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Agenda
                  </h3>
                  <AgendaDropdown
                    onPublicationSelect={() => setIsPublicationModalOpen(true)}
                    onRendezVousSelect={() => setIsRdvModalOpen(true)}
                    onTournageSelect={() => setIsTournageModalOpen(true)}
                  />
                </div>
                <div className="space-y-2 lg:space-y-3">
                  {agendaEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-light text-custom-text-color">
                          {event.clientName}
                        </p>
                        <p className="text-xs text-custom-text-color-light">
                          {event.date}
                        </p>
                      </div>
                      <AgendaBadge type={event.type} />
                    </div>
                  ))}
                </div>
              </div>

              {/* To do Section */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-custom dark:shadow-custom-dark p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    To do
                  </h3>
                  <Button
                    isIconOnly
                    className="bg-black dark:bg-white text-white dark:text-black"
                    size="sm"
                    onPress={onAddTodoModalOpen}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 lg:space-y-3">
                  {todoItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-light text-custom-text-color">
                          {item.titre}
                        </p>
                        <p className="text-xs text-custom-text-color-light">
                          {new Date(item.dateEcheance).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }).replace(/\//g, '.')}
                        </p>
                      </div>
                      <TodoBadge status={item.statut} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Calendar Modal */}
      <Modal isOpen={isOpen} placement="center" onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Sélectionner une date
          </ModalHeader>
          <ModalBody>
            <Calendar
              className="w-full"
              showMonthAndYearPickers={false}
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                onClose();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal d'ajout de tâche ToDo */}
      <Modal
        isOpen={isAddTodoModalOpen}
        placement="center"
        onClose={onAddTodoModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Ajouter une nouvelle tâche
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Mission"
                placeholder="Titre de la tâche"
                value={newTodo.mission}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodo((prev) => ({ ...prev, mission: e.target.value }))
                }
              />
              <Input
                label="Deadline"
                type="date"
                value={newTodo.deadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodo((prev) => ({ ...prev, deadline: e.target.value }))
                }
              />
              <StyledSelect
                label="Statut"
                selectedKeys={[newTodo.status]}
                onSelectionChange={(keys: any) =>
                  setNewTodo((prev) => ({
                    ...prev,
                    status: Array.from(keys)[0] as
                      | "En cours"
                      | "En retard"
                      | "Terminé",
                  }))
                }
              >
                <SelectItem key="En cours">En cours</SelectItem>
                <SelectItem key="En retard">En retard</SelectItem>
                <SelectItem key="Terminé">Terminé</SelectItem>
              </StyledSelect>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddTodoModalClose}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleAddTodo}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modals d'agenda */}
      <AgendaModals
        isPublicationModalOpen={isPublicationModalOpen}
        isRdvModalOpen={isRdvModalOpen}
        isTournageModalOpen={isTournageModalOpen}
        setIsPublicationModalOpen={setIsPublicationModalOpen}
        setIsRdvModalOpen={setIsRdvModalOpen}
        setIsTournageModalOpen={setIsTournageModalOpen}
        onEventAdded={fetchData}
      />

      {/* Modal d'ajout de prospect */}
      <ProspectModal
        isOpen={isProspectModalOpen}
        onClose={() => setIsProspectModalOpen(false)}
        onProspectAdded={fetchData}
      />
    </DashboardLayout>
  );
}
