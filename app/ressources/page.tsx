"use client";

import { useState, useEffect } from "react";
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
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useUser } from "@/contexts/user-context";

// Interface pour les données de l'API
interface ApiResource {
  id: string;
  objet: string;
  onglet: string;
  commentaires: string;
  lien: string;
  dateAjout: string;
}

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  link: string;
  dateAdded: string;
  category: ResourceCategory;
  icon: React.ComponentType<any>;
}

export default function RessourcesPage() {
  const [selectedTab, setSelectedTab] = useState<ResourceCategory>("liens-importants");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm] = useState("");
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authFetch } = useAuthFetch();
  const { userType } = useUser();

  // Fonction pour formater les dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return new Date().toLocaleDateString('fr-FR');
    }

    try {
      // Essayer de parser la date directement
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        // Si la date n'est pas valide, essayer d'autres formats
        // Format DD.MM.YYYY
        if (dateString.includes('.')) {
          const parts = dateString.split('.');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            const isoDate = `${year}-${month}-${day}`;
            const parsedDate = new Date(isoDate);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toLocaleDateString('fr-FR');
            }
          }
        }
        
        // Si aucun format ne fonctionne, retourner la date actuelle
        return new Date().toLocaleDateString('fr-FR');
      }
      
      return date.toLocaleDateString('fr-FR');
    } catch {
      // En cas d'erreur, retourner la date actuelle
      return new Date().toLocaleDateString('fr-FR');
    }
  };

  // Fonction pour récupérer les données de l'API
  const fetchResources = async (category: ResourceCategory) => {
    setLoading(true);
    setError(null);
    
    try {
      // Déterminer l'endpoint selon la catégorie
      let endpoint = '';
      switch (category) {
        case 'liens-importants':
          endpoint = '/api/ressources/link-importants';
          break;
        case 'ressources-canva':
          endpoint = '/api/ressources/canva';
          break;
        case 'materiel':
          endpoint = '/api/ressources/materiel';
          break;
        default:
          endpoint = '/api/ressources/link-importants';
      }

      const response = await authFetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transformer les données de l'API en format ResourceItem
      const transformedResources: ResourceItem[] = data.results.map((item: ApiResource) => ({
        id: item.id,
        title: item.objet,
        description: item.commentaires || '',
        link: item.lien || '',
        dateAdded: formatDate(item.dateAjout),
        category: category,
        icon: getIconComponent(item.objet)
      }));

      setResources(transformedResources);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de la récupération des ressources:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant et lors du changement d'onglet
  useEffect(() => {
    fetchResources(selectedTab);
  }, [selectedTab]);

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
    // Parser les dates formatées (format DD/MM/YYYY)
    const parseDate = (dateStr: string): Date => {
      try {
        // Si la date contient des points, les remplacer par des slashes
        const normalizedDate = dateStr.replace(/\./g, '/');
        const parts = normalizedDate.split('/');
        
        if (parts.length === 3) {
          // Format DD/MM/YYYY -> YYYY-MM-DD pour le constructeur Date
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return new Date(`${year}-${month}-${day}`);
        }
        
        return new Date(normalizedDate);
      } catch {
        return new Date();
      }
    };

    const dateA = parseDate(a.dateAdded);
    const dateB = parseDate(b.dateAdded);

    return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });

  const handleAddResource = async (resourceData: Omit<Resource, "id" | "dateAdded">) => {
    try {
      // Utiliser la catégorie sélectionnée dans le modal
      const category = resourceData.category || selectedTab;

      // Déterminer l'endpoint selon la catégorie
      let endpoint = '';
      switch (category) {
        case 'liens-importants':
          endpoint = '/api/ressources/link-importants';
          break;
        case 'ressources-canva':
          endpoint = '/api/ressources/canva';
          break;
        case 'materiel':
          endpoint = '/api/ressources/materiel';
          break;
        default:
          endpoint = '/api/ressources/link-importants';
      }

      const response = await authFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Objet: resourceData.title,
          Commentaires: resourceData.description,
          Lien: resourceData.link,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Recharger les données de la catégorie sélectionnée
      await fetchResources(category);
      
      // Si la catégorie ajoutée est différente de l'onglet actuel, changer d'onglet
      if (category !== selectedTab) {
        setSelectedTab(category);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de l\'ajout de la ressource:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    }
  };

  const getIconComponent = (title: string): React.ComponentType<any> => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('drive') || titleLower.includes('stockage')) {
      return FolderIcon;
    } else if (titleLower.includes('dashboard') || titleLower.includes('performance')) {
      return ChartBarIcon;
    } else if (titleLower.includes('mail') || titleLower.includes('email')) {
      return EnvelopeIcon;
    } else if (titleLower.includes('wordpress') || titleLower.includes('site')) {
      return GlobeAltIcon;
    } else if (titleLower.includes('boards') || titleLower.includes('raccourci')) {
      return StarIcon;
    } else if (titleLower.includes('form') || titleLower.includes('formulaire')) {
      return DocumentTextIcon;
    } else if (titleLower.includes('canva') || titleLower.includes('template') || titleLower.includes('story') || titleLower.includes('signature')) {
      return PaintBrushIcon;
    } else {
      return FolderIcon;
    }
  };

  return (
    <div >
      <Card className="w-full" shadow="none">
        <CardHeader className="p-2 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center w-full">
            <div className="overflow-x-auto w-full">
              <Tabs
                className="pt-3 text-xl min-w-max"
                classNames={{
                  cursor: "w-[50px] left-[12px] h-1 rounded",
                  tab: "pb-6 data-[selected=true]:font-semibold text-base font-light whitespace-nowrap",
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
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {userType === "admin" && (
                <Button
                  color="primary"
                  endContent={<PlusIcon className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                  onPress={() => setIsModalOpen(true)}
                >
                  Ajouter un document
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-2 sm:p-6">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Chargement des ressources...</div>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-500">Erreur: {error}</div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="overflow-x-auto">
              <Table aria-label="Table des ressources" shadow="none" classNames={{
                wrapper: "min-w-full",
                table: "min-w-[600px]"
              }}>
                <TableHeader>
                  <TableColumn className="font-light text-sm min-w-[200px]">Objet</TableColumn>
                  <TableColumn className="font-light text-sm min-w-[200px]">Commentaires</TableColumn>
                  <TableColumn className="font-light text-sm min-w-[150px]">Lien</TableColumn>
                  <TableColumn className="min-w-[120px]">
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
                {sortedResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Aucune ressource trouvée pour cet onglet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedResources.map((resource) => (
                    <TableRow key={resource.id} className="border-t border-gray-100  dark:border-gray-700">
                      <TableCell className="py-5 text-xs sm:text-sm">
                        <span className="font-light">
                          {resource.title}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span className="font-light">
                          {resource.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Button
                          as="a"
                          className="rounded-full font-light text-xs sm:text-sm border-1"
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
                      <TableCell className="text-xs sm:text-sm">
                        <span className="font-light">
                          {resource.dateAdded}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <ResourceModal
        isOpen={isModalOpen}
        mode="create"
        currentCategory={selectedTab}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddResource}
      />
    </div>
  );
}
