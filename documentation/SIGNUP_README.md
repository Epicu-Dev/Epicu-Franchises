# Page de Signup - Initialisation du mot de passe

## Description

Cette page permet aux utilisateurs d'initialiser leur mot de passe lors de leur première connexion. Elle utilise un token sécurisé transmis via l'URL pour valider l'identité de l'utilisateur.

## Fonctionnalités

- **Validation du token** : Vérification de la validité et de l'expiration du token
- **Affichage du nom** : Récupération et affichage du nom de l'utilisateur
- **Formulaire sécurisé** : Mot de passe + confirmation avec validation
- **UI cohérente** : Même design que la page de login
- **Validation robuste** : Contrôles de sécurité sur le mot de passe

## Structure des fichiers

```
app/signup/
├── layout.tsx          # Layout avec métadonnées
└── page.tsx            # Page principale de signup

pages/api/auth/
├── validate-signup-token.ts    # Validation du token
└── initialize-password.ts      # Initialisation du mot de passe
```

## URL d'accès

```
/signup?q={token}
```

Où `{token}` est le token de signup généré et stocké en base de données.

## Base de données requise

### Table COLLABORATEURS

La page utilise les champs existants de la table COLLABORATEURS :

- `token_config` (Single line text) : Token de configuration/signup
- `token_config_expires_at` (Date) : Date d'expiration du token
- `password` (Single line text) : Mot de passe hashé (mis à jour après initialisation)
- `Nom` (Single line text) : Nom de famille
- `Prénom` (Single line text) : Prénom
- `Email perso` (Email) : Adresse email
- `Ville EPICU` (Link to another record) : Villes EPICU liées

## API Endpoints

### POST /api/collaborateurs/validate_token

Valide un token de signup et retourne les informations de l'utilisateur.

**Body :**
```json
{
  "token": "signup_token"
}
```

**Réponse :**
```json
{
  "id": "user_id",
  "nom": "Nom",
  "prenom": "Prénom", 
  "email": "email@example.com",
  "villes": [
    {"id": "ville_id", "ville": "Nom de la ville"}
  ]
}
```

### POST /api/collaborateurs/set_password

Initialise le mot de passe d'un utilisateur avec un token valide.

**Body :**
```json
{
  "token": "signup_token",
  "password": "nouveau_mot_de_passe"
}
```

**Réponse :**
```json
{
  "id": "user_id",
  "message": "Password set"
}
```

## Validation du mot de passe

Le mot de passe doit respecter les critères suivants :
- Minimum 8 caractères
- Au moins une lettre minuscule
- Au moins une lettre majuscule
- Au moins un chiffre

## Sécurité

- Les tokens expirent après 24 heures
- Les tokens sont supprimés après utilisation
- Les mots de passe sont hashés avec bcrypt (12 rounds)
- Validation côté client et serveur

## Test

Utilisez le script `test-signup-token.js` pour générer un token de test :

```bash
node test-signup-token.js
```

Remplacez `YOUR_USER_ID_HERE` par un ID d'utilisateur valide de votre base COLLABORATEURS.

## Flux d'utilisation

1. Un administrateur génère un token de signup pour un utilisateur
2. L'utilisateur reçoit un lien par email : `/signup?q={token}`
3. L'utilisateur accède à la page et voit son nom affiché
4. L'utilisateur saisit son nouveau mot de passe et la confirmation
5. Le mot de passe est validé et initialisé
6. L'utilisateur est redirigé vers la page de login
