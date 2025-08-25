"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { SortableColumnHeader } from "@/components/sortable-column-header";
import { useSortableTable } from "@/hooks/use-sortable-table";

// Exemple de données pour démontrer l'utilisation
const sampleData = [
  { id: 1, name: "Alice Johnson", age: 28, department: "Marketing", salary: 45000 },
  { id: 2, name: "Bob Smith", age: 32, department: "Engineering", salary: 65000 },
  { id: 3, name: "Carol Davis", age: 25, department: "Sales", salary: 40000 },
  { id: 4, name: "David Wilson", age: 35, department: "Engineering", salary: 70000 },
  { id: 5, name: "Eva Brown", age: 29, department: "Marketing", salary: 48000 },
];

export default function SortableTableExample() {
  // Utiliser le hook de tri réutilisable
  const { sortField, sortDirection, handleSort, sortedData } = useSortableTable(sampleData);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Exemple de Tableau Triable</h1>
      
      <Card className="w-full" shadow="none">
        <CardBody className="p-0">
          <Table aria-label="Exemple de tableau triable">
            <TableHeader>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="id"
                  label="ID"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="name"
                  label="Nom"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="age"
                  label="Âge"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="department"
                  label="Département"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
              <TableColumn className="font-light text-sm">
                <SortableColumnHeader
                  field="salary"
                  label="Salaire"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableColumn>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.id} className="border-t border-gray-100 dark:border-gray-700">
                  <TableCell className="font-light text-sm py-3">{row.id}</TableCell>
                  <TableCell className="font-light text-sm">{row.name}</TableCell>
                  <TableCell className="font-light text-sm">{row.age}</TableCell>
                  <TableCell className="font-light text-sm">{row.department}</TableCell>
                  <TableCell className="font-light text-sm">{row.salary.toLocaleString()}€</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Comment utiliser :</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Importer le composant : <code>import {`{ SortableColumnHeader }`} from &ldquo;@/components/sortable-column-header&rdquo;</code></li>
          <li>Importer le hook : <code>import {`{ useSortableTable }`} from &ldquo;@/hooks/use-sortable-table&rdquo;</code></li>
          <li>Utiliser le hook : <code>const {`{ sortField, sortDirection, handleSort, sortedData }`} = useSortableTable(data)</code></li>
          <li>Remplacer les en-têtes de colonnes par <code>SortableColumnHeader</code></li>
          <li>Utiliser <code>sortedData</code> au lieu des données originales</li>
        </ol>
      </div>
    </div>
  );
}
