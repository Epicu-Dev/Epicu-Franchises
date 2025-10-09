"use client";

import { Button } from "@heroui/button";
import { Calendar } from "@heroui/calendar";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FranchiseAbonnesIcon, FranchiseVuesIcon, FranchiseProspectsIcon, ConversionIcon } from "@/components/custom-icons";
import { useState, useEffect, useMemo, useRef } from "react";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "../dashboard-layout";

import { MetricCard } from "@/components/metric-card";
import { UnifiedEventModal } from "@/components/unified-event-modal";
import { ProspectModal } from "@/components/prospect-modal";
import { AgendaSection } from "@/components/agenda-section";
import { TodoBadge } from "@/components/badges";
import InvoiceModal from "@/components/invoice-modal";
import TodoModal from "@/components/todo-modal";
import { useUser } from "@/contexts/user-context";
import { useLoading } from "@/contexts/loading-context";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useDateFilters } from "@/hooks/use-date-filters";
import { DateFilterModal } from "@/components/date-filter-modal";
import { PeriodSelectorButtons } from "@/components/period-selector-buttons";
import { Invoice } from "@/types/invoice";
import { formatNumberWithK, formatNumberWithPlusAndK } from "@/utils/format-numbers";

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
  const router = useRouter();

  // Utilisation du hook de filtres de dates
  const {
    selectedDate,
    selectedMonth,
    selectedYear,
    selectedPeriodType,
    selectedPeriod,
    isCustomDateSelected,
    isSinceCreationSelected,
    tempSelectedMonth,
    tempSelectedYear,
    tempSelectedDate,
    tempIsSinceCreationSelected,
    setSelectedDate,
    setSelectedMonth,
    setSelectedYear,
    setSelectedPeriodType,
    setSelectedPeriod,
    setIsCustomDateSelected,
    setIsSinceCreationSelected,
    setTempSelectedMonth,
    setTempSelectedYear,
    setTempSelectedDate,
    setTempIsSinceCreationSelected,
    selectCurrentMonth,
    selectCurrentYear,
    selectSinceCreation,
    applyCustomDate,
    resetToCurrentDate,
    syncTempStates,
  } = useDateFilters();

  const { isOpen, onClose } = useDisclosure();
  const { isOpen: isDateModalOpen, onOpen: onDateModalOpen, onOpenChange: onDateModalOpenChange } = useDisclosure();
  const {
    isOpen: isAddTodoModalOpen,
    onOpen: onAddTodoModalOpen,
    onClose: onAddTodoModalClose,
  } = useDisclosure();

  // État pour le filtre de ville
  const [selectedCity, setSelectedCity] = useState<string>("tout");

  // Données des villes disponibles - maintenant dynamiques basées sur l'utilisateur
  const [cities, setCities] = useState([
    { key: "tout", label: "Tout" },
    { key: "national", label: "National" },
  ]);

  // États pour les données dynamiques
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [todoLoading, setTodoLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [statistics, setStatistics] = useState<{
    prospectsSignes: number;
    tauxConversion: number;
    abonnes: number;
    vues: number;
  } | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // État pour la connexion Google Calendar
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  // État de loading global pour la navigation par mois
  const [isNavigating, setIsNavigating] = useState(false);

  // Ref pour annuler les requêtes en cours
  const abortControllerRef = useRef<AbortController | null>(null);

  // États pour le modal unifié d'agenda
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<"tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar">("tournage");
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
      const newCities = [
        ...(userVilles.length > 1 ? [{ key: "tout", label: "Tout" }] : []),
        ...userCities,
        { key: "national", label: "National" }
      ];

      setCities(newCities);

      // Si l'utilisateur n'a qu'une seule ville, la sélectionner par défaut
      if (userVilles.length === 1 && selectedCity === "tout") {
        setSelectedCity(userCities[0].key);
      }

      // Signal que le profil est chargé
      setUserProfileLoaded(true);
    } else {
      // Si pas de profil, utiliser des villes par défaut
      setCities([
        { key: "tout", label: "Tout" },
        { key: "national", label: "National" }
      ]);
    }
  }, [userProfile, setUserProfileLoaded, selectedCity]);

  // Fonction pour récupérer les données agenda
  const fetchAgenda = async () => {
    try {
      setAgendaLoading(true);

      // Récupérer l'ID du collaborateur
      const meRes = await authFetch('/api/auth/me');

      if (!meRes.ok) return;

      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const startOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
      const endOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0, 23, 59, 59);

      // Récupérer les événements d'agenda
      const params = new URLSearchParams();

      params.set('limit', '10'); // Limiter à 10 événements pour l'affichage
      params.set('dateStart', startOfMonth.toISOString().split('T')[0]);
      params.set('dateEnd', endOfMonth.toISOString().split('T')[0]);

      const eventsResponse = await authFetch(`/api/agenda?${params.toString()}`);

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();

        setEvents(eventsData.events || []);
      } else {
        setEvents([]);
      }
    } catch {
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

      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const startOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
      const endOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0, 23, 59, 59);

      // Récupérer les todos
      const params = new URLSearchParams();

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
      } else {
        setTodoItems([]);
      }
    } catch {
      setTodoItems([]);
    } finally {
      setTodoLoading(false);
    }
  };

  // Fonction pour récupérer les factures (paiements) du mois sélectionné
  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);

      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const startOfMonth = new Date(
        selectedDateObj.getFullYear(),
        selectedDateObj.getMonth(),
        1
      );
      const endOfMonth = new Date(
        selectedDateObj.getFullYear(),
        selectedDateObj.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const params = new URLSearchParams();

      params.set("limit", "100");
      params.set("status", "payee");
      params.set("offset", "0");
      params.set("sortField", "datePaiement");
      params.set("sortDirection", "desc");

      const response = await authFetch(`/api/facturation?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        const list: Invoice[] = data.invoices || [];

        // Filtrer les factures par date de paiement pour le mois sélectionné
        const filtered = list.filter((inv) => {
          if (!inv.datePaiement) return false;

          const d = new Date(inv.datePaiement);

          return d >= startOfMonth && d <= endOfMonth;
        });

        setInvoices(filtered);
      } else {
        setInvoices([]);
      }
    } catch {
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Fonction pour vérifier le statut Google Calendar
  const checkGoogleCalendarStatus = async () => {
    try {
      const response = await authFetch('/api/google-calendar/status');

      if (response.ok) {
        const status = await response.json();
        setIsGoogleConnected(status.isConnected);
      } else {
        setIsGoogleConnected(false);
      }
    } catch {
      setIsGoogleConnected(false);
    }
  };

  // Fonction pour récupérer les statistiques
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);

      // Calculer la plage de dates pour le mois sélectionné
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const monthYear = `${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${selectedDateObj.getFullYear()}`;

      // Construire les paramètres de requête pour l'API /api/data/data
      const params = new URLSearchParams();

      params.set('date', monthYear);

      // Déterminer le paramètre ville
      let villeParam = 'all';

      if (selectedCity !== "tout") {
        if (selectedCity === "national") {
          // Pour "National", on utilise 'all' et on filtrera côté client
          villeParam = 'all';
        } else {
          // Pour une ville spécifique, on utilise l'ID de la ville
          const selectedCityData = cities.find(c => c.key === selectedCity);

          if (selectedCityData) {
            // Chercher l'ID de la ville dans le profil utilisateur
            const userVille = userProfile?.villes?.find(v =>
              v.ville.toLowerCase() === selectedCityData.label.toLowerCase()
            );

            if (userVille?.id) {
              villeParam = userVille.id;
            } else {
              // Si pas d'ID trouvé, utiliser le nom de la ville
              villeParam = selectedCityData.label;
            }
          }
        }
      }
      params.set('ville', villeParam);

      const response = await authFetch(`/api/data/data?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

        // L'API /api/data/data retourne déjà les données agrégées
        if (selectedCity === "national") {
          // Pour "National", on doit exclure les villes locales de l'utilisateur
          // On récupère d'abord toutes les données puis on filtre
          const allParams = new URLSearchParams();

          allParams.set('date', monthYear);
          allParams.set('ville', 'all');

          const allResponse = await authFetch(`/api/data/data?${allParams.toString()}`);

          if (allResponse.ok) {
            const allData = await allResponse.json();

            // Récupérer les données des villes locales de l'utilisateur
            const userVilles = userProfile?.villes || [];

            let localTotals = { totalAbonnes: 0, totalVues: 0, totalProspectsSignes: 0, tauxConversion: 0 };

            for (const ville of userVilles) {
              if (ville.id) {
                const localParams = new URLSearchParams();

                localParams.set('date', monthYear);
                localParams.set('ville', ville.id);

                const localResponse = await authFetch(`/api/data/data?${localParams.toString()}`);

                if (localResponse.ok) {
                  const localData = await localResponse.json();

                  localTotals.totalAbonnes += localData.totalAbonnes || 0;
                  localTotals.totalVues += localData.totalVues || 0;
                  localTotals.totalProspectsSignes += localData.prospectsSignesDsLeMois || 0;
                  localTotals.tauxConversion += localData.tauxDeConversion || 0;
                }
              }
            }

            // Calculer les données nationales (toutes - locales)
            const nationalData = {
              totalAbonnes: (allData.totalAbonnes || 0) - localTotals.totalAbonnes,
              totalVues: (allData.totalVues || 0) - localTotals.totalVues,
              totalProspectsSignes: (allData.totalProspectsSignes || 0) - localTotals.totalProspectsSignes,
              tauxConversion: allData.tauxConversion || 0
            };

            setStatistics({
              prospectsSignes: nationalData.totalProspectsSignes,
              tauxConversion: nationalData.tauxConversion,
              abonnes: nationalData.totalAbonnes,
              vues: nationalData.totalVues
            });
          }
        } else {
          // Pour "tout" ou une ville spécifique, utiliser directement les données
          const stats = {
            prospectsSignes: data.totalProspectsSignes || data.prospectsSignesDsLeMois || 0,
            tauxConversion: data.tauxConversion || data.tauxDeConversion || 0,
            abonnes: data.totalAbonnes || 0,
            vues: data.totalVues || 0
          };

          setStatistics(stats);
        }
      } else {
        // Si la réponse n'est pas ok, mettre les statistiques à 0
        setStatistics({
          prospectsSignes: 0,
          tauxConversion: 0,
          abonnes: 0,
          vues: 0
        });
      }
    } catch {
      // En cas d'erreur, mettre les statistiques à 0
      setStatistics({
        prospectsSignes: 0,
        tauxConversion: 0,
        abonnes: 0,
        vues: 0
      });
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Fonction pour récupérer les données
  const fetchData = async (isNavigation = false) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur pour cette requête
    const abortController = new AbortController();

    abortControllerRef.current = abortController;

    if (isNavigation) {
      setIsNavigating(true);
    }

    try {
      // Récupération des événements d'agenda, todos, statistiques et vérification Google Calendar
      await Promise.all([fetchAgenda(), fetchTodos(), fetchInvoices(), fetchStatistics(), checkGoogleCalendarStatus()]);
    } catch (error) {
      // Ignorer les erreurs d'annulation
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      if (isNavigation) {
        setIsNavigating(false);
      }
      abortControllerRef.current = null;
    }
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchData();
  }, []);

  // Effet pour synchroniser les états temporaires quand le modal s'ouvre
  useEffect(() => {
    if (isDateModalOpen) {
      syncTempStates();
    }
  }, [isDateModalOpen]);

  // Effet pour recharger agenda, todos et statistiques quand la date change
  useEffect(() => {
    fetchData(true);
  }, [selectedDate]);

  // Effet pour recharger les statistiques quand la ville change
  useEffect(() => {
    fetchStatistics();
  }, [selectedCity]);

  // Cleanup pour annuler les requêtes en cours
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Calcul du taux de conversion (maintenant géré par l'API statistiques)
  // const conversionRate = useMemo(() => {
  //   const totalProspects = filteredProspects.length;
  //   const convertedClients = filteredClients.length;

  //   if (totalProspects === 0) return "0%";

  //   return `${Math.round((convertedClients / totalProspects) * 100)}%`;
  // }, [filteredProspects, filteredClients]);

  const metrics = [
    {
      value: (statisticsLoading || isNavigating) ? "..." : statistics ? formatNumberWithPlusAndK(statistics.abonnes) : "0",
      label: "Nombre d'abonnés",
      icon: <FranchiseAbonnesIcon className="h-8 w-8" />,
      iconBgColor: "bg-custom-green-stats/40",
      iconColor: "text-custom-green-stats",
    },
    {
      value: (statisticsLoading || isNavigating) ? "..." : statistics ? formatNumberWithPlusAndK(statistics.vues) : "0",
      label: "Nombre de vues",
      icon: <FranchiseVuesIcon className="h-8 w-8" />,
      iconBgColor: "bg-custom-rose-views/40",
      iconColor: "text-custom-rose-views",
    },
    {
      value: (statisticsLoading || isNavigating) ? "..." : statistics ? formatNumberWithK(statistics.prospectsSignes) : "0",
      label: "Prospects signés",
      icon: <FranchiseProspectsIcon className="h-8 w-8" />,
      iconBgColor: "bg-custom-yellow-prospects/40",
      iconColor: "text-custom-yellow-prospects",
    },
    {
      value: (statisticsLoading || isNavigating) ? "..." : statistics ? `${statistics.tauxConversion.toFixed(1)}%` : "0%",
      label: "Taux de conversion",
      icon: <ConversionIcon className="h-8 w-8" />,
      iconBgColor: "bg-custom-orange-conversion/40",
      iconColor: "text-custom-orange-conversion",
    },
  ];

  // Transformation des événements filtrés pour l'affichage
  const agendaEvents = useMemo(() => {
    return events.slice(0, 3).map(event => ({
      clientName: event.task || "Nom client",
      date: event.date ? new Date(event.date).toLocaleDateString("fr-FR") : "12.07.2025",
      type: event.type === "rendez-vous" ? "Rendez-vous" :
        event.type === "tournage" ? "Tournage" :
          event.type === "publication" ? "Publication" : "Evènement",
    }));
  }, [events]);

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

  // Transformation des factures pour l'affichage
  const displayInvoices = useMemo(() => {
    return invoices.slice(0, 3).map((inv) => ({
      id: inv.id,
      client: inv.nomEtablissement || "Nom client",
      date: inv.dateEmission,
      montant: inv.montant || 0,
      datePaiement: inv.datePaiement,
    }));
  }, [invoices]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
      amount || 0
    );

  const handleAddInvoice = async (invoiceData: any) => {
    try {
      const response = await authFetch("/api/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        setIsInvoiceModalOpen(false);
        await fetchInvoices();
      }
    } catch {
      // ignore
    }
  };

  const handleEditInvoice = async (invoiceData: any) => {
    try {
      if (!selectedInvoice) return;

      const response = await authFetch(`/api/facturation?id=${encodeURIComponent(selectedInvoice.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        setIsInvoiceModalOpen(false);
        await fetchInvoices();
      }
    } catch {
      // ignore
    }
  };

  const handleTodoAdded = async () => {
    // Recharger les todos
    await fetchTodos();
  };

  // Fonctions pour ouvrir le modal unifié avec le bon type
  const openUnifiedModal = (type: "tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar") => {
    setCurrentEventType(type);
    setIsUnifiedModalOpen(true);
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
                {/* Bouton "Tout" séparé - affiché seulement si l'utilisateur a plusieurs villes */}
                {userProfile?.villes && userProfile.villes.length > 1 && (
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
                )}

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
            <PeriodSelectorButtons
              selectedPeriodType={selectedPeriodType}
              isCustomDateSelected={isCustomDateSelected}
              isSinceCreationSelected={isSinceCreationSelected}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onDateModalOpen={onDateModalOpen}
              onCurrentMonthSelect={selectCurrentMonth}
              onCurrentYearSelect={selectCurrentYear}
            />
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
              <AgendaSection
                events={agendaEvents}
                loading={agendaLoading || isNavigating}
                onPublicationSelect={() => openUnifiedModal("publication")}
                onRendezVousSelect={() => openUnifiedModal("rendez-vous")}
                onTournageSelect={() => openUnifiedModal("tournage")}
                isGoogleConnected={isGoogleConnected || false}
              />

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
                  {(todoLoading || isNavigating) ? (
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

              {/* Paiement Section */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-custom dark:shadow-custom-dark p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Paiement
                  </h3>
                  <Button
                    isIconOnly
                    color='primary'
                    size="sm"
                    onPress={() => {
                      setSelectedInvoice(null);
                      setIsInvoiceModalOpen(true);
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 lg:space-y-3">
                  {(invoicesLoading || isNavigating) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500"><Spinner /></div>
                    </div>
                  ) : displayInvoices.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">Pas de résultat</div>
                    </div>
                  ) : (
                    <>
                      {displayInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-4 border-b border-gray-100">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-light text-primary">{inv.client}</p>
                            <p className="text-xs text-primary-light">
                              {inv.datePaiement == null ? 'Pas de date de paiement' : new Date(inv.datePaiement ? inv.datePaiement : inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                            </p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-md bg-green-100 text-green-600">
                            {formatAmount(inv.montant)}
                          </span>
                        </div>
                      ))}
                      {invoices.length > 3 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            size="sm"
                            variant="light"
                            className="text-xs text-gray-500 hover:text-gray-700"
                            onPress={() => router.push('/facturation')}
                          >
                            Voir plus
                          </Button>
                        </div>
                      )}
                    </>
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
          <ModalHeader className="flex justify-center">
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
      <TodoModal
        isOpen={isAddTodoModalOpen}
        onOpenChange={onAddTodoModalClose}
        onTodoAdded={handleTodoAdded}
      />

      {/* Modal unifié pour tous les types d'événements */}
      <UnifiedEventModal
        eventType={currentEventType}
        isOpen={isUnifiedModalOpen}
        onEventAdded={fetchData}
        onOpenChange={setIsUnifiedModalOpen}
      />

      {/* Modal d'ajout de prospect */}
      <ProspectModal
        isOpen={isProspectModalOpen}
        onClose={() => setIsProspectModalOpen(false)}
        onProspectAdded={() => fetchData()}
      />

      {/* Modal d'ajout de facture */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        selectedInvoice={selectedInvoice}
        onEdit={handleEditInvoice}
        onOpenChange={setIsInvoiceModalOpen}
        onSave={handleAddInvoice}
      />

      {/* Date Selection Modal */}
      <DateFilterModal
        isOpen={isDateModalOpen}
        onOpenChange={onDateModalOpenChange}
        tempSelectedMonth={tempSelectedMonth}
        tempSelectedYear={tempSelectedYear}
        tempIsSinceCreationSelected={tempIsSinceCreationSelected}
        onTempMonthChange={setTempSelectedMonth}
        onTempYearChange={setTempSelectedYear}
        onTempSinceCreationChange={setTempIsSinceCreationSelected}
        onTempDateChange={setTempSelectedDate}
        onApply={() => {
          applyCustomDate();
          onDateModalOpenChange();
        }}
      />
    </DashboardLayout>
  );
}
