# Intégration Google Calendar via Iframe

## Vue d'ensemble

Cette fonctionnalité permet d'afficher directement le calendrier Google Calendar dans votre application Epicu Franchises via une intégration iframe. Cela offre une vue en temps réel de votre calendrier Google sans avoir besoin de synchroniser manuellement les événements.

## Fonctionnalités

### 🎯 Fonctionnalités principales

- **Affichage direct** : Intégration native du calendrier Google Calendar
- **Configuration flexible** : Personnalisation de l'ID du calendrier, fuseau horaire et langue
- **Vues multiples** : Basculer entre vue mois, semaine et agenda
- **Hauteur ajustable** : Personnaliser la taille d'affichage du calendrier
- **Contrôles** : Afficher/masquer le calendrier et accéder aux paramètres

### 📊 Composants créés

1. **`GoogleCalendarIframe`** : Composant principal d'affichage du calendrier
2. **`GoogleCalendarConfig`** : Interface de configuration du calendrier
3. **Intégration dans la page agenda** : Ajout automatique dans la page agenda

## Configuration

### 🔧 Configuration de base

Le composant utilise par défaut :
- **ID du calendrier** : `primary` (votre calendrier principal Google)
- **Fuseau horaire** : `Europe/Paris`
- **Langue** : `fr` (français)

### 📝 Personnalisation

#### Option 1 : Via l'interface de configuration
1. Cliquez sur "Configurer" dans le composant de configuration
2. Modifiez l'ID du calendrier, fuseau horaire et langue
3. Cliquez sur "Sauvegarder"

#### Option 2 : Modification directe du code
```typescript
const [googleCalendarConfig, setGoogleCalendarConfig] = useState<ConfigType>({
  calendarId: "votre@email.com", // Votre email Gmail
  timezone: "Europe/Paris",      // Votre fuseau horaire
  language: "fr"                 // Votre langue
});
```

## Comment trouver l'ID de votre calendrier

### 📱 Méthode 1 : Via Google Calendar Web
1. Allez sur [Google Calendar](https://calendar.google.com)
2. Cliquez sur les 3 points à côté du nom de votre calendrier
3. Sélectionnez "Paramètres et partage"
4. Dans "Intégrer le calendrier", copiez l'ID du calendrier

### 🔗 Méthode 2 : Via l'URL d'intégration
1. Dans les paramètres de votre calendrier
2. Section "Intégrer le calendrier"
3. Copiez l'URL d'intégration complète
4. Collez-la dans le composant de configuration

### 📧 Méthode 3 : Utiliser votre email
- Utilisez directement votre adresse Gmail : `votre@email.com`
- Utilisez `primary` pour votre calendrier principal

## Types de calendriers supportés

### ✅ Calendriers personnels
- Votre calendrier principal Google (`primary`)
- Votre email Gmail (`votre@email.com`)

### ✅ Calendriers partagés
- Calendriers partagés avec vous
- Calendriers d'équipe
- Calendriers de ressources

### ✅ Calendriers publics
- Calendriers publics Google
- Calendriers d'événements publics

## Paramètres d'affichage

### 🎨 Personnalisation visuelle
- **Vue** : Mois, Semaine, Agenda
- **Hauteur** : 400px à 1000px
- **Couleurs** : Thème Google Calendar par défaut
- **Navigation** : Boutons de navigation intégrés

### ⚙️ Options avancées
- **Fuseau horaire** : Affichage dans votre zone horaire
- **Langue** : Interface dans votre langue
- **Premier jour** : Lundi par défaut (configurable)

## Utilisation dans l'application

### 📍 Emplacement
Le composant est automatiquement intégré dans :
- **Page Agenda** (`/app/agenda/page.tsx`)
- **Position** : Après la synchronisation Google Calendar, avant la liste des événements

### 🔄 Mise à jour automatique
- Le calendrier se met à jour en temps réel
- Aucune action manuelle requise
- Synchronisation automatique avec Google Calendar

## Avantages de l'intégration iframe

### ✅ Avantages
- **Temps réel** : Affichage instantané des événements
- **Fonctionnalités complètes** : Toutes les fonctionnalités Google Calendar
- **Synchronisation automatique** : Pas de gestion manuelle
- **Interface familière** : Expérience utilisateur Google Calendar
- **Gestion des permissions** : Respect des paramètres de partage

### ⚠️ Limitations
- **Dépendance externe** : Nécessite une connexion internet
- **Style limité** : Personnalisation visuelle limitée
- **Responsive** : Adaptation automatique mais limitée

## Dépannage

### 🚫 Problèmes courants

#### Le calendrier ne s'affiche pas
1. Vérifiez votre connexion internet
2. Vérifiez que l'ID du calendrier est correct
3. Vérifiez les permissions du calendrier

#### Erreur d'authentification
1. Assurez-vous d'être connecté à Google
2. Vérifiez que le calendrier est partagé avec vous
3. Utilisez un calendrier public si nécessaire

#### Problèmes d'affichage
1. Vérifiez la hauteur configurée
2. Testez différentes vues (mois, semaine, agenda)
3. Vérifiez la résolution de votre écran

### 🔧 Solutions

#### Recharger la page
- Actualisez la page pour recharger l'iframe

#### Vérifier la configuration
- Utilisez l'interface de configuration pour vérifier les paramètres

#### Tester avec un calendrier public
- Utilisez un calendrier public pour tester l'intégration

## Développement

### 🛠️ Structure des composants

```
components/
├── google-calendar-iframe.tsx    # Composant principal d'affichage
└── google-calendar-config.tsx    # Interface de configuration

app/agenda/
└── page.tsx                      # Page agenda avec intégration
```

### 🔌 Props des composants

#### GoogleCalendarIframe
```typescript
interface GoogleCalendarIframeProps {
  className?: string;
  config?: GoogleCalendarConfig;
  onConfigChange?: (config: GoogleCalendarConfig) => void;
}
```

#### GoogleCalendarConfig
```typescript
interface GoogleCalendarConfigProps {
  onConfigChange: (config: GoogleCalendarConfig) => void;
  className?: string;
}
```

### 🎨 Personnalisation avancée

Pour personnaliser davantage l'apparence, modifiez le composant `GoogleCalendarIframe` :
- Ajoutez des options de couleur
- Modifiez les paramètres d'URL Google Calendar
- Ajoutez des contrôles personnalisés

## Support et maintenance

### 📚 Documentation Google
- [Google Calendar API](https://developers.google.com/calendar)
- [Intégration iframe](https://developers.google.com/calendar/embed)
- [Paramètres d'URL](https://developers.google.com/calendar/embed/guide)

### 🆘 Support technique
- Vérifiez les logs de la console pour les erreurs
- Testez avec différents navigateurs
- Vérifiez la compatibilité mobile

---

**Note** : Cette intégration utilise l'API publique de Google Calendar et respecte les conditions d'utilisation de Google. Assurez-vous de respecter les politiques de Google lors de l'utilisation en production.
