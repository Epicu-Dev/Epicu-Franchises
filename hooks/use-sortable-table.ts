import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortableTableState<T> {
  sortField: keyof T | null;
  sortDirection: SortDirection;
}

export interface UseSortableTableReturn<T> extends SortableTableState<T> {
  handleSort: (field: keyof T) => void;
  sortedData: T[];
  resetSort: () => void;
}

export function useSortableTable<T>(
  data: T[],
  initialSortField?: keyof T,
  initialSortDirection: SortDirection = "asc"
): UseSortableTableReturn<T> {
  const [sortField, setSortField] = useState<keyof T | null>(initialSortField || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const resetSort = () => {
    setSortField(null);
    setSortDirection("asc");
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    handleSort,
    sortedData,
    resetSort,
  };
}

export default useSortableTable;
