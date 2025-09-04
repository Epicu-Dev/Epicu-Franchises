"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { GoogleCalendarSyncStatus, GoogleCalendarEvent } from "@/types/googleCalendar";

interface GoogleCalendarSyncProps {
  onEventsFetched?: (events: GoogleCalendarEvent[]) => void;
  onEventCreated?: (event: GoogleCalendarEvent) => void;
}

export function GoogleCalendarSync({ onEventsFetched, onEventCreated }: GoogleCalendarSyncProps) {
  const [syncStatus, setSyncStatus] = useState<GoogleCalendarSyncStatus>({
    isConnected: false,
    calendars: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Vérifier le statut de connexion au chargement
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Synchroniser automatiquement les événements quand connecté
  useEffect(() => {
    if (syncStatus.isConnected && !syncStatus.lastSync) {
      // Synchroniser automatiquement si connecté mais jamais synchronisé
      syncEvents();
    } else if (syncStatus.isConnected && syncStatus.lastSync) {
      // Vérifier si la dernière synchronisation date de plus de 5 minutes
      const lastSyncTime = new Date(syncStatus.lastSync).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (lastSyncTime < fiveMinutesAgo) {
        // Synchroniser automatiquement si la dernière sync date de plus de 5 minutes
        syncEvents();
      }
    }
  }, [syncStatus.isConnected, syncStatus.lastSync]);

  // Synchronisation automatique périodique toutes les 5 minutes
  useEffect(() => {
    if (!syncStatus.isConnected) return;

    const interval = setInterval(() => {
      syncEvents();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [syncStatus.isConnected]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-calendar/status');
      if (response.ok) {
        const status = await response.json();
        setSyncStatus(status);
        
        // Si déjà connecté, synchroniser automatiquement les événements
        if (status.isConnected) {
          // Attendre un peu que le state soit mis à jour
          setTimeout(() => {
            syncEvents();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
    }
  };

  const connectToGoogle = async () => {
    setIsConnecting(true);
    try {
      // Rediriger vers l'authentification Google
      const response = await fetch('/api/google-calendar/auth');
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setSyncStatus(prev => ({ ...prev, error: 'Erreur de connexion' }));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromGoogle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST'
      });
      if (response.ok) {
        setSyncStatus({
          isConnected: false,
          calendars: []
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google-calendar/sync');
      if (response.ok) {
        const { events } = await response.json();
        onEventsFetched?.(events);
        setSyncStatus(prev => ({ 
          ...prev, 
          lastSync: new Date() 
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        error: 'Erreur de synchronisation' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: Partial<GoogleCalendarEvent>) => {
    try {
      const response = await fetch('/api/google-calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        const createdEvent = await response.json();
        onEventCreated?.(createdEvent);
        return createdEvent;
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  };

  return (
    <Card className="w-full mb-6" shadow="none">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-semibold">Synchronisation Google Calendar</h3>
              <p className="text-sm text-gray-600">
                {syncStatus.isConnected 
                  ? `Connecté • Dernière sync: ${syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString('fr-FR') : 'Jamais'}`
                  : 'Non connecté'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {syncStatus.isConnected ? (
              <>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<ArrowPathIcon className="h-4 w-4" />}
                  onPress={syncEvents}
                  isLoading={isLoading}
                >
                  Synchroniser
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={disconnectFromGoogle}
                  isLoading={isLoading}
                >
                  Déconnecter
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                color="primary"
                startContent={<CalendarIcon className="h-4 w-4" />}
                onPress={connectToGoogle}
                isLoading={isConnecting}
              >
                Connecter Google Calendar
              </Button>
            )}
          </div>
        </div>

        {syncStatus.error && (
          <div className="mt-3 flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">{syncStatus.error}</span>
          </div>
        )}

        {syncStatus.calendars && syncStatus.calendars.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Calendriers synchronisés:</p>
            <div className="flex flex-wrap gap-2">
              {syncStatus.calendars.map((calendar) => (
                <span
                  key={calendar.id}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    calendar.primary 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {calendar.summary}
                  {calendar.primary && (
                    <CheckCircleIcon className="h-3 w-3 ml-1" />
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
