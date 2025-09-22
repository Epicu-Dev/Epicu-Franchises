"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { SelectItem } from "@heroui/select";
import { StyledSelect } from "@/components/styled-select";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";

interface DateFilterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tempSelectedMonth: number;
  tempSelectedYear: number;
  tempIsSinceCreationSelected: boolean;
  onTempMonthChange: (month: number) => void;
  onTempYearChange: (year: number) => void;
  onTempSinceCreationChange: (selected: boolean) => void;
  onTempDateChange: (date: CalendarDate) => void;
  onApply: () => void;
}

export function DateFilterModal({
  isOpen,
  onOpenChange,
  tempSelectedMonth,
  tempSelectedYear,
  tempIsSinceCreationSelected,
  onTempMonthChange,
  onTempYearChange,
  onTempSinceCreationChange,
  onTempDateChange,
  onApply,
}: DateFilterModalProps) {
  const handleMonthChange = (keys: any) => {
    const month = Number(Array.from(keys)[0]);
    if (month) {
      onTempMonthChange(month);
      onTempSinceCreationChange(false); // Désélectionner "Depuis la création" quand on change le mois
      const newDate = new CalendarDate(tempSelectedYear, month, 1);
      onTempDateChange(newDate);
    }
  };

  const handleYearChange = (keys: any) => {
    const year = Number(Array.from(keys)[0]);
    if (year) {
      onTempYearChange(year);
      onTempSinceCreationChange(false); // Désélectionner "Depuis la création" quand on change l'année
      const newDate = new CalendarDate(year, tempSelectedMonth, 1);
      onTempDateChange(newDate);
    }
  };

  const handleSinceCreationClick = () => {
    const todayDate = today(getLocalTimeZone());
    const creationDate = new CalendarDate(2024, 1, 1);
    onTempSinceCreationChange(true);
    onTempMonthChange(creationDate.month);
    onTempYearChange(creationDate.year);
    onTempDateChange(creationDate);
  };

  return (
    <Modal isOpen={isOpen} placement="center" size="lg" className="pb-20 md:pb-0" onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader className="flex justify-center">
          Sélectionner une période
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Sélection Mois/Année */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Sélectionner un mois et une année</h3>
              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  label="Mois"
                  placeholder="Choisir un mois"
                  selectedKeys={tempSelectedMonth ? [String(tempSelectedMonth)] : []}
                  onSelectionChange={handleMonthChange}
                >
                  <SelectItem key="1">Janvier</SelectItem>
                  <SelectItem key="2">Février</SelectItem>
                  <SelectItem key="3">Mars</SelectItem>
                  <SelectItem key="4">Avril</SelectItem>
                  <SelectItem key="5">Mai</SelectItem>
                  <SelectItem key="6">Juin</SelectItem>
                  <SelectItem key="7">Juillet</SelectItem>
                  <SelectItem key="8">Août</SelectItem>
                  <SelectItem key="9">Septembre</SelectItem>
                  <SelectItem key="10">Octobre</SelectItem>
                  <SelectItem key="11">Novembre</SelectItem>
                  <SelectItem key="12">Décembre</SelectItem>
                </StyledSelect>

                <StyledSelect
                  label="Année"
                  placeholder="Choisir une année"
                  selectedKeys={tempSelectedYear ? [String(tempSelectedYear)] : []}
                  onSelectionChange={handleYearChange}
                >
                  {Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => {
                    const year = 2023 + i;
                    return (
                      <SelectItem key={String(year)}>{String(year)}</SelectItem>
                    );
                  })}
                </StyledSelect>
              </div>
            </div>

            {/* Bouton "Depuis la création" */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Période spéciale</h3>
              <Button
                className={
                  tempIsSinceCreationSelected
                    ? "w-full justify-start h-auto p-4 bg-custom-blue-select/14 text-custom-blue-select font-light"
                    : "w-full justify-start h-auto p-4 bg-page-bg"
                }
                onPress={handleSinceCreationClick}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-left">Depuis la création</span>
                  <span className="text-xs text-gray-500 text-left">
                    Toutes les données depuis le début
                  </span>
                </div>
              </Button>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="bordered"
                className="flex-1"
                onPress={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                color="primary"
                onPress={onApply}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
