# Configuration Google Calendar

## Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```bash
# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuration Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar
4. Allez dans "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configurez l'écran de consentement OAuth
6. Créez un client OAuth 2.0 avec :
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/google-calendar/callback`
7. Copiez le Client ID et Client Secret dans votre fichier `.env.local`

## Scopes d'autorisation

L'application demande les autorisations suivantes :
- `https://www.googleapis.com/auth/calendar.readonly` - Lecture des calendriers
- `https://www.googleapis.com/auth/calendar.events` - Gestion des événements
- `https://www.googleapis.com/auth/calendar` - Accès complet aux calendriers

## Utilisation

1. Lancez l'application avec `npm run dev`
2. Allez sur la page agenda
3. Cliquez sur "Connecter Google Calendar"
4. Autorisez l'application dans Google
5. Vous serez redirigé vers l'agenda avec la synchronisation activée

## Fonctionnalités

- **Synchronisation bidirectionnelle** : Voir les événements Google Calendar et en créer de nouveaux
- **Gestion des tokens** : Renouvellement automatique des tokens d'accès
- **Interface intuitive** : Boutons de connexion/déconnexion et synchronisation
- **Affichage des événements** : Liste des événements avec détails et liens vers Google Calendar
