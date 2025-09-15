"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Calendar } from "@heroui/calendar";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/modal";
import { Divider } from "@heroui/divider";
import {
    CalendarIcon,
    ClockIcon,
    SparklesIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { CalendarDate, today, getLocalTimeZone, startOfMonth, endOfMonth, startOfYear, endOfYear } from "@internationalized/date";

export interface PeriodSelection {
    type: "month" | "year" | "custom" | "since_creation";
    startDate?: CalendarDate;
    endDate?: CalendarDate;
    label: string;
}

interface PeriodSelectorProps {
    selectedPeriod: PeriodSelection;
    onPeriodChange: (period: PeriodSelection) => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function PeriodSelector({
    selectedPeriod,
    onPeriodChange,
    isOpen,
    onOpenChange,
}: PeriodSelectorProps) {
    const [customMonth, setCustomMonth] = useState<CalendarDate | null>(null);
    const [isCustomMonthOpen, setIsCustomMonthOpen] = useState(false);

    const todayDate = today(getLocalTimeZone());
    const currentMonth = startOfMonth(todayDate);
    const currentMonthEnd = endOfMonth(todayDate);
    const currentYear = startOfYear(todayDate);
    const currentYearEnd = endOfYear(todayDate);

    const predefinedPeriods: PeriodSelection[] = [
        {
            type: "month",
            startDate: currentMonth,
            endDate: currentMonthEnd,
            label: "Ce mois-ci",
        },
        {
            type: "year",
            startDate: currentYear,
            endDate: currentYearEnd,
            label: "Cette année",
        },
        {
            type: "since_creation",
            startDate: new CalendarDate(2024, 1, 1), // Date de création approximative
            endDate: todayDate,
            label: "Depuis la création",
        },
    ];

    const handlePeriodSelect = (period: PeriodSelection) => {
        onPeriodChange(period);
        onOpenChange(false);
    };

    const handleCustomMonthSelect = () => {
        if (customMonth) {
            const monthStart = startOfMonth(customMonth);
            const monthEnd = endOfMonth(customMonth);
            const monthName = customMonth.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            const customPeriod: PeriodSelection = {
                type: "custom",
                startDate: monthStart,
                endDate: monthEnd,
                label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            };

            onPeriodChange(customPeriod);

            setIsCustomMonthOpen(false);
            onOpenChange(false);
        }
    };

    const getPeriodIcon = (type: string) => {
        switch (type) {
            case "month":
                return <CalendarIcon className="h-5 w-5" />;
            case "year":
                return <CalendarDaysIcon className="h-5 w-5" />;
            case "since_creation":
                return <SparklesIcon className="h-5 w-5" />;
            default:
                return <ClockIcon className="h-5 w-5" />;
        }
    };

    const getPeriodDescription = (period: PeriodSelection) => {
        switch (period.type) {
            case "month":
                return "Données du mois en cours";
            case "year":
                return "Données de l'année en cours";
            case "since_creation":
                return "Toutes les données depuis le début";
        case "custom":
            return `Mois personnalisé`;
        default:
            return "";
    }
    };

    return (
        <>
            {/* Modal principal de sélection de période */}
            <Modal isOpen={isOpen} placement="center" size="2xl" onOpenChange={onOpenChange}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 justify-center items-center text-center w-full">
                        <span>Sélectionner une période</span>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="space-y-4">
                            {/* Périodes prédéfinies */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Périodes rapides</h3>
                                <div className="grid gap-2">
                                     {predefinedPeriods.map((period, index) => (
                                         <Button
                                             key={index}
                                             className={`justify-start h-auto p-4 ${selectedPeriod.type === period.type &&
                                                     selectedPeriod.startDate?.toString() === period.startDate?.toString()
                                                     ? "bg-custom-blue-select/10 "
                                                     : "hover:bg-gray-50"
                                                 }`}
                                             startContent={
                                                 <div className={`p-2 rounded-lg ${selectedPeriod.type === period.type &&
                                                         selectedPeriod.startDate?.toString() === period.startDate?.toString()
                                                         ? "bg-custom-blue-select/20"
                                                         : "bg-gray-100"
                                                     }`}>
                                                     {getPeriodIcon(period.type)}
                                                 </div>
                                             }
                                             variant="light"
                                             onPress={() => handlePeriodSelect(period)}
                                         >
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium text-left">{period.label}</span>
                                                <span className="text-xs text-gray-500 text-left">
                                                    {getPeriodDescription(period)}
                                                </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Divider />

                            {/* Sélection personnalisée */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Mois personnalisé</h3>
                                <Button
                                    className="justify-start h-auto p-4 w-full hover:bg-gray-50"
                                    startContent={
                                        <div className="p-2 rounded-lg bg-gray-100">
                                            <ClockIcon className="h-5 w-5" />
                                        </div>
                                    }
                                    variant="light"
                                    onPress={() => setIsCustomMonthOpen(true)}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-left">Choisir un mois spécifique</span>
                                        <span className="text-xs text-gray-500 text-left">
                                            Sélectionner un mois et une année
                                        </span>
                                    </div>
                                    <ChevronRightIcon className="h-4 w-4 ml-auto text-gray-400" />
                                </Button>
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modal de sélection de mois personnalisé */}
            <Modal
                isOpen={isCustomMonthOpen}
                placement="center"
                size="lg"
                onOpenChange={setIsCustomMonthOpen}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 justify-center items-center text-center w-full">
                        <span>Mois personnalisé</span>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Sélectionner un mois</h3>
                                <Calendar
                                    className="w-full"
                                    showMonthAndYearPickers={true}
                                    value={customMonth}
                                    onChange={setCustomMonth}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="flex justify-between">
                        <Button
                            variant="bordered"
                            color="primary"
                            className="flex-1 border-1"
                            onPress={() => setIsCustomMonthOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1"
                            color="primary"
                            isDisabled={!customMonth}
                            onPress={handleCustomMonthSelect}
                        >
                            Appliquer le mois
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
