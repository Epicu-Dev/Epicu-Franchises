'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

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
}

export default function StudioPage() {
  const [selectedTab, setSelectedTab] = useState('prestations');
  const [services, setServices] = useState<Service[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);

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
          setServices(data.data);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedTab);
  }, [selectedTab]);

  const handleTabChange = (key: string) => {
    setSelectedTab(key);
  };

  return (
    <div className="w-full">
      <Card className="w-full">
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

            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Demander une prestation
            </Button>
          </div>

          {/* Contenu selon l'onglet sélectionné */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="text-black dark:text-white" size="lg" />
            </div>
          ) : (
            <>
              {selectedTab === 'prestations' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="group relative p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer hover:shadow-md"
                    >
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          Logo, identité visuelle, packaging, supports... Donnez vie à votre marque avec des créations graphiques uniques et cohérentes.
                        </p>
                      </div>

                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200" />
                    </div>
                  ))}
                </div>
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
                  {prestations.map((prestation) => (
                    <div
                      key={prestation.id}
                      className="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {prestation.serviceTitle}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Commencé le {new Date(prestation.startDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${prestation.status === 'en_cours'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : prestation.status === 'terminee'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                          {prestation.status === 'en_cours' ? 'En cours' :
                            prestation.status === 'terminee' ? 'Terminée' : 'En attente'}
                        </span>
                      </div>
                      {prestation.status === 'en_cours' && (
                        <Progress
                          className="w-full"
                          classNames={{
                            track: "bg-gray-200 dark:bg-gray-700",
                            indicator: "bg-black dark:bg-white"
                          }}
                          showValueLabel={true}
                          value={prestation.progress}
                        />
                      )}
                    </div>
                  ))}
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
    </div>
  );
}
