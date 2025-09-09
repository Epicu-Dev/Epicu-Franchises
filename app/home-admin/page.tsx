"use client";

import { useState, useEffect, useMemo } from "react";
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
import { SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import {
  UsersIcon,
  ShoppingCartIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Card, CardBody } from "@heroui/card";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";

import { DashboardLayout } from "../dashboard-layout";

import { MetricCard } from "@/components/metric-card";
import { StatsGrid } from "@/components/stats-grid";
import { AgendaModals } from "@/components/agenda-modals";
import { EventModal } from "@/components/event-modal";
import { AgendaSection } from "@/components/agenda-section";
import { StyledSelect } from "@/components/styled-select";
import { useUser } from "@/contexts/user-context";
import { useLoading } from "@/contexts/loading-context";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

export default function HomeAdminPage() {
  const { userProfile } = useUser();
  const { setUserProfileLoaded } = useLoading();
  const { authFetch } = useAuthFetch();
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(
    today(getLocalTimeZone())
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddProspectModalOpen, setIsAddProspectModalOpen] = useState(false);
  const [activeTab] = useState("overview");
  const [selectedCategory] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "year">("month");
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
    totalVues: number;
    totalProspectsSignes: number;
    tauxConversion: number;
    totalClients: number;
    totalFranchises: number;
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
      const selectedDateObj = selectedDate.toDate(getLocalTimeZone());
      const monthYear = `${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${selectedDateObj.getFullYear()}`;

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
          totalVues: data.totalVues || 0,
          totalProspectsSignes: data.totalProspectsSignes || data.prospectsSignesDsLeMois || 0,
          tauxConversion: data.tauxConversion || data.tauxDeConversion || 0,
          totalClients,
          totalProspects,
          totalFranchises: 0, // À implémenter si nécessaire
          totalPosts: 0, // À implémenter si nécessaire
          totalPrestations: 0, // À implémenter si nécessaire
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setStatistics(null);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Effet pour charger les statistiques au montage et quand la période change
  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod, selectedDate]);

  // Transformation des événements pour l'affichage

  const getAdditionalMetrics = () => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}k`;
      }
      return num.toString();
    };

    return [
      {
        value: statisticsLoading ? "..." : statistics ? statistics.totalClients.toString() : "0",
        label: "Clients",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-blue-select/40",
        iconColor: "text-custom-blue-select",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? statistics.totalProspects.toString() : "0",
        label: "Prospects",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-purple-studio/40",
        iconColor: "text-custom-purple-studio",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? statistics.totalFranchises.toString() : "0",
        label: "Franchises",
        icon: <ShoppingCartIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-orange-food/40",
        iconColor: "text-custom-orange-food",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: statisticsLoading ? "..." : statistics ? statistics.totalPosts.toString() : "0",
        label: "Posts publiés",
        icon: <DocumentTextIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-blue-select/40",
        iconColor: "text-custom-blue-select",
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
        <CardBody className="p-6">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-5 w-5 text-gray-600" />
              <div className="flex gap-2">
                <Button
                  className={
                    selectedPeriod === "month"
                      ? "bg-custom-blue-select/14 text-custom-blue-select hover:bg-custom-blue-select/20 border-0"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                  }
                  size="sm"
                  onPress={() => setSelectedPeriod("month")}
                >
                  Ce mois-ci
                </Button>
                <Button
                  className={
                    selectedPeriod === "year"
                      ? "bg-custom-blue-select/14 text-custom-blue-select hover:bg-custom-blue-select/20 border-0"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                  }
                  size="sm"
                  onPress={() => setSelectedPeriod("year")}
                >
                  Cette année
                </Button>
              </div>

            </div>
            <Button
              color='primary'
              endContent={<PlusIcon className="h-4 w-4" />}
              onPress={() => setIsEventModalOpen(true)}
            >
              Ajouter un évènement
            </Button>
          </div>


          {/* Main Layout - Stats Grid and Additional Metrics */}
          <div className="space-y-6">
            {/* Stats Grid - 4 principales métriques */}
            <StatsGrid
              statistics={statistics ? {
                abonnes: statistics.totalAbonnes,
                vues: statistics.totalVues,
                prospectsSignes: statistics.totalProspectsSignes,
                tauxConversion: statistics.tauxConversion
              } : null}
              loading={statisticsLoading}
            />

            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-2 gap-6">
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
          >
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 justify-center items-center text-center w-full">
                Ajouter un nouveau prospect
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
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
                    label="Email"
                    placeholder="email@exemple.com"
                    type="email"
                    value={newProspect.email}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, email: e.target.value })
                    }
                  />
                  <Input
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
                    <SelectItem key="a_contacter">À contacter</SelectItem>
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
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => setIsAddProspectModalOpen(false)}
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
    </DashboardLayout>
  );
}
