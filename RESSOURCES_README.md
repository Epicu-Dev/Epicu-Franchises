# Page Ressources - EPICU Franchises

## Vue d'ensemble

La page Ressources est une nouvelle fonctionnalité qui permet aux utilisateurs d'accéder et de gérer tous les documents et ressources EPICU de manière organisée et centralisée.

## Fonctionnalités

### 🗂️ Navigation par onglets
- **Liens importants** : Accès rapide aux ressources essentielles
- **Bibliothèque** : Collection de documents et ressources
- **Ressources Canva** : Templates et designs Canva
- **Matériel** : Ressources physiques et équipements

### 🔍 Recherche et filtrage
- Barre de recherche en temps réel
- Filtrage par catégorie
- Tri par date d'ajout (ascendant/descendant)

### ➕ Gestion des ressources
- Ajout de nouvelles ressources via modal
- Édition des ressources existantes
- Système de tags pour l'organisation
- Support des icônes personnalisées

### 📱 Interface responsive
- Design adaptatif pour mobile et desktop
- Navigation intuitive
- Thème sombre/clair supporté

## Structure des fichiers

```
app/ressources/
├── layout.tsx          # Layout de la page
└── page.tsx            # Page principale des ressources

components/
└── resource-modal.tsx  # Modal d'ajout/édition

types/
└── resource.ts         # Types TypeScript
```

## Utilisation

### Accès à la page
La page est accessible via la navigation principale dans la sidebar, sous l'élément "Ressources".

### Ajouter une ressource
1. Cliquer sur le bouton "Ajouter un document"
2. Remplir le formulaire avec :
   - Titre de la ressource
   - Description
   - Lien/URL
   - Catégorie
   - Icône (optionnel)
   - Tags (optionnel)
3. Valider la création

### Rechercher une ressource
- Utiliser la barre de recherche pour filtrer par titre ou description
- Changer d'onglet pour filtrer par catégorie
- Trier par date d'ajout

## Données par défaut

La page inclut déjà plusieurs ressources importantes :
- **LE DRIVE PARTAGÉ** : Stockage centralisé EPICU
- **LE DASHBOARD EPICU** : Gestion des prospects et clients
- **LA BOÎTE MAIL EPICU** : Gestion des emails professionnels
- **WORDPRESS EPICU** : Gestion du contenu du site
- **BOARDS** : Raccourcis clavier et automatisation
- **GOOGLE FORMS** : Formulaires pour établissements

## Technologies utilisées

- **Next.js 14** avec App Router
- **HeroUI** pour les composants d'interface
- **TypeScript** pour la sécurité des types
- **Tailwind CSS** pour le styling
- **Heroicons** pour les icônes

## Évolutions futures

- [ ] Système de favoris
- [ ] Partage de ressources entre utilisateurs
- [ ] Historique des modifications
- [ ] Export des ressources
- [ ] Intégration avec le système de permissions
- [ ] Notifications pour nouvelles ressources
- [ ] Système de commentaires et feedback

## Support

Pour toute question ou suggestion concernant la page Ressources, contactez l'équipe de développement EPICU.
