"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { 
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";
import { PlusIcon } from "@heroicons/react/24/outline";

interface AgendaDropdownProps {
  onTournageSelect: () => void;
  onRendezVousSelect: () => void;
  onPublicationSelect: () => void;
}

export function AgendaDropdown({
  onTournageSelect,
  onRendezVousSelect,
  onPublicationSelect,
}: AgendaDropdownProps) {
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
    }
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          className="bg-black dark:bg-white text-white dark:text-black"
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
      </DropdownMenu>
    </Dropdown>
  );
}
