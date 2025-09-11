# Synchronisation du Calendrier EPICU

## Modifications Apportées

### 1. API de Synchronisation (`/api/google-calendar/sync/route.ts`)
- **Filtrage par calendrier EPICU** : L'API récupère maintenant uniquement les événements du calendrier contenant "EPICU" dans son nom
- **Recherche automatique** : Le système recherche automatiquement le calendrier EPICU parmi tous les calendriers disponibles
- **Gestion d'erreur** : Si aucun calendrier EPICU n'est trouvé, l'API retourne un message explicite

### 2. API de Création d'Événements (`/api/google-calendar/events/route.ts`)
- **Création dans le calendrier EPICU** : Les nouveaux événements sont créés directement dans le calendrier EPICU
- **Validation** : Vérification que le calendrier EPICU existe avant la création
- **Gestion d'erreur** : Message d'erreur si le calendrier EPICU n'est pas trouvé

### 3. API de Suppression d'Événements (`/api/google-calendar/events/delete/route.ts`)
- **Suppression depuis le calendrier EPICU** : Les événements sont supprimés du calendrier EPICU
- **Validation** : Vérification que le calendrier EPICU existe avant la suppression
- **Gestion d'erreur** : Message d'erreur si le calendrier EPICU n'est pas trouvé

### 4. Composant de Synchronisation (`components/google-calendar-sync.tsx`)
- **Affichage spécifique** : Montre uniquement le calendrier EPICU synchronisé
- **Indicateur visuel** : Badge vert avec icône pour identifier le calendrier EPICU
- **Messages informatifs** : Affichage des messages de l'API (ex: "Aucun calendrier EPICU trouvé")

## Fonctionnement

### Recherche du Calendrier EPICU
Le système recherche automatiquement un calendrier dont le nom contient "EPICU" (insensible à la casse) parmi tous les calendriers accessibles à l'utilisateur.

### Synchronisation
- **Lecture** : Récupère uniquement les événements du calendrier EPICU
- **Création** : Crée les nouveaux événements dans le calendrier EPICU
- **Suppression** : Supprime les événements du calendrier EPICU

### Gestion des Erreurs
- Si aucun calendrier EPICU n'est trouvé, le système affiche un message explicite
- Les erreurs de token sont gérées avec un rafraîchissement automatique
- Les messages d'erreur sont affichés dans l'interface utilisateur

## Test

Un script de test est disponible : `test-epicu-sync.js`

```bash
node test-epicu-sync.js
```

Ce script teste :
1. La connexion Google Calendar
2. La liste des calendriers disponibles
3. L'identification du calendrier EPICU
4. La synchronisation des événements

## Avantages

1. **Isolation** : Seuls les événements du calendrier EPICU sont synchronisés
2. **Sécurité** : Les autres calendriers personnels ne sont pas affectés
3. **Clarté** : L'interface montre clairement quel calendrier est utilisé
4. **Robustesse** : Gestion d'erreur complète avec messages explicites

## Configuration Requise

- Un calendrier Google Calendar dont le nom contient "EPICU"
- Permissions de lecture/écriture sur ce calendrier
- Connexion Google Calendar active dans l'application
