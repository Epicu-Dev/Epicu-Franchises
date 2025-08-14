'use client';

import { Button } from '@heroui/button';
import { PlusIcon, ChartBarIcon, EyeIcon, UsersIcon, ShoppingCartIcon, CalendarIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { MetricCard } from '@/components/metric-card';
import { DashboardLayout } from '../dashboard-layout';

export default function HomePage() {
  const metrics = [
    {
      value: '+59k',
      label: 'Nombre d\'abonnés',
      icon: <ChartBarIcon className="h-6 w-6" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      value: '+10M',
      label: 'Nombre de vues',
      icon: <EyeIcon className="h-6 w-6" />,
      iconBgColor: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      value: '143',
      label: 'Prospects',
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      value: '14.70%',
      label: 'Taux de conversion',
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <DashboardLayout>
            {/* Action Button */}
            <div className="flex justify-end mb-6">
              <Button
                color="primary"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
              >
                Ajouter un prospect
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  value={metric.value}
                  label={metric.label}
                  icon={metric.icon}
                  iconBgColor={metric.iconBgColor}
                  iconColor={metric.iconColor}
                />
              ))}
            </div>

            {/* Additional Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Activité récente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Nouveau prospect ajouté</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 2 heures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Rendez-vous confirmé</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 4 heures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Facture envoyée</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 6 heures</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Actions rapides
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="bordered"
                    className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    <span className="text-xs">Nouveau RDV</span>
                  </Button>
                  <Button
                    variant="bordered"
                    className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <UsersIcon className="h-5 w-5" />
                    <span className="text-xs">Nouveau client</span>
                  </Button>
                  <Button
                    variant="bordered"
                    className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    <span className="text-xs">Nouvelle facture</span>
                  </Button>
                  <Button
                    variant="bordered"
                    className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-xs">Nouvelle tâche</span>
                  </Button>
                </div>
              </div>
            </div>
    </DashboardLayout>
  );
}
