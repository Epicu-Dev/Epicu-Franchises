"use client";

import { Button } from "@heroui/button";
import { CalendarIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface PeriodSelectorButtonsProps {
  selectedPeriodType: "month" | "year";
  isCustomDateSelected: boolean;
  isSinceCreationSelected: boolean;
  selectedMonth?: number;
  selectedYear?: number;
  onDateModalOpen: () => void;
  onCurrentMonthSelect: () => void;
  onCurrentYearSelect: () => void;
}

export function PeriodSelectorButtons({
  selectedPeriodType,
  isCustomDateSelected,
  isSinceCreationSelected,
  selectedMonth,
  selectedYear,
  onDateModalOpen,
  onCurrentMonthSelect,
  onCurrentYearSelect,
}: PeriodSelectorButtonsProps) {
  // Fonction pour formater le nom du mois
  const getMonthName = (month: number) => {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return months[month - 1] || "";
  };

  // Fonction pour obtenir le texte à afficher
  const getDisplayText = () => {
    if (isSinceCreationSelected) {
      return "Depuis création";
    }
    if (isCustomDateSelected && selectedMonth && selectedYear) {
      return `${getMonthName(selectedMonth)} ${selectedYear}`;
    }
    return null;
  };

  const displayText = getDisplayText();
  return (
    <div className="flex items-center gap-4">
      <Button
        className={
          isCustomDateSelected || isSinceCreationSelected
            ? "bg-custom-blue-select/14 text-custom-blue-select border-0 font-light px-3"
            : "text-gray-600 hover:bg-gray-100 bg-page-bg"
        }
        size="sm"
        onPress={onDateModalOpen}
      >
        {displayText ? (
          <div className="flex items-center gap-1">
            <span >{displayText}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        ) : (
          <CalendarIcon className="h-5 w-5" />
        )}
      </Button>
      <div className="flex rounded-md overflow-hidden flex-shrink-0">
        <Button
          className={
            selectedPeriodType === "month" && !isCustomDateSelected && !isSinceCreationSelected
              ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none font-light"
              : "bg-page-bg border-0 rounded-none font-light"
          }
          size="sm"
          variant="solid"
          onPress={onCurrentMonthSelect}
        >
          Ce mois-ci
        </Button>
        <Button
          className={
            selectedPeriodType === "year" && !isCustomDateSelected && !isSinceCreationSelected
              ? "bg-custom-blue-select/14 text-custom-blue-select border-0 rounded-none font-light"
              : "bg-page-bg border-0 rounded-none font-light"
          }
          size="sm"
          variant="solid"
          onPress={onCurrentYearSelect}
        >
          Cette année
        </Button>
      </div>
    </div>
  );
}
