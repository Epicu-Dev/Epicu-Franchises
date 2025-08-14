# Page To Do - Epicu Franchises

## Vue d'ensemble

La page "To do" est une interface simple et efficace pour la gestion des tâches de l'application Epicu Franchises. Elle offre un système de gestion des tâches avec statuts, échéances et actions rapides.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Tableau des tâches** : Affichage des tâches dans un tableau responsive
- **Checkbox** : Case à cocher pour marquer les tâches comme terminées
- **Recherche** : Recherche par titre de tâche
- **Filtrage par état** : Filtrage par statut (Pas commencé, En cours, Validée, Annulée)
- **Tri** : Tri par titre, deadline et état
- **Pagination** : Navigation entre les pages avec affichage du nombre total d'éléments
- **Ajout de tâche** : Modal simple pour ajouter une nouvelle tâche
- **Suppression** : Bouton poubelle pour supprimer une tâche
- **Changement de statut** : Checkbox pour basculer entre "Pas commencé" et "Validée"

### 📊 Colonnes du tableau

1. **Tâches** : Checkbox + titre de la tâche (triable)
2. **Deadline** : Date d'échéance (triable)
3. **État** : Badge coloré (Pas commencé, En cours, Validée, Annulée) (triable)
4. **Actions** : Bouton poubelle pour supprimer

### 🎨 Interface utilisateur

- **Design épuré** : Interface simple et claire
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Thème sombre/clair** : Support des thèmes sombre et clair
- **Badges colorés** : États avec codes couleur distinctifs
- **Checkbox interactive** : Changement rapide de statut
- **États de chargement** : Indicateurs de chargement et gestion d'erreurs

### 🏷️ États des tâches

- **Pas commencé** : Tâches à réaliser (gris)
- **En cours** : Tâches en cours de réalisation (bleu)
- **Validée** : Tâches achevées (vert)
- **Annulée** : Tâches annulées (rouge)

## Structure technique

### 📁 Fichiers

```
epicu-franchises-web/
├── app/
│   ├── todo/
│   │   ├── page.tsx          # Page principale des tâches
│   │   └── layout.tsx        # Layout avec DashboardLayout
│   └── api/
│       └── todos/
│           ├── route.ts      # API route pour les tâches
│           └── [id]/
│               └── route.ts  # API route pour les opérations CRUD
```

### 🔧 Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique
- **HeroUI** : Composants UI modernes (Table, Modal, Checkbox, etc.)
- **Tailwind CSS** : Styling utilitaire
- **Heroicons** : Icônes

### 📡 API

#### Endpoint : `/api/todos`

**GET** - Récupération des tâches
- Paramètres de requête :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre d'éléments par page (défaut: 10)
  - `search` : Terme de recherche
  - `statut` : Statut de filtrage
  - `sortBy` : Champ de tri
  - `sortOrder` : Ordre de tri (asc/desc)

**POST** - Ajout d'une nouvelle tâche
- Corps de la requête :
  ```json
  {
    "titre": "string (requis)",
    "statut": "a_faire|en_cours|terminee|annulee",
    "dateEcheance": "string (YYYY-MM-DD)"
  }
  ```

#### Endpoint : `/api/todos/[id]`

**GET** - Récupération d'une tâche spécifique
**PUT** - Modification d'une tâche
**DELETE** - Suppression d'une tâche

### 🗄️ Données mock

L'application utilise actuellement des données mock pour la démonstration :

- 8 tâches d'exemple avec des informations complètes
- Répartition équilibrée entre les statuts
- Données réalistes pour les tests

## Utilisation

### 🚀 Accès à la page

1. Naviguer vers `/todo` dans l'application
2. La page s'affiche avec le tableau des tâches
3. Utiliser les filtres et la recherche pour trouver des tâches spécifiques

### ➕ Ajouter une tâche

1. Cliquer sur le bouton "Ajouter une tâche"
2. Remplir le formulaire dans le modal :
   - Titre de la tâche (obligatoire)
   - Date d'échéance
   - État initial
3. Cliquer sur "Ajouter" pour créer la tâche
4. Le tableau se met à jour automatiquement

### ✅ Marquer comme terminée

1. Cocher la checkbox à côté du titre de la tâche
2. La tâche passe automatiquement en statut "Validée"
3. Le badge d'état change de couleur

### 🗑️ Supprimer une tâche

1. Cliquer sur l'icône poubelle d'une tâche
2. La tâche est supprimée automatiquement
3. Le tableau se met à jour

### 🔍 Rechercher et filtrer

1. **Recherche** : Utiliser la barre de recherche pour chercher par titre
2. **Filtrage par état** : Sélectionner un état dans le dropdown
3. **Tri** : Cliquer sur les en-têtes de colonnes pour trier

## Fonctionnalités clés

### Checkbox interactive
- Cochez la case pour marquer une tâche comme "Validée"
- Décochez pour la remettre en "Pas commencé"
- Changement instantané sans rechargement

### Badges d'état colorés
- **Gris** : Pas commencé
- **Bleu** : En cours
- **Vert** : Validée
- **Rouge** : Annulée

### Interface simplifiée
- Seulement les informations essentielles
- Actions rapides et intuitives
- Design épuré et professionnel

## Développement

### 🔄 Prochaines étapes

- [ ] Connecter à une vraie base de données (AirTable)
- [ ] Ajouter des notifications pour les échéances
- [ ] Implémenter un système de rappels
- [ ] Ajouter des filtres avancés (date de création, etc.)
- [ ] Améliorer la gestion des erreurs
- [ ] Ajouter l'export des tâches
- [ ] Implémenter un système de sous-tâches
- [ ] Ajouter des commentaires sur les tâches

### 🐛 Débogage

- Vérifier les logs du serveur pour les erreurs API
- Utiliser les outils de développement du navigateur
- Tester les différents paramètres de l'API
- Vérifier le fonctionnement des modals et des formulaires

## Contribution

Pour contribuer à cette page :

1. Suivre les conventions de code existantes
2. Tester les nouvelles fonctionnalités
3. Mettre à jour la documentation
4. Respecter les patterns d'architecture Next.js
5. Tester les opérations CRUD complètes

---

*Dernière mise à jour : Décembre 2024* 