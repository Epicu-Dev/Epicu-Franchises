# Synchronisation Google Calendar - Epicu Franchises

## Vue d'ensemble

Cette fonctionnalité permet de synchroniser votre agenda Epicu avec Google Calendar, offrant une vue unifiée de tous vos événements et la possibilité de créer de nouveaux événements directement dans Google Calendar.

## Fonctionnalités

### 🔗 Synchronisation bidirectionnelle
- **Lecture** : Afficher tous les événements de vos calendriers Google
- **Écriture** : Créer de nouveaux événements dans Google Calendar
- **Temps réel** : Synchronisation automatique des données

### 📱 Interface utilisateur intuitive
- Bouton de connexion/déconnexion Google Calendar
- Affichage du statut de connexion
- Liste des calendriers synchronisés
- Bouton de synchronisation manuelle

### 🎯 Gestion des événements
- Création d'événements avec titre, description, lieu
- Support des événements sur toute la journée
- Gestion des dates et heures de début/fin
- Intégration avec le système de couleurs Google Calendar

## Configuration requise

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# Configuration de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configuration Google Cloud Console

1. **Accéder à Google Cloud Console**
   - Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
   - Créez un nouveau projet ou sélectionnez un projet existant

2. **Activer l'API Google Calendar**
   - Dans le menu, allez à "APIs & Services" > "Library"
   - Recherchez "Google Calendar API"
   - Cliquez sur "Enable"

3. **Créer les identifiants OAuth**
   - Allez à "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
   - Sélectionnez "Web application"

4. **Configurer l'écran de consentement**
   - Nom de l'application : "Epicu Franchises"
   - Domaines autorisés : `localhost`
   - URI de redirection autorisés : `http://localhost:3000/api/google-calendar/callback`

5. **Récupérer les identifiants**
   - Copiez le "Client ID" et "Client Secret"
   - Ajoutez-les dans votre fichier `.env.local`

## Utilisation

### Première connexion

1. **Lancer l'application**
   ```bash
   npm run dev
   ```

2. **Accéder à l'agenda**
   - Naviguez vers `/agenda`
   - Vous verrez la section "Synchronisation Google Calendar"

3. **Se connecter**
   - Cliquez sur "Connecter Google Calendar"
   - Autorisez l'application dans Google
   - Vous serez redirigé vers l'agenda

### Utilisation quotidienne

#### Voir les événements Google
- Les événements Google Calendar s'affichent automatiquement
- Cliquez sur un événement pour l'ouvrir dans Google Calendar
- Utilisez le bouton "Synchroniser" pour rafraîchir les données

#### Créer un événement Google
1. Cliquez sur "Créer dans Google Calendar"
2. Remplissez le formulaire :
   - **Titre** : Nom de l'événement (obligatoire)
   - **Description** : Détails de l'événement
   - **Lieu** : Emplacement ou adresse
   - **Date et heure** : Début et fin de l'événement
   - **Toute la journée** : Cochez pour un événement sur 24h
3. Cliquez sur "Créer l'événement"

#### Se déconnecter
- Cliquez sur "Déconnecter" pour arrêter la synchronisation
- Les tokens d'accès seront supprimés

## Architecture technique

### Composants React
- `GoogleCalendarSync` : Gestion de la connexion et synchronisation
- `GoogleCalendarEvents` : Affichage des événements Google
- `GoogleCalendarCreateEvent` : Formulaire de création d'événements

### API Routes
- `POST /api/google-calendar/auth` : Authentification OAuth
- `GET /api/google-calendar/callback` : Callback OAuth
- `GET /api/google-calendar/status` : Statut de connexion
- `GET /api/google-calendar/sync` : Synchronisation des événements
- `POST /api/google-calendar/events` : Création d'événements
- `POST /api/google-calendar/disconnect` : Déconnexion

### Gestion des tokens
- **Access Token** : Valide 1 heure, stocké en cookie sécurisé
- **Refresh Token** : Valide 30 jours, renouvellement automatique
- **Sécurité** : Cookies httpOnly, secure en production

## Dépannage

### Erreurs courantes

#### "Non authentifié"
- Vérifiez que vous êtes connecté à Google Calendar
- Reconnectez-vous en cliquant sur "Connecter Google Calendar"

#### "Token expiré"
- L'application tente automatiquement de rafraîchir le token
- Si cela échoue, reconnectez-vous manuellement

#### "Erreur de synchronisation"
- Vérifiez votre connexion internet
- Assurez-vous que l'API Google Calendar est activée
- Vérifiez les permissions de votre compte Google

### Logs et débogage

Les erreurs sont loggées dans la console du serveur. Vérifiez :
- Les variables d'environnement
- La configuration Google Cloud Console
- Les permissions OAuth

## Sécurité

### Bonnes pratiques
- Ne partagez jamais vos identifiants Google
- Utilisez des comptes Google dédiés pour la production
- Limitez les scopes d'autorisation au minimum nécessaire
- Surveillez l'utilisation de l'API

### Scopes d'autorisation
- `calendar.readonly` : Lecture des calendriers
- `calendar.events` : Gestion des événements
- `calendar` : Accès complet (utilisé pour la compatibilité)

## Support et maintenance

### Mise à jour des dépendances
```bash
npm update googleapis
```

### Surveillance de l'API
- Quotas Google Calendar : 1,000,000,000 requêtes/jour
- Limite par utilisateur : 10,000 requêtes/seconde
- Surveillez l'utilisation dans Google Cloud Console

### Sauvegarde
- Les événements Google Calendar sont stockés sur les serveurs Google
- Synchronisez régulièrement pour éviter la perte de données
- Exportez vos calendriers si nécessaire

## Contribution

Pour améliorer cette fonctionnalité :
1. Testez sur différents comptes Google
2. Vérifiez la compatibilité avec les calendriers partagés
3. Ajoutez le support des notifications push
4. Implémentez la synchronisation bidirectionnelle complète

---

**Note** : Cette fonctionnalité nécessite une configuration Google Cloud Console et des variables d'environnement. Consultez la documentation Google pour plus de détails sur l'API Calendar.
