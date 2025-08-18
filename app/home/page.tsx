'use client';

import { Button } from '@heroui/button';
import { Calendar } from '@heroui/calendar';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { PlusIcon, ChartBarIcon, EyeIcon, UsersIcon, ShoppingCartIcon, CalendarIcon, DocumentTextIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import { MetricCard } from '@/components/metric-card';
import { DashboardLayout } from '../dashboard-layout';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(today(getLocalTimeZone()));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddTodoModalOpen, onOpen: onAddTodoModalOpen, onClose: onAddTodoModalClose } = useDisclosure();
  const [newTodo, setNewTodo] = useState({
    mission: '',
    deadline: '',
    status: 'En cours' as 'En cours' | 'En retard' | 'Terminé',
    color: 'bg-blue-100 text-blue-800'
  });

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

  const [todoItems, setTodoItems] = useState([
    {
      mission: 'Mission',
      deadline: 'Deadline',
      status: 'En cours',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      mission: 'Mission',
      deadline: 'Deadline',
      status: 'En retard',
      color: 'bg-red-100 text-red-800'
    },
    {
      mission: 'Mission',
      deadline: 'Deadline',
      status: 'En cours',
      color: 'bg-blue-100 text-blue-800'
    }
  ]);

  const handleAddTodo = () => {
    if (newTodo.mission.trim()) {
      const colorMap = {
        'En cours': 'bg-blue-100 text-blue-800',
        'En retard': 'bg-red-100 text-red-800',
        'Terminé': 'bg-green-100 text-green-800'
      };

      const todoToAdd = {
        ...newTodo,
        color: colorMap[newTodo.status]
      };

      setTodoItems(prev => [...prev, todoToAdd]);

      // Réinitialiser le formulaire
      setNewTodo({
        mission: '',
        deadline: '',
        status: 'En cours',
        color: 'bg-blue-100 text-blue-800'
      });

      onAddTodoModalClose();
    }
  };

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Re, Clémence!
        </h1>
      </div>

      {/* Location Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          size="sm"
          className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0"
        >
          Tout
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Vannes
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Nantes
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Saint-Brieuc
        </Button>
        <Button
          size="sm"
          variant="bordered"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          National
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-start gap-4 mb-6">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="text-gray-600"
          onPress={() => {
            const newDate = selectedDate.subtract({ months: 1 });
            setSelectedDate(newDate);
          }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="light"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-md"
          onPress={onOpen}
        >
          {selectedDate.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </Button>
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="text-gray-600"
          onPress={() => {
            const newDate = selectedDate.add({ months: 1 });
            setSelectedDate(newDate);
          }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Layout - 2x2 grid on left, stacked sections on right */}
      <div className="flex flex-row gap-6">
        {/* Left side - 2x2 Metrics Grid */}
        <div className="flex-2">
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

        {/* Right side - Stacked sections */}
        <div className="flex-1 space-y-6">
          {/* Agenda Section */}
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

          {/* To do Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                To do
              </h3>
              <Button
                isIconOnly
                size="sm"
                className="bg-black dark:bg-white text-white dark:text-black"
                onPress={onAddTodoModalOpen}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {todoItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.mission}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.deadline}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>

      {/* Calendar Modal */}
      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Sélectionner une date
          </ModalHeader>
          <ModalBody>
            <Calendar
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                onClose();
              }}
              showMonthAndYearPickers={false}
              className="w-full"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal d'ajout de tâche ToDo */}
      <Modal isOpen={isAddTodoModalOpen} onClose={onAddTodoModalClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Ajouter une nouvelle tâche
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Mission"
                placeholder="Titre de la tâche"
                value={newTodo.mission}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodo(prev => ({ ...prev, mission: e.target.value }))}
                isRequired
              />
              <Input
                label="Deadline"
                type="date"
                value={newTodo.deadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodo(prev => ({ ...prev, deadline: e.target.value }))}
              />
              <Select
                label="Statut"
                selectedKeys={[newTodo.status]}
                onSelectionChange={(keys: any) => setNewTodo(prev => ({ ...prev, status: Array.from(keys)[0] as 'En cours' | 'En retard' | 'Terminé' }))}
              >
                <SelectItem key="En cours">En cours</SelectItem>
                <SelectItem key="En retard">En retard</SelectItem>
                <SelectItem key="Terminé">Terminé</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddTodoModalClose}>
              Annuler
            </Button>
            <Button
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              onPress={handleAddTodo}
            >
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}
