"use client";

import { Button } from "@heroui/button";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface PeriodSelectorButtonsProps {
  selectedPeriodType: "month" | "year";
  isCustomDateSelected: boolean;
  isSinceCreationSelected: boolean;
  onDateModalOpen: () => void;
  onCurrentMonthSelect: () => void;
  onCurrentYearSelect: () => void;
}

export function PeriodSelectorButtons({
  selectedPeriodType,
  isCustomDateSelected,
  isSinceCreationSelected,
  onDateModalOpen,
  onCurrentMonthSelect,
  onCurrentYearSelect,
}: PeriodSelectorButtonsProps) {
  return (
    <div className="flex items-center gap-4">
      <Button
        isIconOnly
        className={
          isCustomDateSelected || isSinceCreationSelected
            ? "bg-custom-blue-select/14 text-custom-blue-select border-0 font-light"
            : "text-gray-600 hover:bg-gray-100 bg-page-bg"
        }
        size="sm"
        onPress={onDateModalOpen}
      >
        <CalendarIcon className="h-5 w-5" />
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
