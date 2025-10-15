import React from 'react';
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { AgendaDropdown } from "./agenda-dropdown";
import { AgendaBadge } from "./badges";

interface AgendaEvent {
  clientName: string;
  date: string;
  type: string;
}

interface AgendaSectionProps {
  events: AgendaEvent[];
  loading?: boolean;
  onPublicationSelect: () => void;
  onRendezVousSelect: () => void;
  onTournageSelect: () => void;
  onEvenementSelect?: () => void;
  className?: string;
  isGoogleConnected?: boolean;
  canAddEvents?: boolean;
  onSeeMore?: () => void;
  showSeeMoreButton?: boolean;
}

export const AgendaSection: React.FC<AgendaSectionProps> = ({
  events,
  loading = false,
  onPublicationSelect,
  onRendezVousSelect,
  onTournageSelect,
  onEvenementSelect,
  className = "",
  isGoogleConnected = false,
  canAddEvents = false,
  onSeeMore,
  showSeeMoreButton = false
}) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-custom dark:shadow-custom-dark p-4 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Agenda
        </h3>
        <AgendaDropdown
          onPublicationSelect={onPublicationSelect}
          onRendezVousSelect={onRendezVousSelect}
          onTournageSelect={onTournageSelect}
          onEvenementSelect={onEvenementSelect}
          isGoogleConnected={isGoogleConnected}
          canAddEvents={canAddEvents}
        />
      </div>
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500"><Spinner /></div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Pas de résultat</div>
          </div>
        ) : (
          <>
            {events.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-4 border-b border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-ligth text-primary">
                    {event.clientName}
                  </p>
                  <p className="text-xs text-primary-light">
                    {event.date}
                  </p>
                </div>
                <AgendaBadge type={event.type} />
              </div>
            ))}
            {showSeeMoreButton && onSeeMore && (
              <div className="flex justify-center pt-2">
                <Button
                  size="sm"
                  variant="light"
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onPress={onSeeMore}
                >
                  Voir plus
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
