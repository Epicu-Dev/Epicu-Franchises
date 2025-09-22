"use client";

import { Button } from "@heroui/button";
import { 
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface AgendaDropdownProps {
  onTournageSelect: () => void;
  onRendezVousSelect: () => void;
  onPublicationSelect: () => void;
  onEvenementSelect?: () => void;
  isGoogleConnected?: boolean;
  canAddEvents?: boolean;
}

export function AgendaDropdown({
  onTournageSelect,
  onRendezVousSelect,
  onPublicationSelect,
  onEvenementSelect,
  isGoogleConnected = false,
  canAddEvents = false,
}: AgendaDropdownProps) {
  const router = useRouter();

  const handleAction = (key: React.Key) => {
    switch (key) {
      case "tournage":
        onTournageSelect();
        break;
      case "rendez-vous":
        onRendezVousSelect();
        break;
      case "publication":
        onPublicationSelect();
        break;
      case "evenement":
        onEvenementSelect?.();
        break;
    }
  };

  const handleButtonClick = () => {
    if (!isGoogleConnected) {
      router.push('/agenda');
      return;
    }
  };

  // Si Google Calendar n'est pas connecté, afficher un bouton simple qui redirige
  if (!isGoogleConnected) {
    return (
      <Button
        isIconOnly
        color='primary'
        size="sm"
        onPress={handleButtonClick}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
    );
  }

  // Si Google Calendar est connecté, afficher le dropdown normal
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          color='primary'
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Actions d'agenda"
        onAction={handleAction}
      >
        <DropdownItem key="tournage">
          Tournage
        </DropdownItem>
        <DropdownItem key="rendez-vous">
          Rendez-vous
        </DropdownItem>
        <DropdownItem key="publication">
          Publication
        </DropdownItem>
        {canAddEvents && onEvenementSelect ? (
          <DropdownItem key="evenement">
            Événement
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
}
