'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { ArrowUpRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@heroui/pagination';

import { PrestationModal } from '../../components/prestation-modal';

import { CategoryBadge, StatusBadge } from '@/components/badges';
import { SortableColumnHeader } from '@/components';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  duration?: string;
}

interface Pack {
  id: string;
  title: string;
  description: string;
  services: string[];
  price: number;
  duration: string;
}

interface Prestation {
  id: string;
  serviceId: string;
  serviceTitle: string;
  status: 'en_cours' | 'terminee' | 'en_attente';
  startDate: string;
  endDate?: string;
  progress: number;
  establishmentName: string;
  contractDate: string;
  amount: number;
  commission: number;
  invoiceStatus: 'Payée' | 'Attente' | 'En retard';
  category: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
}

// Services par défaut basés sur l'image
const defaultServices: Service[] = [
  {
    id: '1',
    title: 'Graphisme',
    description: 'Passionnée par les tendances visuelles, Marie imagine des identités graphiques uniques ! Logos, menus, affiches, plaquettes... un univers de A à Z !',
    category: 'design'
  },
  {
    id: '2',
    title: 'Développement web',
    description: 'Experte en UX/UI design, Louise conçoit des sites web élégants, ergonomiques et sur-mesure ! Esthétique et performance au rendez-vous !',
    category: 'development'
  },
  {
    id: '3',
    title: 'Community management',
    description: 'Créatives, Fanny et Valentine gèrent votre présence en ligne ! Elles transforment votre communauté en clientèle fidèle !',
    category: 'social'
  },
  {
    id: '4',
    title: 'Référencement SEO',
    description: 'Émilien booste durablement votre visibilité en vous aidant à remonter en première page Google ! Stratégie SEO sur-mesure : audit, conseil & rédaction optimisée !',
    category: 'marketing'
  },
  {
    id: '5',
    title: 'Shooting photos',
    description: 'Caroline capture l\'âme de votre univers à travers des photos haut de gamme !',
    category: 'media'
  },
  {
    id: '6',
    title: 'Vidéos & montages',
    description: 'Quentin révèle la personnalité de votre lieu avec des vidéos lifestyle chaleureuses et authentiques !',
    category: 'media'
  },
  {
    id: '7',
    title: 'Motion Design',
    description: 'Spécialiste de l\'animation et du storytelling, Pierre donne vie à vos idées avec des vidéos animées dynamiques et engageantes !',
    category: 'animation'
  },
  {
    id: '8',
    title: 'Sérigraphie & Textiles',
    description: 'Pour du merchandising à ton image ! Thomas crée des pièces textiles personnalisées (tote-bags, t-shirts, sweats...) avec des impressions artisanales de qualité !',
    category: 'printing'
  },
  {
    id: '9',
    title: 'Data Analyse',
    description: 'Le roi de l\'automatisation et de l\'optimisation ! Walter crée, structure, connecte et fluidifie tous vos outils digitaux (CRM, formulaires, plateformes...) !',
    category: 'analytics'
  }
];

// Données d'exemple pour les prestations en cours
const defaultPrestations: Prestation[] = [
  {
    id: '1',
    serviceId: '1',
    serviceTitle: 'Graphisme',
    status: 'en_cours',
    startDate: '2025-01-15',
    progress: 75,
    establishmentName: 'L\'ambiance',
    contractDate: '08.06.2025',
    amount: 2700,
    commission: 270,
    invoiceStatus: 'Payée',
    category: 'SHOP'
  },
  {
    id: '2',
    serviceId: '4',
    serviceTitle: 'Dev web',
    status: 'en_cours',
    startDate: '2025-01-20',
    progress: 45,
    establishmentName: 'Le Petit Bistrot',
    contractDate: '15.01.2025',
    amount: 4500,
    commission: 450,
    invoiceStatus: 'Attente',
    category: 'FOOD'
  },
  {
    id: '3',
    serviceId: '6',
    serviceTitle: 'Community management',
    status: 'en_cours',
    startDate: '2025-01-25',
    progress: 30,
    establishmentName: 'Beauty Studio',
    contractDate: '20.01.2025',
    amount: 1800,
    commission: 180,
    invoiceStatus: 'Payée',
    category: 'BEAUTY'
  },
  {
    id: '4',
    serviceId: '2',
    serviceTitle: 'Motion Design',
    status: 'terminee',
    startDate: '2025-01-10',
    endDate: '2025-01-30',
    progress: 100,
    establishmentName: 'Travel Agency',
    contractDate: '05.01.2025',
    amount: 3200,
    commission: 320,
    invoiceStatus: 'Payée',
    category: 'TRAVEL'
  },
  {
    id: '5',
    serviceId: '3',
    serviceTitle: 'Photos / Vidéos',
    status: 'en_attente',
    startDate: '2025-02-01',
    progress: 0,
    establishmentName: 'Fun Center',
    contractDate: '25.01.2025',
    amount: 2200, // TODO: mettre à jour avec la valeur de la prestation
    commission: 220,
    invoiceStatus: 'Attente',
    category: 'FUN'
  }
];

// Données d'exemple pour les packs
const defaultPacks: Pack[] = [
  {
    id: '1',
    title: 'Pack Starter',
    description: 'Pack de démarrage idéal pour les petites entreprises. Inclut logo, cartes de visite et supports de base.',
    services: ['Graphisme', 'Dev web'],
    price: 1500,
    duration: '2-3 semaines'
  },
  {
    id: '2',
    title: 'Pack Business',
    description: 'Pack complet pour les entreprises en croissance. Identité visuelle complète avec site web responsive.',
    services: ['Graphisme', 'Dev web', 'SEO'],
    price: 3500,
    duration: '4-6 semaines'
  },
  {
    id: '3',
    title: 'Pack Premium',
    description: 'Pack haut de gamme pour les grandes entreprises. Stratégie marketing complète avec community management.',
    services: ['Graphisme', 'Dev web', 'SEO', 'Community management', 'Motion Design'],
    price: 7500,
    duration: '8-10 semaines'
  },
  {
    id: '4',
    title: 'Pack E-commerce',
    description: 'Pack spécialisé pour les boutiques en ligne. Site e-commerce optimisé avec stratégie marketing.',
    services: ['Dev web', 'SEO', 'Community management', 'Data analyse'],
    price: 5500,
    duration: '6-8 semaines'
  }
];

export default function StudioPage() {
  const [selectedTab, setSelectedTab] = useState('prestations');
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [packs, setPacks] = useState<Pack[]>(defaultPacks);
  const [prestations, setPrestations] = useState<Prestation[]>(defaultPrestations);
  const [loading, setLoading] = useState(false);
  const [isPrestationModalOpen, setIsPrestationModalOpen] = useState(false);

  // États pour le filtrage, la recherche et la pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const fetchData = async (type: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/studio?type=${type}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const data = await response.json();

      switch (type) {
        case 'services':
          // Utiliser les données de l'API seulement si elles existent, sinon garder les services par défaut
          if (data.data && data.data.length > 0) {
            setServices(data.data);
          }
          break;
        case 'packs':
          setPacks(data.data);
          break;
        case 'prestations':
          setPrestations(data.data);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger les données seulement si ce n'est pas l'onglet des prestations (qui a déjà les services par défaut)
    if (selectedTab !== 'prestations') {
      fetchData(selectedTab);
    }
  }, [selectedTab]);

  const handleTabChange = (key: string) => {
    setSelectedTab(key);
  };

  const handleOpenPrestationModal = () => {
    setIsPrestationModalOpen(true);
  };

  const handleClosePrestationModal = () => {
    setIsPrestationModalOpen(false);
  };



  // Fonction de tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Fonction de filtrage et tri des prestations
  const getFilteredAndSortedPrestations = () => {
    let filtered = prestations.filter((prestation) => {
      const matchesSearch =
        prestation.establishmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "" || prestation.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Tri
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "category":
            aValue = a.category;
            bValue = b.category;
            break;
          case "establishmentName":
            aValue = a.establishmentName;
            bValue = b.establishmentName;
            break;
          case "contractDate":
            aValue = new Date(a.contractDate.split('.').reverse().join('-'));
            bValue = new Date(b.contractDate.split('.').reverse().join('-'));
            break;
          case "serviceTitle":
            aValue = a.serviceTitle;
            bValue = b.serviceTitle;
            break;
          case "amount":
            aValue = a.amount;
            bValue = b.amount;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;

        return 0;
      });
    }

    return filtered;
  };

  // Calcul de la pagination
  const filteredPrestations = getFilteredAndSortedPrestations();
  const totalPages = Math.ceil(filteredPrestations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrestations = filteredPrestations.slice(startIndex, startIndex + itemsPerPage);

  // Reset de la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  return (
    <div className="w-full">
      <Card className="w-full" shadow="none">
        <CardBody className="p-6">
          {/* Onglets et bouton d'action sur la même ligne */}
          <div className="flex justify-end items-center mb-6">
            {/* <Tabs
              className="w-full pt-3"
              classNames={{
                cursor: "w-[50px]  left-[12px] h-1   rounded",
                tab: "pb-6 data-[selected=true]:font-semibold text-base font-light ",
              }}
              selectedKey={selectedTab}
              variant='underlined'
              onSelectionChange={(key) => handleTabChange(key as string)}
            >
              <Tab key="prestations" title="Liste des prestations" />
            </Tabs> */}

            <div className='flex gap-4'>
              <Button
                className="border-1"
                color='primary'
                variant="bordered"
                onPress={() => {
                  window.open('https://drive.google.com/drive/folders/1MWGa91M_ybpGBG4XuFiyv-GuREZX7Fjk?usp=share_link', '_blank');
                }}
                endContent={<ArrowUpRightIcon className="h-4 w-4" />}
              >
                Accéder au drive
              </Button>
              <Button
                color='primary'
                endContent={<PlusIcon className="h-4 w-4" />}
                onClick={handleOpenPrestationModal}
              >
                Demander une prestation
              </Button>
            </div>
          </div>

          {/* Contenu selon l'onglet sélectionné */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          ) : (
            <>
              {selectedTab === 'prestations' && (
                <>


                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-primary px-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className=" relative p-2 "
                      >
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-primary">
                            {service.title}
                          </h3>
                          <p className="text-sm font-light">
                            {service.description}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                </>
              )}

              {selectedTab === 'packs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packs.map((pack) => (
                    <div
                      key={pack.id}
                      className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                    >
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-primary">
                          {pack.title}
                        </h3>
                        <p className="text-sm font-light">
                          {pack.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-primary">
                            {pack.price}€
                          </span>
                          <span className="text-sm font-light">
                            {pack.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'en_cours' && (
                <div className="space-y-4">
                  {/* Header with filters */}
                  <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-4">
                      <Select
                        className="w-48"
                        placeholder="Statut"
                        selectedKeys={selectedStatus ? [selectedStatus] : []}
                        onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string || "")}
                      >
                        <SelectItem key="">Tous les statuts</SelectItem>
                        <SelectItem key="en_cours">En cours</SelectItem>
                        <SelectItem key="terminee">Terminé</SelectItem>
                        <SelectItem key="en_attente">En attente</SelectItem>
                      </Select>
                    </div>

                    <div className="relative">
                      <Input
                        className="w-64 pr-4 pl-10"
                        classNames={{
                          input:
                            "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                          inputWrapper:
                            "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-page-bg",
                        }}
                        placeholder="Rechercher..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>

                  {/* Table */}
                  <Table aria-label="Tableau des prestations en cours" shadow="none">
                    <TableHeader>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="category"
                          label="Catégorie"
                          sortDirection={sortDirection}
                          sortField={sortField}
                          onSort={handleSort}
                        />

                      </TableColumn>
                      <TableColumn className="font-light text-sm">
                        Nom établissement
                      </TableColumn>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="contractDate"
                          label="Date signature contrat"
                          sortDirection={sortDirection}
                          sortField={sortField}
                          onSort={handleSort}
                        />
                      </TableColumn>
                      <TableColumn className="font-light text-sm">
                        <SortableColumnHeader
                          field="serviceTitle"
                          label="Prestation demandée"
                          sortDirection={sortDirection}
                          sortField={sortField}
                          onSort={handleSort}
                        />
                      </TableColumn>
                      <TableColumn className="font-light text-sm">Facture</TableColumn>
                      <TableColumn className="font-light text-sm">

                        Montant prestation

                      </TableColumn>
                      <TableColumn className="font-light text-sm">Montant commission</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {paginatedPrestations.map((prestation) => (
                        <TableRow key={prestation.id} className="border-t border-gray-100  dark:border-gray-700">
                          <TableCell>
                            <CategoryBadge category={prestation.category} />
                          </TableCell>
                          <TableCell className="py-5 font-light">{prestation.establishmentName}</TableCell>
                          <TableCell className="font-light">{prestation.contractDate}</TableCell>
                          <TableCell className="font-light">
                            {prestation.serviceTitle}
                          </TableCell>
                          <TableCell className="font-light">
                            <StatusBadge status={prestation.invoiceStatus} />
                          </TableCell>
                          <TableCell className="font-light">{prestation.amount}€</TableCell>
                          <TableCell className="font-light">{prestation.commission}€</TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex justify-center mt-6">
                    <Pagination
                      showControls
                      classNames={{
                        wrapper: "gap-2",
                        item: "w-8 h-8 text-sm",
                        cursor:
                          "bg-black text-white dark:bg-white dark:text-black font-bold",
                      }}
                      page={currentPage}
                      total={totalPages}
                      onChange={(page) => setCurrentPage(page)}
                    />
                  </div>

                </div>
              )}

              {/* Message si aucun contenu */}
              {((selectedTab === 'packs' && packs.length === 0) ||
                (selectedTab === 'en_cours' && prestations.length === 0)) && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">
                      {selectedTab === 'packs'
                        ? 'Aucun pack disponible pour le moment'
                        : 'Aucune prestation en cours'
                      }
                    </div>
                  </div>
                )}
            </>
          )}
        </CardBody>
      </Card>

      <PrestationModal
        isOpen={isPrestationModalOpen}
        services={services}
        onClose={handleClosePrestationModal}
        onPrestationRequested={() => {
          // Ici vous pouvez ajouter une logique supplémentaire si nécessaire
        }}
      />
    </div>
  );
}
