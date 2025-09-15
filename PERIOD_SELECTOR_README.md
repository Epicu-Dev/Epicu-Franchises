# Composant PeriodSelector

## Vue d'ensemble

Le composant `PeriodSelector` offre une interface utilisateur moderne et intuitive pour sélectionner des périodes dans l'application Epicu Franchises. Il remplace l'ancien modal calendrier simple par une expérience utilisateur riche avec des options prédéfinies et une sélection personnalisée.

## Fonctionnalités

### 🎯 Options prédéfinies
- **Ce mois-ci** : Sélection automatique du mois en cours
- **Cette année** : Sélection automatique de l'année en cours  
- **Depuis la création** : Période depuis le début de l'application (2024)

### 🎨 Sélection personnalisée
- **Mois personnalisé** : Sélection d'un mois et d'une année spécifiques
- **Interface simplifiée** : Un seul calendrier avec sélecteur de mois/année
- **Formatage automatique** : Affichage du mois en français (ex: "Janvier 2024")

### 🎨 Design moderne
- **Interface cohérente** : Suit le design system de l'application
- **Icônes contextuelles** : Chaque option a une icône distinctive
- **États visuels** : Mise en évidence de la sélection active
- **Responsive** : S'adapte aux différentes tailles d'écran

## Utilisation

### Import du composant

```typescript
import { PeriodSelector, PeriodSelection } from "@/components/period-selector";
```

### Types

```typescript
interface PeriodSelection {
  type: "month" | "year" | "custom" | "since_creation";
  startDate?: CalendarDate;
  endDate?: CalendarDate;
  label: string;
}
```

### Exemple d'utilisation

```typescript
import { useState } from "react";
import { useDisclosure } from "@heroui/modal";
import { PeriodSelector, PeriodSelection } from "@/components/period-selector";
import { startOfMonth, endOfMonth, today, getLocalTimeZone } from "@internationalized/date";

function MyComponent() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
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

  return (
    <>
      <Button onPress={onOpen}>
        {selectedPeriod.label}
      </Button>
      
      <PeriodSelector
        isOpen={isOpen}
        selectedPeriod={selectedPeriod}
        onOpenChange={onOpenChange}
        onPeriodChange={setSelectedPeriod}
      />
    </>
  );
}
```

## Intégration dans l'admin

Le composant est déjà intégré dans la page admin (`app/home-admin/page.tsx`) et remplace l'ancien système de boutons "Ce mois-ci" / "Cette année".

### Changements apportés

1. **Remplacement des boutons** : Les anciens boutons ont été remplacés par un bouton unique avec dropdown
2. **Gestion des périodes** : Utilisation de l'objet `PeriodSelection` pour une gestion plus robuste
3. **API integration** : Les dates sont automatiquement converties pour l'API existante

## Personnalisation

### Ajout d'options personnalisées

Pour ajouter de nouvelles options prédéfinies, modifiez le tableau `predefinedPeriods` dans le composant :

```typescript
const predefinedPeriods: PeriodSelection[] = [
  // ... options existantes
  {
    type: "custom",
    startDate: new CalendarDate(2024, 1, 1),
    endDate: new CalendarDate(2024, 12, 31),
    label: "Année 2024"
  }
];
```

### Modification du style

Le composant utilise les classes Tailwind CSS de l'application. Les couleurs principales sont :
- `custom-blue-select` : Couleur principale
- `bg-custom-blue-select/14` : Arrière-plan de sélection
- `text-custom-blue-select` : Texte de sélection

## Avantages

### Pour l'utilisateur
- **Rapidité** : Accès en un clic aux périodes courantes
- **Simplicité** : Sélection d'un mois personnalisé en une seule étape
- **Clarté** : Interface claire avec descriptions des options

### Pour le développeur
- **Réutilisable** : Composant générique utilisable partout
- **Type-safe** : TypeScript pour une meilleure sécurité
- **Maintenable** : Code bien structuré et documenté

## Tests

Le composant a été testé avec :
- ✅ Sélection des périodes prédéfinies
- ✅ Sélection de mois personnalisés
- ✅ Formatage automatique des dates en français
- ✅ Intégration avec l'API existante
- ✅ Responsive design
- ✅ Accessibilité

## Prochaines améliorations

- [ ] Sauvegarde de la dernière sélection
- [ ] Raccourcis clavier
- [ ] Export des données par période
- [ ] Comparaison de périodes
- [ ] Graphiques de tendances
