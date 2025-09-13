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
        const { events, message } = await response.json();
        onEventsFetched?.(events);
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          message: message
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
    <div>
      {syncStatus.calendars && syncStatus.calendars.length > 0 && (
        <div className="flex items-center flex-col">
          <p className="text-sm text-gray-600 mb-2">Calendrier EPICU synchronisé:</p>
          <div className="flex flex-wrap gap-2">
            {syncStatus.calendars.filter(calendar =>
              calendar.summary?.toLowerCase().includes('epicu agenda')
            ).map((calendar) => (
              <span
                key={calendar.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                {calendar.summary}
                <CheckCircleIcon className="h-3 w-3 ml-1" />
              </span>
            ))}
          </div>
          {syncStatus.error && (
            <p className="text-xs text-red-500 mt-1">{syncStatus.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
