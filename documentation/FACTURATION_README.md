# Page Facturation - Epicu Franchises

## Vue d'ensemble

La page "Facturation" est une interface complète de gestion des factures pour l'application Epicu Franchises. Elle offre un système de gestion des factures avec filtrage par statut, catégorisation et fonctionnalités d'ajout et de modification.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Onglets de statut** : Payée, En attente, Retard
- **Tableau des factures** : Affichage complet avec tri
- **Recherche** : Recherche par nom d'établissement, type de prestation ou catégorie
- **Filtrage par catégorie** : Shop, Restaurant, Service
- **Tri** : Tri par toutes les colonnes avec indicateurs visuels
- **Pagination** : Navigation entre les pages
- **Ajout de facture** : Modal complet pour créer des factures
- **Édition de facture** : Modal pour modifier les factures existantes
- **Formatage automatique** : Montants en euros et dates en format français

### 📊 Colonnes du tableau

1. **Catégorie** : Badge coloré (Shop, Restaurant, Service) - triable
2. **Nom établissement** : Nom de l'établissement client - triable
3. **Date** : Date de la facture au format DD.MM.YYYY - triable
4. **Montant** : Montant en euros formaté - triable
5. **Type de prestation** : Type de service fourni - triable
6. **Modifier** : Bouton d'édition avec icône crayon
7. **Commentaire** : Commentaires sur la facture

### 🎨 Interface utilisateur

- **Design moderne** : Interface claire et professionnelle
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Thème sombre/clair** : Support des thèmes sombre et clair
- **Badges colorés** : Catégories avec codes couleur distinctifs
- **Indicateurs de tri** : Flèches pour indiquer l'ordre de tri
- **Onglets actifs** : Indication visuelle de l'onglet sélectionné

### 🏷️ Statuts des factures

- **Payée** : Factures réglées (onglet actif par défaut)
- **En attente** : Factures en attente de paiement
- **Retard** : Factures en retard de paiement

### 🏪 Catégories d'établissements

- **Shop** : Boutiques et commerces
- **Restaurant** : Restaurants et établissements de restauration
- **Service** : Prestataires de services

## Structure technique

### 📁 Fichiers

```
epicu-franchises-web/
├── app/
│   ├── facturation/
│   │   ├── page.tsx          # Page principale de facturation
│   │   └── layout.tsx        # Layout avec DashboardLayout
│   └── api/
│       └── facturation/
│           ├── route.ts      # API route pour les factures
│           └── [id]/
│               └── route.ts  # API route pour les opérations CRUD
```

### 🔧 Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique
- **HeroUI** : Composants UI modernes (Card, Table, Modal, Tabs, Chip)
- **Tailwind CSS** : Styling utilitaire
- **Heroicons** : Icônes

### 📡 API

#### Endpoint : `/api/facturation`

**GET** - Récupération des factures
- Paramètres de requête :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre d'éléments par page (défaut: 10)
  - `status` : Statut de filtrage (payee, en_attente, retard)
  - `search` : Terme de recherche
  - `category` : Catégorie de filtrage
  - `sortBy` : Champ de tri
  - `sortOrder` : Ordre de tri (asc/desc)

**POST** - Ajout d'une nouvelle facture
- Corps de la requête :
  ```json
  {
    "category": "string",
    "establishmentName": "string (requis)",
    "date": "string (YYYY-MM-DD) (requis)",
    "amount": "number (requis)",
    "serviceType": "string (requis)",
    "status": "payee|en_attente|retard",
    "comment": "string"
  }
  ```

#### Endpoint : `/api/facturation/[id]`

**GET** - Récupération d'une facture spécifique
**PUT** - Modification d'une facture
**DELETE** - Suppression d'une facture

### 🗄️ Données mock

L'application utilise actuellement des données mock pour la démonstration :

- 12 factures d'exemple avec des informations complètes
- Répartition équilibrée entre les statuts et catégories
- Données réalistes pour les tests
- Factures sur différentes dates de juin et juillet 2025

## Utilisation

### 🚀 Accès à la page

1. Naviguer vers `/facturation` dans l'application
2. La page s'affiche avec l'onglet "Payée" actif par défaut
3. Utiliser les onglets pour changer de statut
4. Utiliser les filtres et la recherche pour trouver des factures spécifiques

### ➕ Ajouter une facture

1. Cliquer sur le bouton "Ajouter une facture"
2. Remplir le formulaire dans le modal :
   - **Catégorie** : Sélectionner Shop, Restaurant ou Service
   - **Nom de l'établissement** : Nom du client (obligatoire)
   - **Date** : Date de la facture (obligatoire)
   - **Montant** : Montant en euros (obligatoire)
   - **Type de prestation** : Type de service (obligatoire)
   - **Statut** : Statut de la facture
   - **Commentaire** : Commentaires optionnels
3. Cliquer sur "Ajouter" pour créer la facture
4. Le tableau se met à jour automatiquement

### ✏️ Modifier une facture

1. Cliquer sur l'icône crayon d'une facture
2. Modifier les informations dans le modal
3. Cliquer sur "Modifier" pour sauvegarder
4. Le tableau se met à jour automatiquement

### 🔍 Rechercher et filtrer

1. **Recherche** : Utiliser la barre de recherche pour chercher par nom d'établissement, type de prestation ou catégorie
2. **Filtrage par catégorie** : Sélectionner une catégorie dans le dropdown
3. **Changement d'onglet** : Cliquer sur "Payée", "En attente" ou "Retard"
4. **Tri** : Cliquer sur les en-têtes de colonnes pour trier

### 📊 Onglets de statut

#### Onglet "Payée"
- Affiche toutes les factures réglées
- Onglet actif par défaut
- Indication visuelle de l'onglet sélectionné

#### Onglet "En attente"
- Affiche les factures en attente de paiement
- Permet de suivre les paiements en cours

#### Onglet "Retard"
- Affiche les factures en retard de paiement
- Permet d'identifier les impayés

## Fonctionnalités clés

### Formatage automatique
- **Montants** : Formatage en euros avec séparateurs de milliers
- **Dates** : Format français (DD.MM.YYYY)
- **Catégories** : Badges colorés pour une identification rapide

### Tri intelligent
- Tri par toutes les colonnes
- Indicateurs visuels (flèches) pour l'ordre de tri
- Tri ascendant/descendant

### Filtrage avancé
- Filtrage par statut via les onglets
- Filtrage par catégorie
- Recherche textuelle globale

### Pagination
- Navigation entre les pages
- Affichage du nombre total d'éléments
- Contrôles de pagination intuitifs

## Développement

### 🔄 Prochaines étapes

- [ ] Connecter à une vraie base de données (AirTable)
- [ ] Ajouter l'export des factures (PDF, Excel)
- [ ] Implémenter la génération automatique de factures
- [ ] Ajouter des rappels de paiement
- [ ] Implémenter la synchronisation avec des systèmes comptables
- [ ] Ajouter des statistiques et graphiques
- [ ] Implémenter la gestion des devises multiples
- [ ] Ajouter des modèles de factures personnalisables

### 🐛 Débogage

- Vérifier les logs du serveur pour les erreurs API
- Utiliser les outils de développement du navigateur
- Tester les différents paramètres de l'API
- Vérifier le fonctionnement des modals et des formulaires
- Tester le tri et le filtrage

## Contribution

Pour contribuer à cette page :

1. Suivre les conventions de code existantes
2. Tester les nouvelles fonctionnalités
3. Mettre à jour la documentation
4. Respecter les patterns d'architecture Next.js
5. Tester les opérations CRUD complètes
6. Vérifier la responsivité sur différents écrans

---

*Dernière mise à jour : Décembre 2024* 