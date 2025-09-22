"use client";

import { useState, useEffect } from "react";
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
import { useUser } from "@/contexts/user-context";
import { useLoading } from "@/contexts/loading-context";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useDateFilters } from "@/hooks/use-date-filters";
import { formatNumberWithK } from "@/utils/format-numbers";

export default function HomeAdminPage() {
  const { userProfile } = useUser();
  const { setUserProfileLoaded } = useLoading();
  const { authFetch } = useAuthFetch();

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
    statut: "a_contacter" as "a_contacter" | "en_discussion" | "glacial",
  });

  // États pour les modals d'agenda
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

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

      // Construire les paramètres de requête pour l'API /api/data/data
      const params = new URLSearchParams();

      params.set('date', monthYear);
      params.set('ville', 'all'); // Pour l'admin, on récupère toutes les données

      const response = await authFetch(`/api/data/data?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

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
          totalAbonnes: data.totalAbonnes || 0,
          totalChiffreAffaires: data.totalChiffreAffaires || 0,
          totalVues: data.totalVues || 0,
          totalProspectsSignes: data.totalProspectsSignes || data.prospectsSignesDsLeMois || 0,
          tauxConversion: data.tauxConversion || data.tauxDeConversion || 0,
          totalStudio: data.totalStudio || 0,
          totalClients,
          totalProspects,
          totalFranchises: 0, // À implémenter si nécessaire
          totalPosts: 0, // À implémenter si nécessaire
          totalPrestations: 0, // À implémenter si nécessaire
        });
      }
    } catch {
      setStatistics(null);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Effet pour charger les statistiques au montage et quand la période change
  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod, selectedDate, selectedPeriodType]);

  // Effet pour synchroniser les états temporaires quand le modal s'ouvre
  useEffect(() => {
    if (isDateModalOpen) {
      syncTempStates();
    }
  }, [isDateModalOpen]);


  // Transformation des événements pour l'affichage

  const getAdditionalMetrics = () => {
    return [
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalChiffreAffaires) : "0",
        label: "Chiffres d'affaires global",
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
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalProspects) : "0",
        label: "Prestations Studio",
        icon: <StudioIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-purple-shop/40",
        iconColor: "text-custom-purple-shop",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalFranchises) : "0",
        label: "Abonnées",
        icon: <AbonnesIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-orange-abonnes/40",
        iconColor: "text-custom-orange-abonnes",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? formatNumberWithK(statistics.totalVues) : "0",
        label: "Vues",
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
              onDateModalOpen={onDateModalOpen}
              onCurrentMonthSelect={selectCurrentMonth}
              onCurrentYearSelect={selectCurrentYear}
            />
            
          </div>


          {/* Main Layout - Stats Grid and Additional Metrics */}
          <div className="space-y-4 sm:space-y-6">
            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 sm:gap-6">
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
                        | "en_discussion"
                        | "glacial";

                      setNewProspect({ ...newProspect, statut: selectedKey });
                    }}
                  >
                    <SelectItem key="a_contacter">Contacté</SelectItem>
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
