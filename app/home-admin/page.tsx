"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
} from "@heroicons/react/24/outline";
import { Card, CardBody } from "@heroui/card";

import { DashboardLayout } from "../dashboard-layout";

import { MetricCard } from "@/components/metric-card";
import { AgendaModals } from "@/components/agenda-modals";
import { AgendaSection } from "@/components/agenda-section";
import { StyledSelect } from "@/components/styled-select";

export default function HomeAdminPage() {
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
  const [isTournageModalOpen, setIsTournageModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);

  const allMetrics = [
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

  const agendaEvents = [
    {
      clientName: "Nom client",
      date: "12.07.2025",
      type: "Tournage",
    },
    {
      clientName: "Nom client",
      date: "12.07.2025",
      type: "Rendez-vous",
    },
    {
      clientName: "Nom client",
      date: "12.07.2025",
      type: "Evènement",
    },
  ];

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
                  className="bg-custom-blue-select/14 text-custom-blue-select hover:bg-custom-blue-select/20 border-0"
                  size="sm"
                >
                  Ce mois-ci
                </Button>
                <Button
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                  size="sm"
                >
                  Cette année
                </Button>
              </div>
            </div>
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

            {/* Right side - Agenda Section */}
            <div className="w-80">
              <AgendaSection
                events={agendaEvents}
                onPublicationSelect={() => setIsPublicationModalOpen(true)}
                onRendezVousSelect={() => setIsRdvModalOpen(true)}
                onTournageSelect={() => setIsTournageModalOpen(true)}
              />
            </div>
          </div>

          {/* Modal d'ajout de prospect */}
          <Modal
            isOpen={isAddProspectModalOpen}
            onOpenChange={setIsAddProspectModalOpen}
          >
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1">
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

          {/* Modals d'agenda */}
          <AgendaModals
            isPublicationModalOpen={isPublicationModalOpen}
            isRdvModalOpen={isRdvModalOpen}
            isTournageModalOpen={isTournageModalOpen}
            setIsPublicationModalOpen={setIsPublicationModalOpen}
            setIsRdvModalOpen={setIsRdvModalOpen}
            setIsTournageModalOpen={setIsTournageModalOpen}
          />
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
