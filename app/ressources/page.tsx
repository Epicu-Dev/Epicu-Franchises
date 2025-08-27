"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import {
  FolderIcon,
  ChartBarIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  DocumentTextIcon,
  PlusIcon,
  PaintBrushIcon
} from "@heroicons/react/24/outline";

import ResourceModal from "../../components/resource-modal";
import { Resource, ResourceCategory } from "../../types/resource";

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  link: string;
  dateAdded: string;
  category: ResourceCategory;
  icon: React.ComponentType<any>;
}

const resourcesData: ResourceItem[] = [
  {
    id: "1",
    title: "LE DRIVE PARTAGÉ",
    description: "Stockage centralisé pour tous les documents EPICU (dossiers, contrats, visuels, ressources)",
    link: "https://drive.epicu.com",
    dateAdded: "12.08.2025",
    category: "liens-importants",
    icon: FolderIcon
  },
  {
    id: "2",
    title: "LE DASHBOARD EPICU",
    description: "Gestion des prospects et clients, suivi des performances",
    link: "https://dashboard.epicu.com",
    dateAdded: "12.08.2025",
    category: "liens-importants",
    icon: ChartBarIcon
  },
  {
    id: "3",
    title: "LA BOÎTE MAIL EPICU",
    description: "Gestion des emails professionnels via Infomaniak et centralisation des communications",
    link: "https://mail.epicu.com",
    dateAdded: "12.08.2025",
    category: "liens-importants",
    icon: EnvelopeIcon
  },
  {
    id: "4",
    title: "WORDPRESS EPICU",
    description: "Gestion du contenu du site et des pages partenaires",
    link: "https://wordpress.epicu.com",
    dateAdded: "12.08.2025",
    category: "liens-importants",
    icon: GlobeAltIcon
  },
  {
    id: "5",
    title: "BOARDS",
    description: "Création et utilisation de raccourcis clavier pour l'automatisation et l'accélération des réponses/publications",
    link: "https://boards.epicu.com",
    dateAdded: "12.08.2025",
    category: "liens-importants",
    icon: StarIcon
  },
  {
    id: "6",
    title: "GOOGLE FORMS - FORMULAIRE",
    description: "Formulaire pour les établissements (restaurants, boutiques, hébergements) avant le tournage pour collecter les infos nécessaires à la préparation vidéo",
    link: "https://forms.google.com/epicu",
    dateAdded: "12.08.2025",
    category: "liens-importants",
    icon: DocumentTextIcon
  },
  // Ressources Canva
  {
    id: "7",
    title: "Page de Garde pour les Dossiers de Rendez-vous",
    description: "À utiliser pour habiller les dossiers professionnels lors des rendez-vous avec des prospects.",
    link: "https://canva.com/page-garde",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  },
  {
    id: "8",
    title: "Télécharger la photo de profil d'un compte Instagram",
    description: "Gabarits pour publier des stories engageantes et harmonisées avec l'identité EPICU.",
    link: "https://canva.com/photo-profil",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  },
  {
    id: "9",
    title: "Templates pour les Stories Instagram",
    description: "Gabarits pour publier des stories engageantes et harmonisées avec l'identité EPICU.",
    link: "https://canva.com/stories",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  },
  {
    id: "10",
    title: "Fichiers Ressources",
    description: "Regroupe tous les éléments graphiques nécessaires à la création de contenus EPICU.",
    link: "https://canva.com/fichiers-ressources",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  },
  {
    id: "11",
    title: "Miniature Instagram pour un Réel",
    description: "À utiliser comme couverture pour les vidéos Instagram afin d'optimiser le visuel sur le feed.",
    link: "https://canva.com/miniature",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  },
  {
    id: "12",
    title: "Story Sponsorisée « Tu es de..»",
    description: "Story publicitaire ciblée pour promouvoir EPICU localement.",
    link: "https://canva.com/story-sponsorisee",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  },
  {
    id: "13",
    title: "Signature Mail personnalisée",
    description: "Signature professionnelle à intégrer aux emails pour un branding cohérent et professionnel.",
    link: "https://canva.com/signature-mail",
    dateAdded: "12.08.2025",
    category: "ressources-canva",
    icon: PaintBrushIcon
  }
];

export default function RessourcesPage() {
  const [selectedTab, setSelectedTab] = useState<ResourceCategory>("liens-importants");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm] = useState("");
  const [resources, setResources] = useState<ResourceItem[]>(resourcesData);

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const filteredResources = resources.filter(resource =>
    resource.category === selectedTab &&
    (searchTerm === "" ||
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedResources = [...filteredResources].sort((a, b) => {
    const dateA = new Date(a.dateAdded.split('.').reverse().join('-'));
    const dateB = new Date(b.dateAdded.split('.').reverse().join('-'));

    return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });

  const handleAddResource = (resourceData: Omit<Resource, "id" | "dateAdded">) => {
    const newResource: ResourceItem = {
      ...resourceData,
      id: Date.now().toString(),
      dateAdded: new Date().toLocaleDateString('fr-FR'),
      icon: resourceData.icon ? getIconComponent(resourceData.icon) : FolderIcon
    };

    setResources(prev => [...prev, newResource]);
  };

  const getIconComponent = (iconName: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'FolderIcon': FolderIcon,
      'ChartBarIcon': ChartBarIcon,
      'EnvelopeIcon': EnvelopeIcon,
      'GlobeAltIcon': GlobeAltIcon,
      'StarIcon': StarIcon,
      'DocumentTextIcon': DocumentTextIcon,
      'PaintBrushIcon': PaintBrushIcon,
    };

    return iconMap[iconName] || FolderIcon;
  };

  return (
    <div >
      <Card className="w-full" shadow="none">
        <CardHeader className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center w-full">
            <Tabs
              className=" pt-3 text-xl"
              classNames={{
                cursor: "w-[50px]  left-[12px] h-1   rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
              }}
              selectedKey={selectedTab}
              variant="underlined"
              onSelectionChange={(key) => setSelectedTab(key as ResourceCategory)}
            >
              <Tab
                key="liens-importants"
                title="Liens importants"
              />
              
              <Tab
                key="ressources-canva"
                title="Ressources Canva"
              />
              <Tab
                key="materiel"
                title="Matériel"
              />
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

              <Button
                color="primary"
                endContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => setIsModalOpen(true)}
              >
                Ajouter un document
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody >
          <Table aria-label="Table des ressources" shadow="none">
            <TableHeader>
              <TableColumn className="font-light text-sm">Objet</TableColumn>
              <TableColumn className="font-light text-sm">Commentaires</TableColumn>
              <TableColumn className="font-light text-sm">Lien</TableColumn>
              <TableColumn>
                <button
                  className="flex items-center gap-2 cursor-pointer font-light text-sm w-full text-left"
                  type="button"
                  onClick={handleSort}
                  onKeyDown={(e) => e.key === "Enter" && handleSort()}
                >
                  Date d&apos;ajout
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                </button>
              </TableColumn>
            </TableHeader>
            <TableBody>
              {sortedResources.map((resource) => (
                <TableRow key={resource.id} className="border-t border-gray-100  dark:border-gray-700">
                  <TableCell className="py-5">
                    <span className="font-light">
                      {resource.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-light">
                      {resource.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      as="a"
                      className="rounded-full font-light text-sm border-1"
                      color='primary'
                      href={resource.link}
                      rel="noopener noreferrer"
                      size="sm"
                      target="_blank"
                      variant="bordered"
                    >
                      {resource.title.includes("DRIVE") ? "Le drive →" :
                        resource.title.includes("DASHBOARD") ? "Le dashboard →" :
                          resource.title.includes("MAIL") ? "Boîte mail →" :
                            resource.title.includes("WORDPRESS") ? "Wordpress →" :
                              resource.title.includes("BOARDS") ? "Boards →" :
                                resource.title.includes("FORMS") ? "Google forms →" :
                                  resource.title.includes("Page de Garde") ? "Page de garde →" :
                                    resource.title.includes("photo de profil") ? "Photo de profil →" :
                                      resource.title.includes("Stories Instagram") ? "Stories →" :
                                        resource.title.includes("Fichiers Ressources") ? "Fichiers ressources →" :
                                          resource.title.includes("Miniature Instagram") ? "Miniature →" :
                                            resource.title.includes("Story Sponsorisée") ? "Story sponsorisée →" :
                                              resource.title.includes("Signature Mail") ? "Signature mail →" : "Voir →"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span className="font-light">
                      {new Date(resource.dateAdded).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '.')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <ResourceModal
        isOpen={isModalOpen}
        mode="create"
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddResource}
      />
    </div>
  );
}
