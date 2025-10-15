# Page Clients - Epicu Franchises

## Vue d'ensemble

La page clients est une interface complète pour la gestion des clients de l'application Epicu Franchises. Elle offre une vue tabulaire des clients avec des fonctionnalités de recherche, filtrage, tri et pagination.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Tableau des clients** : Affichage des informations clients dans un tableau responsive
- **Recherche** : Recherche par nom d'entreprise ou email
- **Filtrage par catégorie** : Filtrage par statut (Tous, Actifs, Inactifs, Prospects)
- **Tri** : Tri par date de signature de contrat (ascendant/descendant)
- **Pagination** : Navigation entre les pages avec affichage du nombre total d'éléments
- **Ajout de client** : Modal pour ajouter un nouveau client
- **Édition** : Bouton d'édition pour chaque client (à implémenter)

### 📊 Colonnes du tableau

1. **Client** : ID du client
2. **Raison sociale** : Nom de l'entreprise
3. **Date signature contrat** : Date de signature du contrat (triable)
4. **Facture contenu** : Date de facturation du contenu
5. **Facture publication** : Statut de la facture (En attente, Payée, En retard)
6. **Modifier** : Bouton d'édition
7. **Commentaire** : Commentaires sur le client

### 🎨 Interface utilisateur

- **Design moderne** : Interface claire et professionnelle
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Thème sombre/clair** : Support des thèmes sombre et clair
- **Badges colorés** : Statuts des factures avec codes couleur
- **États de chargement** : Indicateurs de chargement et gestion d'erreurs

## Structure technique

### 📁 Fichiers

```
epicu-franchises-web/
├── app/
│   ├── clients/
│   │   ├── page.tsx          # Page principale des clients
│   │   └── layout.tsx        # Layout avec DashboardLayout
│   └── api/
│       └── clients/
│           └── route.ts      # API route pour les clients
```

### 🔧 Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique
- **HeroUI** : Composants UI modernes
- **Tailwind CSS** : Styling utilitaire
- **Heroicons** : Icônes

### 📡 API

#### Endpoint : `/api/clients`

**GET** - Récupération des clients
- Paramètres de requête :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre d'éléments par page (défaut: 10)
  - `search` : Terme de recherche
  - `category` : Catégorie de filtrage
  - `sortBy` : Champ de tri
  - `sortOrder` : Ordre de tri (asc/desc)

**POST** - Ajout d'un nouveau client
- Corps de la requête :
  ```json
  {
    "raisonSociale": "string (requis)",
    "email": "string",
    "telephone": "string",
    "adresse": "string",
    "commentaire": "string",
    "statut": "actif|inactif|prospect"
  }
  ```

### 🗄️ Données mock

L'application utilise actuellement des données mock pour la démonstration :

- 5 clients d'exemple avec des informations complètes
- Statuts de facture variés (En attente, Payée, En retard)
- Données réalistes pour les tests

## Utilisation

### 🚀 Accès à la page

1. Naviguer vers `/clients` dans l'application
2. La page s'affiche avec le tableau des clients
3. Utiliser les filtres et la recherche pour trouver des clients spécifiques

### ➕ Ajouter un client

1. Cliquer sur le bouton "Ajouter un client"
2. Remplir le formulaire dans le modal
3. Cliquer sur "Ajouter" pour créer le client
4. Le tableau se met à jour automatiquement

### 🔍 Rechercher et filtrer

1. **Recherche** : Utiliser la barre de recherche pour chercher par nom ou email
2. **Filtrage** : Sélectionner une catégorie dans le dropdown
3. **Tri** : Cliquer sur l'en-tête "Date signature contrat" pour trier

## Développement

### 🔄 Prochaines étapes

- [ ] Implémenter l'édition des clients
- [ ] Connecter à une vraie base de données (AirTable)
- [ ] Ajouter la suppression de clients
- [ ] Implémenter l'export des données
- [ ] Ajouter des filtres avancés
- [ ] Améliorer la gestion des erreurs

### 🐛 Débogage

- Vérifier les logs du serveur pour les erreurs API
- Utiliser les outils de développement du navigateur
- Tester les différents paramètres de l'API

## Contribution

Pour contribuer à cette page :

1. Suivre les conventions de code existantes
2. Tester les nouvelles fonctionnalités
3. Mettre à jour la documentation
4. Respecter les patterns d'architecture Next.js

---

*Dernière mise à jour : Décembre 2024* 