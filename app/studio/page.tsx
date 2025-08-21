'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';
import { PrestationModal } from '../../components/prestation-modal';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@heroui/pagination';

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
  invoiceStatus: 'Payée' | 'En attente' | 'En retard';
  category: 'FOOD' | 'SHOP' | 'TRAVEL' | 'FUN' | 'BEAUTY';
}

// Services par défaut basés sur l'image
const defaultServices: Service[] = [
  {
    id: '1',
    title: 'Graphisme',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'design'
  },
  {
    id: '2',
    title: 'Motion Design',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'animation'
  },
  {
    id: '3',
    title: 'Photos / Vidéos',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'media'
  },
  {
    id: '4',
    title: 'Dev web',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'development'
  },
  {
    id: '5',
    title: 'Référencement SEO',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'marketing'
  },
  {
    id: '6',
    title: 'Community management',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'social'
  },
  {
    id: '7',
    title: 'Data Analyse',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'analytics'
  },
  {
    id: '8',
    title: 'Sérigraphie & Textiles',
    description: 'Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.',
    category: 'printing'
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
    invoiceStatus: 'En attente',
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
    amount: 2200,
    commission: 220,
    invoiceStatus: 'En attente',
    category: 'FUN'
  }
];

export default function StudioPage() {
  const [selectedTab, setSelectedTab] = useState('prestations');
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>(defaultPrestations);
  const [loading, setLoading] = useState(false);
  const [isPrestationModalOpen, setIsPrestationModalOpen] = useState(false);

  // Debug: vérifier que les services sont bien chargés
  console.log('Services disponibles:', services);
  console.log('Nombre de services:', services.length);

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
    } catch (error) {
      console.error('Erreur:', error);
      // En cas d'erreur, on garde les services par défaut
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "En attente":
        return "bg-yellow-100 text-yellow-800";
      case "Payée":
        return "bg-green-100 text-green-800";
      case "En retard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "FOOD":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "SHOP":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "TRAVEL":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "FUN":
        return "bg-green-50 text-green-700 border-green-200";
      case "BEAUTY":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full" shadow="none">
        <CardBody className="p-6">
          {/* Onglets et bouton d'action sur la même ligne */}
          <div className="flex justify-between items-center mb-6">
            <Tabs
              className="w-full"
              classNames={{
                cursor: "w-[50px] left-[12px] h-1",
              }}
              selectedKey={selectedTab}
              variant='underlined'
              onSelectionChange={(key) => handleTabChange(key as string)}
            >
              <Tab key="prestations" title="Liste des prestations" />
              <Tab key="packs" title="Les packs" />
              <Tab key="en_cours" title="Mes prestations en cours" />
            </Tabs>
            <div>

              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
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


                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className=" relative p-6 bg-white dark:bg-gray-800 rounded-lg hover:border  hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer "
                      >
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {service.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {pack.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pack.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {pack.price}€
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
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
                        selectedKeys={[]}
                        onSelectionChange={() => { }}
                      >
                        <SelectItem key="tous">Tous les statuts</SelectItem>
                        <SelectItem key="en_cours">En cours</SelectItem>
                        <SelectItem key="terminee">Terminée</SelectItem>
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
                            "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white dark:bg-gray-800",
                        }}
                        placeholder="Rechercher..."
                        type="text"
                      />
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>

                  {/* Table */}
                  <Table aria-label="Tableau des prestations en cours" shadow="none">
                    <TableHeader>
                      <TableColumn>
                        <Button
                          className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                          variant="light"
                        >
                          Catégorie
                        </Button>
                      </TableColumn>
                      <TableColumn>Nom établissement</TableColumn>
                      <TableColumn>
                        <Button
                          className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                          variant="light"
                        >
                          Date signature contrat
                        </Button>
                      </TableColumn>
                      <TableColumn>
                        <Button
                          className="p-0 h-auto font-semibold text-gray-700 dark:text-gray-300"
                          variant="light"
                        >
                          Prestation demandée
                        </Button>
                      </TableColumn>
                      <TableColumn>Facture</TableColumn>
                      <TableColumn>Montant prestation</TableColumn>
                      <TableColumn>Montant commission</TableColumn>
                      <TableColumn>Progression</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {prestations.map((prestation) => (
                        <TableRow key={prestation.id}>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryBadgeColor(prestation.category)}`}>
                              {prestation.category}
                            </span>
                          </TableCell>
                          <TableCell >{prestation.establishmentName}</TableCell>
                          <TableCell>{prestation.contractDate}</TableCell>
                          <TableCell >
                            {prestation.serviceTitle}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(prestation.invoiceStatus)}`}>
                              {prestation.invoiceStatus}
                            </span>
                          </TableCell>
                          <TableCell >{prestation.amount}€</TableCell>
                          <TableCell >{prestation.commission}€</TableCell>
                          <TableCell>
                            {prestation.status === 'en_cours' && (
                              <Progress
                                className="w-20"
                                classNames={{
                                  track: "bg-gray-200 dark:bg-gray-700",
                                  indicator: "bg-black dark:bg-white"
                                }}
                                showValueLabel={true}
                                value={prestation.progress}
                                size="sm"
                              />
                            )}
                          </TableCell>
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
                      page={1}
                      total={3}
                      onChange={() => { }}
                    />
                  </div>

                  {/* Info sur le nombre total d'éléments */}
                  <div className="text-center mt-4 text-sm text-gray-500">
                    Affichage de {prestations.length} prestation(s) au total
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
        onClose={handleClosePrestationModal}
        onPrestationRequested={() => {
          console.log('Prestation demandée avec succès');
          // Ici vous pouvez ajouter une logique supplémentaire si nécessaire
        }}
        services={services}
      />
    </div>
  );
}
