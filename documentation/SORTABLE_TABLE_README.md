# Composants de Tableau Triable Réutilisables

Ce document explique comment utiliser les composants de tableau triable réutilisables dans votre application Epicu-Franchises.

## Composants Disponibles

### 1. `SortableColumnHeader`

Un composant d'en-tête de colonne cliquable qui affiche l'état de tri et gère les clics de tri.

**Props :**
- `field`: Le nom du champ à trier
- `label`: Le texte affiché dans l'en-tête
- `sortField`: Le champ actuellement trié (depuis le hook)
- `sortDirection`: La direction du tri ("asc" ou "desc")
- `onSort`: Fonction appelée lors du clic sur l'en-tête
- `className`: Classes CSS optionnelles

### 2. `useSortableTable` Hook

Un hook personnalisé qui gère toute la logique de tri d'un tableau.

**Retourne :**
- `sortField`: Le champ actuellement trié
- `sortDirection`: La direction du tri
- `handleSort`: Fonction pour gérer le tri
- `sortedData`: Les données triées
- `resetSort`: Fonction pour réinitialiser le tri

## Utilisation de Base

### Étape 1 : Importer les composants

```tsx
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { useSortableTable } from "@/hooks/use-sortable-table";
```

### Étape 2 : Utiliser le hook

```tsx
const { sortField, sortDirection, handleSort, sortedData } = useSortableTable(yourData);
```

### Étape 3 : Remplacer les en-têtes de colonnes

```tsx
<TableHeader>
  <TableColumn>
    <SortableColumnHeader
      field="name"
      label="Nom"
      sortField={sortField}
      sortDirection={sortDirection}
      onSort={handleSort}
    />
  </TableColumn>
</TableHeader>
```

### Étape 4 : Utiliser les données triées

```tsx
<TableBody>
  {sortedData.map((row) => (
    <TableRow key={row.id}>
      <TableCell>{row.name}</TableCell>
    </TableRow>
  ))}
</TableBody>
```

## Exemple Complet

```tsx
"use client";

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { SortableColumnHeader } from "@/components/sortable-column-header";
import { useSortableTable } from "@/hooks/use-sortable-table";

const data = [
  { id: 1, name: "Alice", age: 28 },
  { id: 2, name: "Bob", age: 32 },
];

export default function MyTable() {
  const { sortField, sortDirection, handleSort, sortedData } = useSortableTable(data);

  return (
    <Table>
      <TableHeader>
        <TableColumn>
          <SortableColumnHeader
            field="id"
            label="ID"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </TableColumn>
        <TableColumn>
          <SortableColumnHeader
            field="name"
            label="Nom"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </TableColumn>
      </TableHeader>
      <TableBody>
        {sortedData.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Fonctionnalités

- **Tri automatique** : Cliquez sur un en-tête pour trier par ce champ
- **Changement de direction** : Cliquez à nouveau pour inverser l'ordre
- **Tri intelligent** : Gère automatiquement les différents types de données (string, number, Date)
- **Performance** : Utilise `useMemo` pour éviter les re-calculs inutiles
- **TypeScript** : Entièrement typé pour une meilleure expérience de développement

## Personnalisation

### Changer l'icône de tri

Modifiez le composant `SortableColumnHeader` pour utiliser vos propres icônes :

```tsx
// Dans sortable-column-header.tsx
import { YourUpIcon, YourDownIcon, YourNeutralIcon } from "your-icon-library";
```

### Ajouter des fonctionnalités de tri personnalisées

Le hook `useSortableTable` peut être étendu pour ajouter des fonctionnalités comme :
- Tri multi-colonnes
- Tri personnalisé par type de données
- Persistance du tri dans le localStorage

## Migration depuis l'ancien système

Si vous avez déjà des tableaux avec tri manuel, voici comment migrer :

1. **Remplacer** les états de tri manuels par le hook
2. **Remplacer** les fonctions `handleSort` et `getSortIcon` par le hook
3. **Remplacer** les boutons d'en-tête par `SortableColumnHeader`
4. **Utiliser** `sortedData` au lieu des données originales

## Support

Pour toute question ou problème avec ces composants, consultez :
- Le fichier d'exemple : `app/test/sortable-table-example.tsx`
- Les types TypeScript dans les fichiers de composants
- Ce fichier README
