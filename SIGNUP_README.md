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

### Table SIGNUP_TOKENS

Créer une table Airtable avec les champs suivants :

- `user_id` (Single line text) : ID de l'utilisateur dans COLLABORATEURS
- `token` (Single line text) : Token unique de signup
- `created_at` (Date) : Date de création du token
- `expires_at` (Date) : Date d'expiration du token

## API Endpoints

### GET /api/auth/validate-signup-token

Valide un token de signup et retourne le nom de l'utilisateur.

**Paramètres :**
- `token` (query) : Token de signup

**Réponse :**
```json
{
  "message": "Token valide",
  "userName": "Prénom Nom",
  "userId": "user_id"
}
```

### POST /api/auth/initialize-password

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
  "message": "Mot de passe initialisé avec succès"
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
