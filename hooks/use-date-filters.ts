import { useState, useEffect } from "react";
import { CalendarDate, today, getLocalTimeZone, startOfMonth, endOfMonth, startOfYear, endOfYear } from "@internationalized/date";

export interface PeriodSelection {
  type: "month" | "year" | "since_creation" | "custom";
  startDate: CalendarDate;
  endDate: CalendarDate;
  label: string;
}

export function useDateFilters() {
  // États principaux
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(() =>
    today(getLocalTimeZone())
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today(getLocalTimeZone()).month);
  const [selectedYear, setSelectedYear] = useState<number>(() => today(getLocalTimeZone()).year);
  const [selectedPeriodType, setSelectedPeriodType] = useState<"month" | "year">("month");
  const [isCustomDateSelected, setIsCustomDateSelected] = useState(false);
  const [isSinceCreationSelected, setIsSinceCreationSelected] = useState(false);

  // États temporaires pour le modal
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number>(() => today(getLocalTimeZone()).month);
  const [tempSelectedYear, setTempSelectedYear] = useState<number>(() => today(getLocalTimeZone()).year);
  const [tempSelectedDate, setTempSelectedDate] = useState<CalendarDate>(() => today(getLocalTimeZone()));
  const [tempIsSinceCreationSelected, setTempIsSinceCreationSelected] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(() => {
    const todayDate = today(getLocalTimeZone());
    const currentMonth = startOfMonth(todayDate);
    const currentMonthEnd = endOfMonth(todayDate);

    return {
      type: "month",
      startDate: currentMonth,
      endDate: currentMonthEnd,
      label: "Ce mois-ci"
    };
  });

  // Effet pour s'assurer que selectedDate est toujours défini
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(today(getLocalTimeZone()));
    }
  }, [selectedDate]);

  // Effet pour synchroniser selectedMonth et selectedYear avec selectedDate
  useEffect(() => {
    if (selectedDate) {
      setSelectedMonth(selectedDate.month);
      setSelectedYear(selectedDate.year);
    }
  }, [selectedDate]);

  // Fonction pour synchroniser les états temporaires
  const syncTempStates = () => {
    if (selectedDate) {
      setTempSelectedMonth(selectedDate.month);
      setTempSelectedYear(selectedDate.year);
      setTempSelectedDate(selectedDate);
      setTempIsSinceCreationSelected(isSinceCreationSelected);
    }
  };

  // Fonction pour sélectionner le mois actuel
  const selectCurrentMonth = () => {
    setSelectedPeriodType("month");
    const todayDate = today(getLocalTimeZone());
    const currentMonth = startOfMonth(todayDate);
    const currentMonthEnd = endOfMonth(todayDate);
    setSelectedDate(todayDate);
    setIsCustomDateSelected(false);
    setIsSinceCreationSelected(false);
    setSelectedPeriod({
      type: "month",
      startDate: currentMonth,
      endDate: currentMonthEnd,
      label: "Ce mois-ci"
    });
  };

  // Fonction pour sélectionner l'année actuelle
  const selectCurrentYear = () => {
    setSelectedPeriodType("year");
    const todayDate = today(getLocalTimeZone());
    const currentYear = startOfYear(todayDate);
    const currentYearEnd = endOfYear(todayDate);
    setSelectedDate(todayDate);
    setIsCustomDateSelected(false);
    setIsSinceCreationSelected(false);
    setSelectedPeriod({
      type: "year",
      startDate: currentYear,
      endDate: currentYearEnd,
      label: "Cette année"
    });
  };

  // Fonction pour sélectionner "Depuis la création"
  const selectSinceCreation = () => {
    const todayDate = today(getLocalTimeZone());
    const creationDate = new CalendarDate(2024, 1, 1);
    setIsSinceCreationSelected(true);
    setIsCustomDateSelected(false);
    setSelectedPeriod({
      type: "since_creation",
      startDate: creationDate,
      endDate: todayDate,
      label: "Depuis la création"
    });
  };

  // Fonction pour appliquer une date personnalisée
  const applyCustomDate = () => {
    if (tempSelectedDate) {
      // Appliquer les valeurs temporaires aux états réels
      setSelectedMonth(tempSelectedMonth);
      setSelectedYear(tempSelectedYear);
      setSelectedDate(tempSelectedDate);

      if (tempIsSinceCreationSelected) {
        // Si "Depuis la création" est sélectionné, activer cette sélection et désélectionner la date personnalisée
        setIsSinceCreationSelected(true);
        setIsCustomDateSelected(false);
      } else {
        // Sinon, activer la sélection personnalisée et désélectionner "Depuis la création"
        setIsCustomDateSelected(true);
        setIsSinceCreationSelected(false);
      }

      // Mettre à jour la période selon le type sélectionné et la date choisie
      if (tempIsSinceCreationSelected) {
        // Appliquer la période "Depuis la création"
        const todayDate = today(getLocalTimeZone());
        const creationDate = new CalendarDate(2024, 1, 1);
        setSelectedPeriod({
          type: "since_creation",
          startDate: creationDate,
          endDate: todayDate,
          label: "Depuis la création"
        });
      } else if (selectedPeriodType === "year") {
        const yearStart = startOfYear(tempSelectedDate);
        const yearEnd = endOfYear(tempSelectedDate);
        const yearName = tempSelectedDate.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { year: 'numeric' });
        setSelectedPeriod({
          type: "year",
          startDate: yearStart,
          endDate: yearEnd,
          label: yearName
        });
      } else {
        const monthStart = startOfMonth(tempSelectedDate);
        const monthEnd = endOfMonth(tempSelectedDate);
        const monthName = tempSelectedDate.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric'
        });
        setSelectedPeriod({
          type: "month",
          startDate: monthStart,
          endDate: monthEnd,
          label: monthName.charAt(0).toUpperCase() + monthName.slice(1)
        });
      }
    }
  };

  // Fonction pour réinitialiser à la date actuelle
  const resetToCurrentDate = () => {
    const todayDate = today(getLocalTimeZone());
    setSelectedDate(todayDate);
    setSelectedMonth(todayDate.month);
    setSelectedYear(todayDate.year);
    setTempSelectedDate(todayDate);
    setTempSelectedMonth(todayDate.month);
    setTempSelectedYear(todayDate.year);
  };

  return {
    // États principaux
    selectedDate,
    selectedMonth,
    selectedYear,
    selectedPeriodType,
    selectedPeriod,
    isCustomDateSelected,
    isSinceCreationSelected,
    
    // États temporaires
    tempSelectedMonth,
    tempSelectedYear,
    tempSelectedDate,
    tempIsSinceCreationSelected,
    
    // Setters
    setSelectedDate,
    setSelectedMonth,
    setSelectedYear,
    setSelectedPeriodType,
    setSelectedPeriod,
    setIsCustomDateSelected,
    setIsSinceCreationSelected,
    setTempSelectedMonth,
    setTempSelectedYear,
    setTempSelectedDate,
    setTempIsSinceCreationSelected,
    
    // Fonctions
    selectCurrentMonth,
    selectCurrentYear,
    selectSinceCreation,
    applyCustomDate,
    resetToCurrentDate,
    syncTempStates,
  };
}
