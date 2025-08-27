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
import { Spinner } from "@heroui/spinner";

import { DashboardLayout } from "../dashboard-layout";

import { MetricCard } from "@/components/metric-card";
import { AgendaModals } from "@/components/agenda-modals";
import { AgendaDropdown } from "@/components/agenda-dropdown";
import { ProspectModal } from "@/components/prospect-modal";
import { AgendaBadge, TodoBadge } from "@/components/badges";
import { FormLabel } from "@/components";
import { useUser } from "@/contexts/user-context";
import { useLoading } from "@/contexts/loading-context";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// Types pour les données réelles
type AgendaEvent = {
  id: string;
  task: string;
  date: string;
  type: string;
  description?: string;
  collaborators?: string[];
};

type TodoItem = {
  id: string;
  name: string;
  createdAt: string;
  dueDate?: string;
  status: string;
  type: string;
  description?: string;
  collaborators?: string[];
};

export default function HomePage() {
  const { userProfile } = useUser();
  const { setUserProfileLoaded } = useLoading();
  const { authFetch } = useAuthFetch();
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

  // Données des villes disponibles - maintenant dynamiques basées sur l'utilisateur
  const [cities, setCities] = useState([
    { key: "tout", label: "Tout" },
    { key: "national", label: "National" },
  ]);

  // États pour les données dynamiques
  const [prospects, setProspects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [todoLoading, setTodoLoading] = useState(false);
  const [statistics, setStatistics] = useState<{
    prospectsSignes: number;
    tauxConversion: number;
    abonnes: number;
    vues: number;
  } | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // États pour les modals d'agenda
  const [isTournageModalOpen, setIsTournageModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);

  // Mettre à jour les villes disponibles basées sur le profil utilisateur
  useEffect(() => {
    if (userProfile) {
      const userVilles = userProfile.villes || [];

      // Transformer les villes de l'utilisateur
      const userCities = userVilles.map((ville: any) => ({
        key: ville.ville.toLowerCase().replace(/\s+/g, '-'),
        label: ville.ville
      }));

      // Mettre à jour la liste des villes avec celles de l'utilisateur
      setCities([
        { key: "tout", label: "Tout" },
        ...userCities,
        { key: "national", label: "National" }
      ]);
      
      // Signal que le profil est chargé
      setUserProfileLoaded(true);
    }
  }, [userProfile, setUserProfileLoaded]);

  // Fonction pour récupérer les données agenda
  const fetchAgenda = async () => {
    try {
      setAgendaLoading(true);

      // Récupérer l'ID du collaborateur
      const meRes = await authFetch('/api/auth/me');

      if (!meRes.ok) return;
      const me = await meRes.json();
      const collaboratorId = me.id as string;

      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const startOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
      const endOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0, 23, 59, 59);

      // Récupérer les événements d'agenda
      const params = new URLSearchParams();

      if (collaboratorId) params.set('collaborator', collaboratorId);
      params.set('limit', '10'); // Limiter à 10 événements pour l'affichage
      params.set('dateStart', startOfMonth.toISOString().split('T')[0]);
      params.set('dateEnd', endOfMonth.toISOString().split('T')[0]);

      const eventsResponse = await authFetch(`/api/agenda?${params.toString()}`);

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();

        setEvents(eventsData.events || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'agenda:', error);
      setEvents([]);
    } finally {
      setAgendaLoading(false);
    }
  };

    // Fonction pour récupérer les données todo
  const fetchTodos = async () => {
    try {
      setTodoLoading(true);
      
      // Récupérer l'ID du collaborateur
      const meRes = await authFetch('/api/auth/me');

      if (!meRes.ok) return;
      const me = await meRes.json();
      const collaboratorId = me.id as string;

      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const startOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
      const endOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0, 23, 59, 59);

      // Récupérer les todos
      const params = new URLSearchParams();

      if (collaboratorId) params.set('collaborator', collaboratorId);
      params.set('limit', '10'); // Limiter à 10 todos pour l'affichage

      const todosResponse = await authFetch(`/api/todo?${params.toString()}`);

      if (todosResponse.ok) {
        const todosData = await todosResponse.json();

        // Filtrer les todos côté client pour la plage de dates
        const filteredTodos = todosData.todos?.filter((todo: TodoItem) => {
          if (!todo.dueDate) return true; // Inclure les todos sans date d'échéance
          
          const todoDate = new Date(todo.dueDate);

          return todoDate >= startOfMonth && todoDate <= endOfMonth;
        }) || [];

        setTodoItems(filteredTodos);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des todos:', error);
      setTodoItems([]);
    } finally {
      setTodoLoading(false);
    }
  };

  // Fonction pour récupérer les statistiques
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      
      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const monthYear = `${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${selectedDateObj.getFullYear()}`;
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.set('q', monthYear); // Rechercher par mois-année
      
      // Ajouter le filtre de ville si nécessaire
      if (selectedCity !== "tout") {
        if (selectedCity === "national") {
          // Pour "National", exclure les villes locales de l'utilisateur
          const userVilles = userProfile?.villes || [];
          const localVilleNames = userVilles.map(v => v.ville);
          
          // On ne peut pas exclure directement, on filtrera côté client
        } else {
          // Pour une ville spécifique
          const selectedCityData = cities.find(c => c.key === selectedCity);
          if (selectedCityData) {
            params.set('q', `${monthYear} ${selectedCityData.label}`);
          }
        }
      }

      const response = await authFetch(`/api/statistiques?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Traiter les données selon le filtre de ville
        let filteredData = data.statistiques || [];
        
        if (selectedCity === "national") {
          // Exclure les villes locales de l'utilisateur
          const userVilles = userProfile?.villes || [];
          const localVilleNames = userVilles.map(v => v.ville);
          filteredData = filteredData.filter((item: any) => 
            !localVilleNames.some(localVille => 
              item.villeEpicu && item.villeEpicu.toLowerCase().includes(localVille.toLowerCase())
            )
          );
        }
        
        // Calculer les totaux
        const totals = filteredData.reduce((acc: any, item: any) => {
          acc.prospectsSignes += parseInt(item.prospectsSignesDsLeMois) || 0;
          acc.tauxConversion += parseFloat(item.txDeConversion) || 0;
          acc.abonnes += parseInt(item.totalAbonnes) || 0;
          acc.vues += parseInt(item.totalVues) || 0;
          return acc;
        }, { prospectsSignes: 0, tauxConversion: 0, abonnes: 0, vues: 0 });
        
        // Calculer la moyenne du taux de conversion
        const avgTauxConversion = filteredData.length > 0 ? totals.tauxConversion / filteredData.length : 0;

        setStatistics({
          prospectsSignes: totals.prospectsSignes,
          tauxConversion: avgTauxConversion,
          abonnes: totals.abonnes,
          vues: totals.vues
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setStatistics(null);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Fonction pour récupérer les données
  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupération des prospects
      const prospectsResponse = await authFetch('/api/prospects');
      const prospectsData = await prospectsResponse.json();

      setProspects(prospectsData.prospects || []);

      // Récupération des clients
      const clientsResponse = await authFetch('/api/clients');
      const clientsData = await clientsResponse.json();

      setClients(clientsData.clients || []);

      // Récupération des événements d'agenda, todos et statistiques
      await Promise.all([fetchAgenda(), fetchTodos(), fetchStatistics()]);
    } catch {
      // Gestion des erreurs de récupération des données
      setProspects([]);
      setClients([]);
      setEvents([]);
      setTodoItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchData();
  }, []);

  // Effet pour recharger agenda, todos et statistiques quand la date change
  useEffect(() => {
    fetchAgenda();
    fetchTodos();
    fetchStatistics();
  }, [selectedDate]);

  // Effet pour recharger les statistiques quand la ville change
  useEffect(() => {
    fetchStatistics();
  }, [selectedCity]);

  // Fonction pour filtrer les données par ville
  const filterDataByCity = (data: any[], cityKey: string) => {
    if (cityKey === "tout") return data;

    // Récupérer les villes de l'utilisateur
    const userVilles = userProfile?.villes || [];

    if (cityKey === "national") {
      // Pour "National", exclure les villes locales de l'utilisateur
      const localVilleNames = userVilles.map(v => v.ville);

      return data.filter(item =>
        item.ville && !localVilleNames.some(localVille =>
          item.ville.toLowerCase().includes(localVille.toLowerCase())
        )
      );
    }

    // Pour les villes locales, filtrer par la ville sélectionnée
    const selectedCity = cities.find(c => c.key === cityKey);

    if (!selectedCity) return data;

    return data.filter(item =>
      item.ville && item.ville.toLowerCase().includes(selectedCity.label.toLowerCase())
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

  // Calcul du taux de conversion (maintenant géré par l'API statistiques)
  // const conversionRate = useMemo(() => {
  //   const totalProspects = filteredProspects.length;
  //   const convertedClients = filteredClients.length;

  //   if (totalProspects === 0) return "0%";

  //   return `${Math.round((convertedClients / totalProspects) * 100)}%`;
  // }, [filteredProspects, filteredClients]);

  const metrics = [
    {
      value: statisticsLoading ? "..." : statistics ? `+${statistics.abonnes.toLocaleString()}` : "0",
      label: "Nombre d'abonnés",
      icon: <ChartBarIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-green-stats/40",
      iconColor: "text-custom-green-stats",
    },
    {
      value: statisticsLoading ? "..." : statistics ? `+${(statistics.vues / 1000000).toFixed(1)}` : "0",
      label: "Nombre de vues",
      icon: <EyeIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-rose/40",
      iconColor: "text-custom-rose",
    },
    {
      value: statisticsLoading ? "..." : statistics ? statistics.prospectsSignes.toString() : "0",
      label: "Prospects signés",
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: "bg-yellow-100",
      iconColor: "text-yellow-400",
    },
    {
      value: statisticsLoading ? "..." : statistics ? `${statistics.tauxConversion.toFixed(1)}%` : "0%",
      label: "Taux de conversion",
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-orange-food/40",
      iconColor: "text-custom-orange-food",
    },
  ];

  // Transformation des événements filtrés pour l'affichage
  const agendaEvents = useMemo(() => {
    return filteredEvents.slice(0, 3).map(event => ({
      clientName: event.task || "Nom client",
      date: event.date ? new Date(event.date).toLocaleDateString("fr-FR") : "12.07.2025",
      type: event.type === "rendez-vous" ? "Rendez-vous" :
        event.type === "tournage" ? "Tournage" :
          event.type === "publication" ? "Publication" : "Evènement",
    }));
  }, [filteredEvents]);

  // Transformation des todos pour l'affichage
  const displayTodoItems = useMemo(() => {
    return todoItems.slice(0, 3).map(todo => ({
      id: todo.id,
      titre: todo.name,
      description: todo.description || todo.name,
      priorite: 'moyenne',
      statut: todo.status,
      assigne: 'À assigner',
      dateEcheance: todo.dueDate || new Date().toISOString().split('T')[0],
      dateCreation: todo.createdAt,
      tags: []
    }));
  }, [todoItems]);

  const handleAddTodo = async () => {
    if (newTodo.mission.trim()) {
      try {

        // Récupérer l'ID du collaborateur
        const meRes = await authFetch('/api/auth/me');

        if (!meRes.ok) return;
        const me = await meRes.json();
        const collaboratorId = me.id as string;

        const payload = {
          'Nom de la tâche': newTodo.mission,
          'Date de création': new Date().toISOString(),
          'Statut': newTodo.status,
          'Type de tâche': 'Général',
          'Date d\'échéance': newTodo.deadline || '',
          'Collaborateur': [collaboratorId]
        };

        const response = await authFetch('/api/todo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Réinitialiser le formulaire
          setNewTodo({
            mission: "",
            deadline: "",
            status: "En cours",
          });

          onAddTodoModalClose();

          // Recharger les todos
          await fetchTodos();
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout du todo:', error);
      }
    }
  };

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-4xl">
          Re, <span className="font-semibold">{userProfile?.firstname || '...'}</span> !
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

                {/* Groupe des villes locales de l'utilisateur */}
                {cities.filter(city => city.key !== "tout" && city.key !== "national").length > 0 && (
                  <div className="flex rounded-md overflow-hidden flex-shrink-0">
                    {cities.filter(city => city.key !== "tout" && city.key !== "national").map((city) => {
                      const isSelected = selectedCity === city.key;
                      const isUserCity = userProfile?.villes?.some(v =>
                        v.ville.toLowerCase() === city.label.toLowerCase()
                      );

                      return (
                        <Button
                          key={city.key}
                          className={
                            isSelected
                              ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-none"
                          }
                          size="sm"
                          title={isUserCity ? `Ville de ${userProfile?.firstname || 'l\'utilisateur'}` : undefined}
                          variant="solid"
                          onPress={() => setSelectedCity(city.key)}
                        >
                          {city.label}
                        </Button>
                      );
                    })}
                  </div>
                )}

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
                className="flex-shrink-0"
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
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

            {selectedDate
              .toDate(getLocalTimeZone())
              .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
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
                <div >
                  {agendaLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500"><Spinner /></div>
                    </div>
                  ) : agendaEvents.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">Pas de résultat</div>
                    </div>
                  ) : (
                    agendaEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-4 border-b border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-light text-primary">
                            {event.clientName}
                          </p>
                          <p className="text-xs text-primary-light">
                            {event.date}
                          </p>
                        </div>
                        <AgendaBadge type={event.type} />
                      </div>
                    ))
                  )}
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
                    color='primary'
                    size="sm"
                    onPress={onAddTodoModalOpen}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 lg:space-y-3">
                  {todoLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500"><Spinner /></div>
                    </div>
                  ) : displayTodoItems.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">Pas de résultat</div>
                    </div>
                  ) : (
                    displayTodoItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-4 border-b border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-light text-primary">
                            {item.titre}
                          </p>
                          <p className="text-xs text-primary-light">
                            {new Date(item.dateEcheance).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }).replace(/\//g, '.')}
                          </p>
                        </div>
                        <TodoBadge status={item.statut} />
                      </div>
                    ))
                  )}
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
              <FormLabel htmlFor="mission" isRequired={true}>
                Mission
              </FormLabel>
              <Input
                isRequired
                id="mission"
                placeholder="Titre de la tâche"
                value={newTodo.mission}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodo((prev) => ({ ...prev, mission: e.target.value }))
                }
              />
              <FormLabel htmlFor="deadline" isRequired={true}>
                Deadline
              </FormLabel>
              <Input
                id="deadline"
                type="date"
                value={newTodo.deadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodo((prev) => ({ ...prev, deadline: e.target.value }))
                }
              />
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button className="flex-1 border-1" color='primary' variant="bordered" onPress={onAddTodoModalClose}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              color='primary'
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
