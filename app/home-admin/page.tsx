"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ClientsIcon, ProspectsIcon, FranchisesIcon, PostsIcon, StudioIcon, ChiffreAffairesIcon, AbonnesIcon, VuesIcon } from "@/components/custom-icons";
import { Card, CardBody } from "@heroui/card";
import { getLocalTimeZone } from "@internationalized/date";

import { DashboardLayout } from "../dashboard-layout";

import { MetricCard } from "@/components/metric-card";
import { StatsGrid } from "@/components/stats-grid";
import { EventModal } from "@/components/event-modal";
import { StyledSelect } from "@/components/styled-select";
import { PeriodSelection } from "@/hooks/use-date-filters";
import { DateFilterModal } from "@/components/date-filter-modal";
import { PeriodSelectorButtons } from "@/components/period-selector-buttons";
import { AgendaSection } from "@/components/agenda-section";
import { UnifiedEventModal } from "@/components/unified-event-modal";
import { useUser } from "@/contexts/user-context";
import { useLoading } from "@/contexts/loading-context";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useHomeDataCache } from "@/hooks/use-home-data-cache";
import { useGlobalImageCache } from "@/hooks/use-global-image-cache";
import { formatNumberWithK, formatPercentage } from "@/utils/format-numbers";
import { useRouter } from "next/navigation";

// Types pour les données d'agenda
type AgendaEvent = {
  id: string;
  task: string;
  date: string;
  type: string;
  description?: string;
  collaborators?: string[];
};

export default function HomeAdminPage() {
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

  const { isOpen: isDateModalOpen, onOpen: onDateModalOpen, onOpenChange: onDateModalOpenChange } = useDisclosure();
  const [isAddProspectModalOpen, setIsAddProspectModalOpen] = useState(false);
  const [activeTab] = useState("overview");
  const [selectedCategory] = useState("");
  const [newProspect, setNewProspect] = useState({
    nomEtablissement: "",
    categorie1: "",
    categorie2: "",
    email: "",
    telephone: "",
    adresse: "",
    commentaire: "",
    suiviPar: "",
    statut: "a_contacter" as "a_contacter" | "contacte" | "en_discussion" | "glacial",
  });

  // États pour les modals d'agenda
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Utilisation du hook de cache pour les données agenda
  const {
    agenda: events,
    agendaLoading,
    refreshData: refreshCachedData
  } = useHomeDataCache();
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [currentEventType, setCurrentEventType] = useState<"tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar">("tournage");
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  // État pour le filtre de ville - par défaut "national" pour home-admin
  const [selectedCity, setSelectedCity] = useState<string>("national");

  // Données des villes disponibles - pour home-admin, on utilise seulement "national"
  const [cities, setCities] = useState([
    { key: "national", label: "National" },
  ]);

  // États pour les données dynamiques
  const [statistics, setStatistics] = useState<{
    totalAbonnes: number;
    totalChiffreAffaires: number;
    totalVues: number;
    totalProspectsSignes: number;
    tauxConversion: number;
    totalClients: number;
    totalFranchises: number;
    totalProspects: number;
    totalStudio: number;
    totalPosts: number;
    totalPrestations: number;
  } | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // Mettre à jour le profil utilisateur chargé
  useEffect(() => {
    if (userProfile) {
      setUserProfileLoaded(true);
    }
  }, [userProfile, setUserProfileLoaded]);


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

      // Calculer la plage de dates pour la période sélectionnée
      let monthYear = '';

      if (selectedPeriod.startDate) {
        const selectedDateObj = selectedPeriod.startDate.toDate(getLocalTimeZone());

        if (selectedPeriodType === "year") {
          // Pour l'année, on utilise le format YYYY
          monthYear = `${selectedDateObj.getFullYear()}`;
        } else {
          // Pour le mois, on utilise le format MM-YYYY
          monthYear = `${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${selectedDateObj.getFullYear()}`;
        }
      } else {
        const selectedDateObj = selectedDate.toDate(getLocalTimeZone());

        if (selectedPeriodType === "year") {
          monthYear = `${selectedDateObj.getFullYear()}`;
        } else {
          monthYear = `${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${selectedDateObj.getFullYear()}`;
        }
      }

      // Récupérer les statistiques pour chaque métrique avec le nouveau système
      // Pour home-admin, on utilise toujours 'national' car c'est la vue globale
      const statisticsPromises = [
        fetchStatistic('chiffre-affaires-global', monthYear, 'national'),
        fetchStatistic('clients-signes', monthYear, 'national'),
        fetchStatistic('prospects', monthYear, 'national'),
        fetchStatistic('franchises', monthYear, 'national'),
        fetchStatistic('posts-publies', monthYear, 'national'),
        fetchStatistic('abonnes-en-plus', monthYear, 'national'),
        fetchStatistic('vues', monthYear, 'national')
      ];

      const [caData, clientsData, prospectsData, franchisesData, postsData, abonnesData, vuesData] = await Promise.all(statisticsPromises);

      // Récupérer les données des clients et prospects pour les métriques supplémentaires
      const [clientsResponse, prospectsResponse] = await Promise.all([
        authFetch('/api/clients'),
        authFetch('/api/prospects')
      ]);

      let totalClients = 0;
      let totalProspects = 0;

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        totalClients = clientsData.clients?.length || 0;
      }

      if (prospectsResponse.ok) {
        const prospectsData = await prospectsResponse.json();
        totalProspects = prospectsData.prospects?.length || 0;
      }

      setStatistics({
        totalAbonnes: abonnesData?.value || 0,
        totalChiffreAffaires: caData?.value || 0,
        totalVues: vuesData?.value || 0,
        totalProspectsSignes: clientsData?.value || 0,
        tauxConversion: 0, // Pas utilisé dans home-admin
        totalStudio: 0, // Pas utilisé dans home-admin
        totalClients: clientsData?.value || 0,
        totalProspects: prospectsData?.value || 0,
        totalFranchises: franchisesData?.value || 0,
        totalPosts: postsData?.value || 0,
        totalPrestations: 0, // Pas utilisé dans home-admin
      });
    } catch {
      setStatistics(null);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Fonction pour récupérer une statistique spécifique
  const fetchStatistic = async (statisticType: string, date: string, ville: string) => {
    try {
      const params = new URLSearchParams();
      params.set('date', date);
      params.set('ville', ville);
      params.set('statisticType', statisticType);
      params.set('periodType', selectedPeriodType);
      params.set('isSinceCreation', isSinceCreationSelected.toString());
      params.set('isCustomDate', isCustomDateSelected.toString());

      const response = await authFetch(`/api/data/data?${params.toString()}`);

      if (response.ok) {
        return await response.json();
      } else {
        console.warn(`Erreur pour la statistique ${statisticType}:`, response.status);
        return null;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${statisticType}:`, error);
      return null;
    }
  };

  // Fonction pour récupérer toutes les données (maintenant seulement statistiques et Google Calendar)
  const fetchData = async () => {
    try {
      console.log('Chargement des données...');
      // Les données agenda sont maintenant gérées par le cache
      await Promise.all([fetchStatistics(), checkGoogleCalendarStatus()]);
      console.log('Données chargées avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  // Effet pour charger les données au montage et quand la période change
  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedDate, selectedPeriodType]);

  // Effet pour synchroniser les états temporaires quand le modal s'ouvre
  useEffect(() => {
    if (isDateModalOpen) {
      syncTempStates();
    }
  }, [isDateModalOpen]);

  // Effet pour recharger les statistiques quand la ville change
  useEffect(() => {
    fetchStatistics();
  }, [selectedCity]);

  // Effet pour recharger les statistiques quand "Depuis la création" change
  useEffect(() => {
    fetchStatistics();
  }, [isSinceCreationSelected]);

  // Effet pour recharger les statistiques quand la date personnalisée change
  useEffect(() => {
    fetchStatistics();
  }, [isCustomDateSelected]);


  // Transformation des événements pour l'affichage
  const agendaEvents = useMemo(() => {
    console.log('Transformation des événements agenda:', events.length, 'événements');
    
    // Trier les événements par date croissante (ASC) avant de prendre les 3 premiers
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    return sortedEvents.slice(0, 3).map(event => ({
      clientName: event.task || "Nom client",
      date: event.date ? new Date(event.date).toLocaleDateString("fr-FR") : "12.07.2025",
      type: event.type === "rendez-vous" ? "Rendez-vous" :
        event.type === "tournage" ? "Tournage" :
          event.type === "publication" ? "Publication" :
            event.type === "google-agenda" ? "Google Agenda" : "Evènement",
    }));
  }, [events]);

  // Fonctions pour ouvrir le modal unifié avec le bon type
  const openUnifiedModal = (type: "tournage" | "publication" | "rendez-vous" | "evenement" | "google-calendar") => {
    setCurrentEventType(type);
    setIsUnifiedModalOpen(true);
  };

  const getAdditionalMetrics = () => {
    return [
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalChiffreAffaires) : "0",
        label: "CA total",
        icon: <ChiffreAffairesIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-green-stats/40",
        iconColor: "text-custom-green-stats",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalClients) : "0",
        label: "Clients signés",
        icon: <ClientsIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-rose-customers/40",
        iconColor: "text-custom-rose-customers",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalProspects) : "0",
        label: "Prospects",
        icon: <ProspectsIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-yellow-prospects/40",
        iconColor: "text-custom-yellow-prospects",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalFranchises) : "0",
        label: "Franchises",
        icon: <FranchisesIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-orange-franchises/40",
        iconColor: "text-custom-orange-franchises",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalPosts) : "0",
        label: "Posts publiés",
        icon: <PostsIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-blue-posts/40",
        iconColor: "text-custom-blue-posts",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalStudio) : "0",
        label: "Studio",
        icon: <StudioIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-purple-studio/40",
        iconColor: "text-custom-purple-studio",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? `${(statistics.totalAbonnes * 100).toFixed(1)}%` : "0%",
        label: "Progression d'abonnés",
        icon: <AbonnesIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-orange-abonnes/40",
        iconColor: "text-custom-orange-abonnes",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalVues) : "0",
        label: "Total vues",
        icon: <VuesIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-green-views/40",
        iconColor: "text-custom-green-views",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
    ];
  };

  const additionalMetrics = getAdditionalMetrics();

  // Filtrer les métriques selon l'onglet actif et la catégorie sélectionnée
  const metrics = additionalMetrics.filter((metric) => {
    // Filtre par ville (onglet)
    if (activeTab !== "overview" && metric.city !== activeTab && metric.city !== "overview") {
      return false;
    }

    // Filtre par catégorie
    if (selectedCategory && selectedCategory !== "all" && !metric.categories.includes(selectedCategory)) {
      return false;
    }

    return true;
  });

  return (
    <DashboardLayout>
      <Card className="w-full" shadow="none" >
        <CardBody className="p-4 sm:p-6">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
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


          {/* Main Layout - Stats Grid and Additional Metrics */}
          <div className="flex gap-4 space-y-4 sm:space-y-6">
            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 flex-2 gap-4 sm:gap-6">
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

            {/* Agenda Section */}
            <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-6">
              <div className="flex-1">
                <AgendaSection
                  events={agendaEvents}
                  loading={agendaLoading}
                  onPublicationSelect={() => openUnifiedModal("publication")}
                  onRendezVousSelect={() => openUnifiedModal("rendez-vous")}
                  onTournageSelect={() => openUnifiedModal("tournage")}
                  isGoogleConnected={isGoogleConnected || false}
                  onSeeMore={() => router.push('/agenda')}
                  showSeeMoreButton={events.length > 3}
                />
              </div>
            </div>
          </div>

          {/* Modal d'ajout de prospect */}
          <Modal
            isOpen={isAddProspectModalOpen}
            onOpenChange={setIsAddProspectModalOpen}
            size="2xl"
            classNames={{
              base: "mx-4 sm:mx-0",
              body: "py-6",
              header: "px-6 pt-6 pb-2",
              footer: "px-6 pb-6 pt-2"
            }}
          >
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 justify-center items-center text-center w-full">
                <span className="text-lg sm:text-xl font-semibold">Ajouter un nouveau prospect</span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    label="Nom de l'établissement"
                    placeholder="Entrez le nom de l'établissement"
                    value={newProspect.nomEtablissement}
                    onChange={(e) =>
                      setNewProspect({
                        ...newProspect,
                        nomEtablissement: e.target.value,
                      })
                    }
                  />
                  <Input
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    label="Email"
                    placeholder="email@exemple.com"
                    type="email"
                    value={newProspect.email}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, email: e.target.value })
                    }
                  />
                  <Input
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    label="Téléphone"
                    placeholder="+33 1 23 45 67 89"
                    value={newProspect.telephone}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, telephone: e.target.value })
                    }
                  />
                  <Input
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    label="Adresse"
                    placeholder="123 Rue de la Paix, 75001 Paris"
                    value={newProspect.adresse}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, adresse: e.target.value })
                    }
                  />
                  <StyledSelect
                    label="Catégorie principale"
                    placeholder="Sélectionnez une catégorie"
                    selectedKeys={
                      newProspect.categorie1 ? [newProspect.categorie1] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      setNewProspect({ ...newProspect, categorie1: selectedKey });
                    }}
                  >
                    <SelectItem key="restaurant">Restaurant</SelectItem>
                    <SelectItem key="coiffure">Coiffure</SelectItem>
                    <SelectItem key="esthetique">Esthétique</SelectItem>
                    <SelectItem key="fitness">Fitness</SelectItem>
                    <SelectItem key="autre">Autre</SelectItem>
                  </StyledSelect>
                  <StyledSelect
                    label="Statut"
                    placeholder="Sélectionnez un statut"
                    selectedKeys={newProspect.statut ? [newProspect.statut] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as
                        | "a_contacter"
                        | "contacte"
                        | "en_discussion"
                        | "glacial";

                      setNewProspect({ ...newProspect, statut: selectedKey });
                    }}
                  >
                    <SelectItem key="a_contacter">À contacter</SelectItem>
                    <SelectItem key="contacte">Contacté</SelectItem>
                    <SelectItem key="en_discussion">En discussion</SelectItem>
                    <SelectItem key="glacial">Glacial</SelectItem>
                  </StyledSelect>
                  <Textarea
                    classNames={{
                      inputWrapper: "bg-page-bg",
                    }}
                    label="Commentaire"
                    placeholder="Ajoutez un commentaire sur ce prospect..."
                    value={newProspect.commentaire}
                    onChange={(e) =>
                      setNewProspect({
                        ...newProspect,
                        commentaire: e.target.value,
                      })
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  variant="light"
                  onPress={() => setIsAddProspectModalOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Annuler
                </Button>
                <Button
                  color='primary'
                  onPress={() => {
                    // TODO: Implémenter la logique d'ajout de prospect
                    setIsAddProspectModalOpen(false);
                    // Réinitialiser le formulaire
                    setNewProspect({
                      nomEtablissement: "",
                      categorie1: "",
                      categorie2: "",
                      email: "",
                      telephone: "",
                      adresse: "",
                      commentaire: "",
                      suiviPar: "",
                      statut: "a_contacter",
                    });
                  }}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  Ajouter le prospect
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Modal d'événement */}
          <EventModal
            isOpen={isEventModalOpen}
            onEventAdded={() => { }}
            onOpenChange={setIsEventModalOpen}
          />
        </CardBody>
      </Card>

      {/* Modal unifié pour tous les types d'événements */}
      <UnifiedEventModal
        eventType={currentEventType}
        isOpen={isUnifiedModalOpen}
        onEventAdded={refreshCachedData}
        onOpenChange={setIsUnifiedModalOpen}
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
