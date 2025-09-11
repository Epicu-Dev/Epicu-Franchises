# Composants de Badges

Ce dossier contient des composants réutilisables pour afficher des badges de catégorie et de statut dans toute l'application.

## Composants disponibles

### 1. CategoryBadge
Badge pour afficher les catégories d'établissements (FOOD, SHOP, TRAVEL, FUN, BEAUTY).

```tsx
import { CategoryBadge } from '@/components/badges';

<CategoryBadge category="FOOD" />
```

**Props :**
- `category` (string) : La catégorie à afficher
- `className` (string, optionnel) : Classes CSS supplémentaires

### 2. StatusBadge
Badge pour afficher les statuts de paiement (En attente, Payée, En retard).

```tsx
import { StatusBadge } from '@/components/badges';

<StatusBadge status="En attente" />
```

**Props :**
- `status` (string) : Le statut à afficher
- `className` (string, optionnel) : Classes CSS supplémentaires

### 3. Badge
Badge générique avec plusieurs variantes.

```tsx
import { Badge } from '@/components/badges';

// Badge de catégorie
<Badge text="FOOD" variant="category" />

// Badge de statut
<Badge text="En attente" variant="status" />

// Badge personnalisé
<Badge text="Personnalisé" className="bg-blue-100 text-blue-800" />
```

**Props :**
- `text` (string) : Le texte à afficher
- `variant` ('category' | 'status' | 'custom') : Le style du badge
- `className` (string, optionnel) : Classes CSS supplémentaires
- `rounded` ('rounded' | 'rounded-full') : Le type d'arrondi

## Fonctions utilitaires

### getCategoryBadgeColor(category: string)
Retourne les classes CSS pour un badge de catégorie.

```tsx
import { getCategoryBadgeColor } from '@/components/badges';

const badgeClasses = getCategoryBadgeColor("FOOD");
// Retourne: "bg-orange-50 text-orange-700 border-orange-200"
```

### getStatusBadgeColor(status: string)
Retourne les classes CSS pour un badge de statut.

```tsx
import { getStatusBadgeColor } from '@/components/badges';

const badgeClasses = getStatusBadgeColor("En attente");
// Retourne: "bg-yellow-100 text-yellow-800"
```

## Utilisation dans les composants

### Avant (code dupliqué)
```tsx
// Dans chaque composant
const getCategoryBadgeColor = (category: string) => {
  switch (category) {
    case "FOOD":
      return "bg-orange-50 text-orange-700 border-orange-200";
    // ... autres cas
  }
};

<span className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryBadgeColor(category)}`}>
  {category}
</span>
```

### Après (composant réutilisable)
```tsx
import { CategoryBadge } from '@/components/badges';

<CategoryBadge category={category} />
```

## Avantages

1. **Réutilisabilité** : Un seul composant utilisé partout
2. **Maintenance** : Modification centralisée des styles
3. **Cohérence** : Apparence uniforme dans toute l'application
4. **TypeScript** : Support complet des types
5. **Flexibilité** : Possibilité d'ajouter des classes personnalisées

## Fichiers mis à jour

- ✅ `app/clients/page.tsx`
- ✅ `app/prospects/page.tsx`
- ✅ `app/studio/page.tsx`

## Migration

Pour migrer d'autres composants, remplacez :

1. Les fonctions `getCategoryBadgeColor` et `getStatusBadgeColor` par les composants
2. Les `<span>` avec classes dynamiques par `<CategoryBadge>` ou `<StatusBadge>`
3. Ajoutez l'import : `import { CategoryBadge, StatusBadge } from '@/components/badges';`
