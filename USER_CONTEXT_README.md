# Gestion des données utilisateur avec contexte global

## Vue d'ensemble

Cette implémentation permet de garder les données utilisateur en mémoire au lieu de les rappeler sur chaque page, améliorant ainsi les performances et l'expérience utilisateur.

## Architecture

### 1. Types centralisés (`types/user.ts`)

```typescript
export interface VilleEpicu {
  id: string;
  ville: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  villes: VilleEpicu[];
  telephone?: string;
  identifier?: string;
}

export type UserType = "admin" | "franchise";
```

### 2. Contexte utilisateur (`contexts/user-context.tsx`)

Le contexte `UserProvider` gère :
- **Cache local** : Les données utilisateur sont mises en cache dans le localStorage avec un TTL de 1 heure
- **Synchronisation** : Rafraîchissement automatique des données quand nécessaire
- **Gestion d'état** : État de chargement, erreurs, et données utilisateur
- **Type d'utilisateur** : Gestion du type admin/franchise

#### Fonctionnalités principales :

- `userProfile` : Données complètes de l'utilisateur
- `userType` : Type d'utilisateur (admin/franchise)
- `isLoading` : État de chargement
- `error` : Gestion des erreurs
- `refreshUserProfile()` : Force le rafraîchissement des données
- `setUserType()` : Change le type d'utilisateur
- `clearUserData()` : Nettoie les données utilisateur

### 3. Hook d'authentification (`hooks/use-auth-fetch.ts`)

Hook personnalisé pour gérer les appels API authentifiés :

```typescript
export const useAuthFetch = () => {
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getValidAccessToken();
    // ... logique d'authentification
  };
  return { authFetch };
};
```

## Utilisation

### Dans les composants

```typescript
import { useUser } from '@/contexts/user-context';

function MonComposant() {
  const { userProfile, userType, isLoading, refreshUserProfile } = useUser();
  
  if (isLoading) return <Spinner />;
  if (!userProfile) return <div>Aucun utilisateur</div>;
  
  return (
    <div>
      <h1>Bonjour {userProfile.firstname} {userProfile.lastname}</h1>
      <p>Rôle : {userProfile.role}</p>
      <p>Villes : {userProfile.villes.map(v => v.ville).join(', ')}</p>
    </div>
  );
}
```

### Pour les appels API authentifiés

```typescript
import { useAuthFetch } from '@/hooks/use-auth-fetch';

function MonComposant() {
  const { authFetch } = useAuthFetch();
  
  const fetchData = async () => {
    try {
      const response = await authFetch('/api/mes-donnees');
      const data = await response.json();
      // Traitement des données
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
}
```

## Avantages

### 1. Performance
- **Cache local** : Évite les appels API répétés
- **Chargement unique** : Les données sont chargées une seule fois au démarrage
- **TTL intelligent** : Cache expiré après 1 heure

### 2. Expérience utilisateur
- **Navigation fluide** : Pas de chargement entre les pages
- **Données cohérentes** : Même état sur toute l'application
- **Gestion d'erreur centralisée** : Messages d'erreur uniformes

### 3. Maintenabilité
- **Code centralisé** : Logique utilisateur dans un seul endroit
- **Types TypeScript** : Sécurité de type complète
- **Hooks réutilisables** : Facilite le développement

## Migration

### Pages mises à jour
- ✅ `app/profil/page.tsx` : Utilise le contexte utilisateur
- ✅ `app/home/page.tsx` : Utilise le contexte utilisateur
- ✅ `components/sidebar.tsx` : Utilise le contexte utilisateur

### Composants à migrer
- `app/clients/page.tsx`
- `app/prospects/page.tsx`
- `app/facturation/page.tsx`
- Autres pages utilisant les données utilisateur

## Configuration

### Provider dans `app/providers.tsx`

```typescript
export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <UserProvider>
          <LoadingProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LoadingProvider>
        </UserProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
```

## Gestion du cache

Le cache utilisateur est automatiquement :
- **Créé** : Au premier chargement de l'application
- **Utilisé** : Pour les accès suivants (si valide)
- **Rafraîchi** : Quand expiré ou via `refreshUserProfile()`
- **Nettoyé** : À la déconnexion ou erreur d'authentification

## Sécurité

- **Tokens** : Gestion automatique des tokens d'accès et de rafraîchissement
- **Expiration** : Vérification automatique de la validité des tokens
- **Déconnexion** : Nettoyage automatique des données sensibles
