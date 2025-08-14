# Page Prospects - Epicu Franchises

## Vue d'ensemble

La page prospects est une interface complète pour la gestion des prospects de l'application Epicu Franchises. Elle offre une vue organisée par onglets selon le statut des prospects, avec des fonctionnalités de recherche, filtrage, tri et conversion en clients.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Onglets par statut** : Organisation en 3 onglets (À contacter, En discussion, Glacial)
- **Tableau des prospects** : Affichage des informations prospects dans un tableau responsive
- **Recherche** : Recherche par nom d'établissement ou email
- **Filtrage double** : Filtrage par catégorie et par responsable de suivi
- **Tri** : Tri par catégorie, date de relance et responsable de suivi
- **Pagination** : Navigation entre les pages avec affichage du nombre total d'éléments
- **Ajout de prospect** : Modal pour ajouter un nouveau prospect
- **Conversion en client** : Bouton pour convertir un prospect en client
- **Édition** : Bouton d'édition pour chaque prospect (à implémenter)

### 📊 Colonnes du tableau

1. **Nom établissement** : Nom de l'établissement prospect
2. **Catégorie** : Première catégorie (Food, Shop, Service) avec badge coloré
3. **Catégorie** : Deuxième catégorie avec badge coloré
4. **Date de relance** : Date de relance prévue (triable)
5. **Suivi par** : Responsable du suivi (triable)
6. **Commentaire** : Commentaires sur le prospect
7. **Modifier** : Bouton d'édition
8. **Basculer en client** : Bouton de conversion

### 🎨 Interface utilisateur

- **Onglets actifs** : Navigation claire entre les différents statuts
- **Design moderne** : Interface claire et professionnelle
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Thème sombre/clair** : Support des thèmes sombre et clair
- **Badges colorés** : Catégories avec codes couleur distinctifs
- **États de chargement** : Indicateurs de chargement et gestion d'erreurs

### 🏷️ Statuts des prospects

- **À contacter** : Prospects à contacter pour la première fois
- **En discussion** : Prospects avec qui une discussion est en cours
- **Glacial** : Prospects froids ou peu réactifs

## Structure technique

### 📁 Fichiers

```
epicu-franchises-web/
├── app/
│   ├── prospects/
│   │   ├── page.tsx          # Page principale des prospects
│   │   └── layout.tsx        # Layout avec DashboardLayout
│   └── api/
│       └── prospects/
│           ├── route.ts      # API route pour les prospects
│           └── [id]/
│               └── convert/
│                   └── route.ts  # API route pour la conversion
```

### 🔧 Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique
- **HeroUI** : Composants UI modernes (Tabs, Table, Modal, etc.)
- **Tailwind CSS** : Styling utilitaire
- **Heroicons** : Icônes

### 📡 API

#### Endpoint : `/api/prospects`

**GET** - Récupération des prospects
- Paramètres de requête :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre d'éléments par page (défaut: 10)
  - `search` : Terme de recherche
  - `category` : Catégorie de filtrage
  - `suiviPar` : Responsable de suivi
  - `statut` : Statut du prospect (a_contacter, en_discussion, glacial)
  - `sortBy` : Champ de tri
  - `sortOrder` : Ordre de tri (asc/desc)

**POST** - Ajout d'un nouveau prospect
- Corps de la requête :
  ```json
  {
    "nomEtablissement": "string (requis)",
    "categorie1": "string",
    "categorie2": "string",
    "email": "string",
    "telephone": "string",
    "adresse": "string",
    "commentaire": "string",
    "suiviPar": "string",
    "statut": "a_contacter|en_discussion|glacial"
  }
  ```

#### Endpoint : `/api/prospects/[id]/convert`

**POST** - Conversion d'un prospect en client
- Convertit le prospect en client et le supprime de la liste des prospects

### 🗄️ Données mock

L'application utilise actuellement des données mock pour la démonstration :

- 8 prospects d'exemple avec des informations complètes
- Répartition équilibrée entre les 3 statuts
- Catégories variées (Food, Shop, Service)
- Données réalistes pour les tests

## Utilisation

### 🚀 Accès à la page

1. Naviguer vers `/prospects` dans l'application
2. La page s'affiche avec l'onglet "À contacter" actif par défaut
3. Utiliser les onglets pour naviguer entre les différents statuts

### ➕ Ajouter un prospect

1. Cliquer sur le bouton "Ajouter un prospect"
2. Remplir le formulaire dans le modal
3. Sélectionner les catégories et le statut
4. Cliquer sur "Ajouter" pour créer le prospect
5. Le tableau se met à jour automatiquement

### 🔄 Convertir en client

1. Cliquer sur le bouton "Convertir" d'un prospect
2. Le prospect est automatiquement converti en client
3. Le prospect disparaît de la liste des prospects
4. Un nouveau client est créé dans la base de données

### 🔍 Rechercher et filtrer

1. **Recherche** : Utiliser la barre de recherche pour chercher par nom ou email
2. **Filtrage par catégorie** : Sélectionner une catégorie dans le premier dropdown
3. **Filtrage par responsable** : Sélectionner un responsable dans le deuxième dropdown
4. **Tri** : Cliquer sur les en-têtes de colonnes pour trier

### 📋 Navigation par onglets

- **À contacter** : Prospects à contacter pour la première fois
- **En discussion** : Prospects avec qui une discussion est en cours
- **Glacial** : Prospects froids ou peu réactifs

## Développement

### 🔄 Prochaines étapes

- [ ] Implémenter l'édition des prospects
- [ ] Connecter à une vraie base de données (AirTable)
- [ ] Ajouter la suppression de prospects
- [ ] Implémenter l'export des données
- [ ] Ajouter des filtres avancés (date de relance, etc.)
- [ ] Améliorer la gestion des erreurs
- [ ] Ajouter des notifications pour les conversions
- [ ] Implémenter un système de relances automatiques

### 🐛 Débogage

- Vérifier les logs du serveur pour les erreurs API
- Utiliser les outils de développement du navigateur
- Tester les différents paramètres de l'API
- Vérifier le fonctionnement des onglets et du filtrage

## Contribution

Pour contribuer à cette page :

1. Suivre les conventions de code existantes
2. Tester les nouvelles fonctionnalités sur tous les onglets
3. Mettre à jour la documentation
4. Respecter les patterns d'architecture Next.js
5. Tester la conversion des prospects en clients

---

*Dernière mise à jour : Décembre 2024* 