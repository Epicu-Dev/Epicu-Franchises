import React from "react";
import { ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

export interface SortableColumnHeaderProps {
  field: any;
  label: string;
  sortField: any;
  sortDirection: "asc" | "desc";
  onSort: (field: any) => void;
  className?: string;
}

export const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
  className = "font-light text-sm"
}) => {
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      );
    }

    return sortDirection === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    );
  };

  return (
    <button
      className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left w-full"
      type="button"
      onClick={() => onSort(field)}
    >
      {label}
      {getSortIcon(field)}
    </button>
  );
};

export default SortableColumnHeader;
