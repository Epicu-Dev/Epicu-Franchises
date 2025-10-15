# Page Agenda - Epicu Franchises

## Vue d'ensemble

La page "Agenda" est une interface complète de gestion de calendrier pour l'application Epicu Franchises. Elle offre un système de gestion d'événements avec différentes vues, catégorisation et fonctionnalités d'ajout d'événements.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Vues multiples** : Tout, Semaine, Mois
- **Navigation temporelle** : Navigation entre les mois avec flèches
- **Boutons d'ajout rapide** : Créer un rendez-vous, Ajouter un tournage, Ajouter une publication
- **Filtrage par catégorie** : Siège, Franchisés, Prestataires
- **Vue calendrier** : Grille mensuelle avec événements colorés
- **Vue timeline** : Liste chronologique des événements
- **Ajout d'événements** : Modal complet pour créer des événements
- **Types d'événements** : Rendez-vous, Tournage, Publication, Événement

### 📊 Types d'événements

1. **Rendez-vous** : Réunions, rencontres clients (bleu)
2. **Tournage** : Sessions de tournage vidéo (rose)
3. **Publication** : Publications sur réseaux sociaux (violet)
4. **Événement** : Événements internes et externes (orange)

### 🎨 Interface utilisateur

- **Design moderne** : Interface claire et professionnelle
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Thème sombre/clair** : Support des thèmes sombre et clair
- **Couleurs distinctives** : Chaque type d'événement a sa couleur
- **Navigation intuitive** : Flèches pour naviguer entre les mois
- **Indicateur de date actuelle** : Cercle rouge autour de la date du jour

### 🏷️ Catégories d'événements

- **Siège** : Événements du siège social
- **Franchisés** : Événements liés aux franchisés
- **Prestataires** : Événements avec les prestataires

## Structure technique

### 📁 Fichiers

```
epicu-franchises-web/
├── app/
│   ├── agenda/
│   │   ├── page.tsx          # Page principale de l'agenda
│   │   └── layout.tsx        # Layout avec DashboardLayout
│   └── api/
│       └── agenda/
│           └── route.ts      # API route pour les événements
```

### 🔧 Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Typage statique
- **HeroUI** : Composants UI modernes (Card, Button, Modal, Select, Chip)
- **Tailwind CSS** : Styling utilitaire
- **Heroicons** : Icônes

### 📡 API

#### Endpoint : `/api/agenda`

**GET** - Récupération des événements
- Paramètres de requête :
  - `month` : Mois (1-12)
  - `year` : Année
  - `view` : Vue (tout, semaine, mois)
  - `category` : Catégorie (tout, siege, franchises, prestataires)

**POST** - Ajout d'un nouvel événement
- Corps de la requête :
  ```json
  {
    "title": "string (requis)",
    "type": "rendez-vous|tournage|publication|evenement",
    "date": "string (YYYY-MM-DD) (requis)",
    "startTime": "string (HH:MM) (requis)",
    "endTime": "string (HH:MM) (requis)",
    "location": "string",
    "description": "string",
    "category": "siege|franchises|prestataires"
  }
  ```

### 🗄️ Données mock

L'application utilise actuellement des données mock pour la démonstration :

- 10 événements d'exemple avec des informations complètes
- Répartition équilibrée entre les types et catégories
- Données réalistes pour les tests
- Événements sur différentes dates de juin 2025

## Utilisation

### 🚀 Accès à la page

1. Naviguer vers `/agenda` dans l'application
2. La page s'affiche avec la vue par défaut (Tout)
3. Utiliser les filtres et la navigation pour explorer les événements

### ➕ Ajouter un événement

#### Méthode rapide
1. Cliquer sur l'un des boutons d'ajout rapide :
   - "Créer un rendez-vous"
   - "Ajouter un tournage"
   - "Ajouter une publication"
2. Le modal s'ouvre avec le type présélectionné
3. Remplir les informations requises
4. Cliquer sur "Ajouter"

#### Méthode complète
1. Cliquer sur n'importe quel bouton d'ajout
2. Remplir le formulaire complet :
   - Titre de l'événement (obligatoire)
   - Type d'événement
   - Date (obligatoire)
   - Heure de début (obligatoire)
   - Heure de fin (obligatoire)
   - Catégorie
   - Lieu
   - Description
3. Cliquer sur "Ajouter"

### 🔍 Navigation et filtrage

1. **Navigation temporelle** : Utiliser les flèches gauche/droite pour changer de mois
2. **Filtrage par catégorie** : Sélectionner une catégorie dans le dropdown
3. **Changement de vue** : Cliquer sur "Tout", "Semaine" ou "Mois"
4. **Vue calendrier** : Voir les événements dans une grille mensuelle
5. **Vue timeline** : Voir les événements dans une liste chronologique

### 📅 Vues disponibles

#### Vue "Tout" (Timeline)
- Liste chronologique des événements
- Affichage des dates en français
- Chips colorés pour les types d'événements
- Informations complètes (heure, lieu)

#### Vue "Mois" (Calendrier)
- Grille mensuelle classique
- Affichage des événements dans les cases de dates
- Limitation à 3 événements par jour avec compteur
- Indicateur de date actuelle (cercle rouge)

#### Vue "Semaine" (Timeline)
- Même format que la vue "Tout"
- Filtrage automatique sur la semaine sélectionnée

## Fonctionnalités clés

### Navigation temporelle
- Flèches pour naviguer entre les mois
- Affichage du mois et de l'année actuels
- Mise à jour automatique des événements

### Boutons d'ajout rapide
- Trois boutons principaux pour les types d'événements les plus courants
- Pré-remplissage du type dans le modal
- Interface intuitive et rapide

### Filtrage intelligent
- Filtrage par catégorie (Siège, Franchisés, Prestataires)
- Filtrage par vue (Tout, Semaine, Mois)
- Combinaison des filtres

### Couleurs distinctives
- **Bleu** : Rendez-vous
- **Rose** : Tournage
- **Violet** : Publication
- **Orange** : Événement

## Développement

### 🔄 Prochaines étapes

- [ ] Connecter à une vraie base de données (AirTable)
- [ ] Ajouter des notifications pour les événements
- [ ] Implémenter la répétition d'événements
- [ ] Ajouter l'édition et suppression d'événements
- [ ] Implémenter la vue semaine avec timeline horaire
- [ ] Ajouter l'export des événements
- [ ] Implémenter la synchronisation avec Google Calendar
- [ ] Ajouter des rappels et notifications push

### 🐛 Débogage

- Vérifier les logs du serveur pour les erreurs API
- Utiliser les outils de développement du navigateur
- Tester les différents paramètres de l'API
- Vérifier le fonctionnement des modals et des formulaires
- Tester la navigation entre les mois

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