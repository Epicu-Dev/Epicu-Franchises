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
  ChartBarIcon,
  EyeIcon,
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

  // Mettre à jour le profil utilisateur chargé
  useEffect(() => {
    if (userProfile) {
      setUserProfileLoaded(true);
    }
  }, [userProfile, setUserProfileLoaded]);

  // Transformation des événements pour l'affichage

  const getMetricsForPeriod = (period: "month" | "year") => {
    const monthMetrics = [
      {
        value: "759k€",
        label: "Chiffres d'affaires global",
        icon: <ChartBarIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-green-stats/40",
        iconColor: "text-custom-green-stats",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: "760",
        label: "Clients signés",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-rose/40",
        iconColor: "text-custom-rose",
        city: "nantes",
        categories: ["FOOD", "SHOP"],
      },
      {
        value: "1243",
        label: "Prospects",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-yellow-100",
        iconColor: "text-yellow-400",
        city: "saint-brieuc",
        categories: ["TRAVEL", "FUN"],
      },
      {
        value: "31",
        label: "Franchises",
        icon: <ShoppingCartIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-orange-food/40",
        iconColor: "text-custom-orange-food",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: "75",
        label: "Posts publiés",
        icon: <DocumentTextIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-blue-select/40",
        iconColor: "text-custom-blue-select",
        city: "nantes",
        categories: ["BEAUTY", "FOOD"],
      },
      {
        value: "35",
        label: "Prestations Studio",
        icon: <ShoppingCartIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-purple-studio/40",
        iconColor: "text-custom-purple-studio",
        city: "saint-brieuc",
        categories: ["SHOP", "TRAVEL"],
      },
      {
        value: "190k",
        label: "Abonnés",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-green-stats/40",
        iconColor: "text-custom-green-stats",
        city: "nantes",
        categories: ["FUN", "BEAUTY"],
      },
      {
        value: "175k",
        label: "Vues",
        icon: <EyeIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-rose/40",
        iconColor: "text-custom-rose",
        city: "saint-brieuc",
        categories: ["FOOD", "SHOP"],
      },
    ];

    const yearMetrics = [
      {
        value: "8.2M€",
        label: "Chiffres d'affaires global",
        icon: <ChartBarIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-green-stats/40",
        iconColor: "text-custom-green-stats",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: "8920",
        label: "Clients signés",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-rose/40",
        iconColor: "text-custom-rose",
        city: "nantes",
        categories: ["FOOD", "SHOP"],
      },
      {
        value: "15420",
        label: "Prospects",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-yellow-100",
        iconColor: "text-yellow-400",
        city: "saint-brieuc",
        categories: ["TRAVEL", "FUN"],
      },
      {
        value: "372",
        label: "Franchises",
        icon: <ShoppingCartIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-orange-food/40",
        iconColor: "text-custom-orange-food",
        city: "overview",
        categories: ["FOOD", "SHOP", "TRAVEL", "FUN", "BEAUTY"],
      },
      {
        value: "890",
        label: "Posts publiés",
        icon: <DocumentTextIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-blue-select/40",
        iconColor: "text-custom-blue-select",
        city: "nantes",
        categories: ["BEAUTY", "FOOD"],
      },
      {
        value: "420",
        label: "Prestations Studio",
        icon: <ShoppingCartIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-purple-studio/40",
        iconColor: "text-custom-purple-studio",
        city: "saint-brieuc",
        categories: ["SHOP", "TRAVEL"],
      },
      {
        value: "2.1M",
        label: "Abonnés",
        icon: <UsersIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-green-stats/40",
        iconColor: "text-custom-green-stats",
        city: "nantes",
        categories: ["FUN", "BEAUTY"],
      },
      {
        value: "1.8M",
        label: "Vues",
        icon: <EyeIcon className="h-6 w-6" />,
        iconBgColor: "bg-custom-rose/40",
        iconColor: "text-custom-rose",
        city: "saint-brieuc",
        categories: ["FOOD", "SHOP"],
      },
    ];

    return period === "month" ? monthMetrics : yearMetrics;
  };

  const allMetrics = getMetricsForPeriod(selectedPeriod);

  // Filtrer les métriques selon l'onglet actif et la catégorie sélectionnée
  const metrics = allMetrics.filter((metric) => {
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


          {/* Main Layout - Metrics Grid on left, Agenda on right */}
          <div className="flex flex-row gap-6">
            {/* Left side - 4x2 Metrics Grid */}
            <div className="flex-1">
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
