'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/spinner';

interface Event {
  id: string;
  title: string;
  type: 'rendez-vous' | 'tournage' | 'publication' | 'evenement';
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  category: 'siege' | 'franchises' | 'prestataires';
}

interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'tout' | 'semaine' | 'mois'>('tout');
  const [selectedCategory, setSelectedCategory] = useState<string>('tout');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'rendez-vous' as Event['type'],
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    category: 'siege' as Event['category']
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        month: (currentDate.getMonth() + 1).toString(),
        year: currentDate.getFullYear().toString(),
        view,
        category: selectedCategory
      });

      const response = await fetch(`/api/agenda?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des événements');
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view, selectedCategory]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleAddEvent = async () => {
    try {
      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de l\'événement');
      }

      setNewEvent({
        title: '',
        type: 'rendez-vous',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        category: 'siege'
      });
      setIsAddModalOpen(false);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'rendez-vous':
        return 'primary';
      case 'tournage':
        return 'secondary';
      case 'publication':
        return 'success';
      case 'evenement':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEventTypeLabel = (type: Event['type']) => {
    switch (type) {
      case 'rendez-vous':
        return 'Rendez-vous';
      case 'tournage':
        return 'Tournage';
      case 'publication':
        return 'Publication';
      case 'evenement':
        return 'Événement';
      default:
        return type;
    }
  };

  const formatMonthYear = (date: Date) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length < 42) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      days.push({
        date: currentDate.toISOString().split('T')[0],
        dayNumber: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        events: dayEvents
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const renderCalendarView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
      <div className="w-full">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 p-2 border border-gray-200 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${day.isToday ? 'ring-2 ring-red-500' : ''}`}
            >
              <div className={`text-sm font-medium ${
                day.isToday ? 'text-red-600' : 
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.dayNumber}
              </div>
              
              <div className="mt-1 space-y-1">
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${
                      event.type === 'rendez-vous' ? 'bg-blue-100 text-blue-800' :
                      event.type === 'tournage' ? 'bg-pink-100 text-pink-800' :
                      event.type === 'publication' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{day.events.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const today = new Date();
    const currentTime = today.getHours() + today.getMinutes() / 60;
    
    return (
      <div className="w-full">
        <div className="space-y-4">
          {events
            .filter(event => {
              if (selectedCategory !== 'tout') {
                return event.category === selectedCategory;
              }
              return true;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(event => {
              const eventDate = new Date(event.date);
              const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long'
              });
              
              return (
                <div key={event.id} className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
                  <div className="flex-shrink-0 w-20 text-sm text-gray-600">
                    {formattedDate}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Chip
                        color={getEventTypeColor(event.type)}
                        size="sm"
                        variant="flat"
                      >
                        {getEventTypeLabel(event.type)}
                      </Chip>
                      <span className="font-medium">{event.title}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1">
                      {event.startTime} - {event.endTime}
                      {event.location && ` • ${event.location}`}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" className="text-black dark:text-white" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Erreur: {error}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardBody className="p-6">
          {/* En-tête avec navigation et boutons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  isIconOnly
                  variant="light"
                  onPress={handlePreviousMonth}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold">
                  {formatMonthYear(currentDate)}
                </span>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={handleNextMonth}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setSelectedEventType('rendez-vous');
                  setIsAddModalOpen(true);
                }}
              >
                Créer un rendez-vous
              </Button>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setSelectedEventType('tournage');
                  setIsAddModalOpen(true);
                }}
              >
                Ajouter un tournage
              </Button>
              <Button
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={() => {
                  setSelectedEventType('publication');
                  setIsAddModalOpen(true);
                }}
              >
                Ajouter une publication
              </Button>
            </div>
          </div>

          {/* Filtres et vues */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Select
                placeholder="Catégorie"
                className="w-48"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              >
                <SelectItem key="tout">Tout</SelectItem>
                <SelectItem key="siege">Siège</SelectItem>
                <SelectItem key="franchises">Franchisés</SelectItem>
                <SelectItem key="prestataires">Prestataires</SelectItem>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={view === 'tout' ? 'solid' : 'light'}
                color={view === 'tout' ? 'primary' : 'default'}
                size="sm"
                onPress={() => setView('tout')}
              >
                Tout
              </Button>
              <Button
                variant={view === 'semaine' ? 'solid' : 'light'}
                color={view === 'semaine' ? 'primary' : 'default'}
                size="sm"
                onPress={() => setView('semaine')}
              >
                Semaine
              </Button>
              <Button
                variant={view === 'mois' ? 'solid' : 'light'}
                color={view === 'mois' ? 'primary' : 'default'}
                size="sm"
                onPress={() => setView('mois')}
              >
                Mois
              </Button>
              <Button
                isIconOnly
                variant="light"
                size="sm"
              >
                <Bars3Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu du calendrier */}
          <div className="mt-6">
            {view === 'mois' ? renderCalendarView() : renderTimelineView()}
          </div>
        </CardBody>
      </Card>

      {/* Modal d'ajout d'événement */}
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ModalContent>
          <ModalHeader>Ajouter un événement</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titre"
                placeholder="Titre de l'événement"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                isRequired
              />
              
              <Select
                label="Type d'événement"
                selectedKeys={[newEvent.type]}
                onSelectionChange={(keys) => setNewEvent(prev => ({ ...prev, type: Array.from(keys)[0] as Event['type'] }))}
              >
                <SelectItem key="rendez-vous">Rendez-vous</SelectItem>
                <SelectItem key="tournage">Tournage</SelectItem>
                <SelectItem key="publication">Publication</SelectItem>
                <SelectItem key="evenement">Événement</SelectItem>
              </Select>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  isRequired
                />
                <Select
                  label="Catégorie"
                  selectedKeys={[newEvent.category]}
                  onSelectionChange={(keys) => setNewEvent(prev => ({ ...prev, category: Array.from(keys)[0] as Event['category'] }))}
                >
                  <SelectItem key="siege">Siège</SelectItem>
                  <SelectItem key="franchises">Franchisés</SelectItem>
                  <SelectItem key="prestataires">Prestataires</SelectItem>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Heure de début"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  isRequired
                />
                <Input
                  label="Heure de fin"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  isRequired
                />
              </div>
              
              <Input
                label="Lieu"
                placeholder="Lieu de l'événement"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              />
              
              <Input
                label="Description"
                placeholder="Description de l'événement"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" onPress={handleAddEvent}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 