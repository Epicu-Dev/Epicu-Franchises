'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/input';
import { PlusIcon, ChartBarIcon, EyeIcon, UsersIcon, ShoppingCartIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { MetricCard } from '@/components/metric-card';
import { DashboardLayout } from '../dashboard-layout';

export default function HomeAdminPage() {
  const [isAddProspectModalOpen, setIsAddProspectModalOpen] = useState(false);
  const [newProspect, setNewProspect] = useState({
    nomEtablissement: '',
    categorie1: '',
    categorie2: '',
    email: '',
    telephone: '',
    adresse: '',
    commentaire: '',
    suiviPar: '',
    statut: 'a_contacter' as 'a_contacter' | 'en_discussion' | 'glacial'
  });

  const metrics = [
    {
      value: '759k€',
      label: 'Chiffres d\'affaires global',
      icon: <ChartBarIcon className="h-6 w-6" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      value: '760',
      label: 'Clients signés',
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      value: '1243',
      label: 'Prospects',
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      value: '31',
      label: 'Franchises',
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      value: '75',
      label: 'Posts publiés',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      value: '35',
      label: 'Prestations Studio',
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      value: '190k',
      label: 'Abonnés',
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      value: '175k',
      label: 'Vues',
      icon: <EyeIcon className="h-6 w-6" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  const agendaEvents = [
    {
      clientName: 'Nom client',
      date: '12.07.2025',
      type: 'Tournage',
      color: 'bg-pink-100 text-pink-800'
    },
    {
      clientName: 'Nom client',
      date: '12.07.2025',
      type: 'Rendez-vous',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      clientName: 'Nom client',
      date: '12.07.2025',
      type: 'Evènement',
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  return (
    <DashboardLayout>
      {/* Top Control Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-5 w-5 text-gray-600" />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0"
            >
              Ce mois-ci
            </Button>
            <Button
              size="sm"
              variant="bordered"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cette année
            </Button>
          </div>
        </div>
        <Button
          className="bg-black text-white hover:bg-gray-800"
          startContent={<PlusIcon className="h-4 w-4" />}
          onPress={() => setIsAddProspectModalOpen(true)}
        >
          Ajouter un prospect
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
                value={metric.value}
                label={metric.label}
                icon={metric.icon}
                iconBgColor={metric.iconBgColor}
                iconColor={metric.iconColor}
              />
            ))}
          </div>
        </div>

        {/* Right side - Agenda Section */}
        <div className="w-80">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Agenda
              </h3>
              <Button
                isIconOnly
                size="sm"
                className="bg-black dark:bg-white text-white dark:text-black"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {agendaEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {event.clientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.date}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.color}`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout de prospect */}
      <Modal isOpen={isAddProspectModalOpen} onOpenChange={setIsAddProspectModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Ajouter un nouveau prospect</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom de l'établissement"
                placeholder="Entrez le nom de l'établissement"
                value={newProspect.nomEtablissement}
                onChange={(e) => setNewProspect({...newProspect, nomEtablissement: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@exemple.com"
                value={newProspect.email}
                onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
              />
              <Input
                label="Téléphone"
                placeholder="+33 1 23 45 67 89"
                value={newProspect.telephone}
                onChange={(e) => setNewProspect({...newProspect, telephone: e.target.value})}
              />
              <Input
                label="Adresse"
                placeholder="123 Rue de la Paix, 75001 Paris"
                value={newProspect.adresse}
                onChange={(e) => setNewProspect({...newProspect, adresse: e.target.value})}
              />
              <Select
                label="Catégorie principale"
                placeholder="Sélectionnez une catégorie"
                selectedKeys={newProspect.categorie1 ? [newProspect.categorie1] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setNewProspect({...newProspect, categorie1: selectedKey});
                }}
              >
                <SelectItem key="restaurant">Restaurant</SelectItem>
                <SelectItem key="coiffure">Coiffure</SelectItem>
                <SelectItem key="esthetique">Esthétique</SelectItem>
                <SelectItem key="fitness">Fitness</SelectItem>
                <SelectItem key="autre">Autre</SelectItem>
              </Select>
              <Select
                label="Statut"
                placeholder="Sélectionnez un statut"
                selectedKeys={newProspect.statut ? [newProspect.statut] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as 'a_contacter' | 'en_discussion' | 'glacial';
                  setNewProspect({...newProspect, statut: selectedKey});
                }}
              >
                <SelectItem key="a_contacter">À contacter</SelectItem>
                <SelectItem key="en_discussion">En discussion</SelectItem>
                <SelectItem key="glacial">Glacial</SelectItem>
              </Select>
              <Textarea
                label="Commentaire"
                placeholder="Ajoutez un commentaire sur ce prospect..."
                value={newProspect.commentaire}
                onChange={(e) => setNewProspect({...newProspect, commentaire: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddProspectModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-black text-white hover:bg-gray-800"
              onPress={() => {
                // TODO: Implémenter la logique d'ajout de prospect
                console.log('Nouveau prospect:', newProspect);
                setIsAddProspectModalOpen(false);
                // Réinitialiser le formulaire
                setNewProspect({
                  nomEtablissement: '',
                  categorie1: '',
                  categorie2: '',
                  email: '',
                  telephone: '',
                  adresse: '',
                  commentaire: '',
                  suiviPar: '',
                  statut: 'a_contacter'
                });
              }}
            >
              Ajouter le prospect
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}
