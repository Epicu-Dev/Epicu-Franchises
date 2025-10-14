// Variable pour éviter les refresh multiples simultanés
let refreshPromise: Promise<string | null> | null = null;

export function isRefreshTokenValid(): boolean {
  const refreshToken = localStorage.getItem('refreshToken');
  const expiresAt = localStorage.getItem('expiresAtRefresh');

  if (!refreshToken || !expiresAt) return false;

  const now = new Date();
  const expirationDate = new Date(expiresAt);

  return expirationDate > now;
}
  
export async function getValidAccessToken(): Promise<string | null> {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    return null;
  }

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const expiresAtAccess = localStorage.getItem('expiresAtAccess');
  const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');

  const now = new Date();

  // Si le token est valide, le retourner
  if (accessToken && expiresAtAccess && new Date(expiresAtAccess) > now) {
    return accessToken; // ✅ toujours valide
  }

  // Vérifier si le refresh token est encore valide
  if (!refreshToken || !expiresAtRefresh || new Date(expiresAtRefresh) <= now) {
    // Refresh token expiré, il faut se reconnecter
    clearAuthData();
    return null;
  }

  // Si on n'a pas d'access token mais qu'on a un refresh token valide, essayer de faire un refresh
  if (!accessToken) {
    // Si un refresh est déjà en cours, attendre le résultat
    if (refreshPromise) {
      return refreshPromise;
    }

    // Créer une nouvelle promesse de refresh
    refreshPromise = performTokenRefresh(refreshToken, '');
    
    try {
      const result = await refreshPromise;
      return result;
    } finally {
      // Nettoyer la promesse une fois terminée
      refreshPromise = null;
    }
  }

  // Si un refresh est déjà en cours, attendre le résultat
  if (refreshPromise) {
    return refreshPromise;
  }

  // Créer une nouvelle promesse de refresh
  refreshPromise = performTokenRefresh(refreshToken, accessToken);

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    // Nettoyer la promesse une fois terminée
    refreshPromise = null;
  }
}

async function performTokenRefresh(refreshToken: string, accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken,
        accessToken: accessToken || '', // Permettre un access token vide
      }),
    });

    if (!res.ok) {
      // Tenter de lire le message d'erreur pour décider s'il faut vider les tokens
      let errorMessage = '';
      try {
        const data = await res.json();
        errorMessage = data?.message || '';
      } catch {
        // ignore parsing errors
      }

      if (res.status === 401 || res.status === 403) {
        // Si le serveur indique explicitement que le refresh token est invalide/expiré,
        // nettoyer immédiatement pour éviter les boucles de refresh.
        if (errorMessage.toLowerCase().includes('refresh token invalide') ||
            errorMessage.toLowerCase().includes('refresh token expir')) {
          clearAuthData();
        } else {
          // Comportement conservateur: en cas de 401/403 sans message clair,
          // on nettoie aussi pour éviter des boucles dues à une rotation déjà effectuée côté serveur.
          clearAuthData();
        }
      }

      // Pour les autres erreurs (5xx), ne pas vider le localStorage car temporaire
      return null;
    }

    const data = await res.json();

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('expiresAtAccess', data.expiresAtAccess);
    localStorage.setItem('expiresAtRefresh', data.expiresAtRefresh);

    return data.accessToken;
  } catch (error) {
    // En cas d'erreur réseau, ne pas vider le localStorage immédiatement
    // car cela peut être un problème temporaire de connectivité
    console.warn('Erreur réseau lors du refresh du token:', error);
    return null;
  }
}

/**
 * Nettoie toutes les données d'authentification du localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('expiresAtAccess');
  localStorage.removeItem('expiresAtRefresh');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userProfileCacheTime');
  localStorage.removeItem('lastAuthCheck');
}

/**
 * Redirige vers la page de connexion de manière sûre
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  
  // Éviter les redirections multiples
  if (window.location.pathname === '/login') return;
  
  window.location.href = '/login';
}
  
export function isUserLoggedIn(): boolean {
  const refreshToken = localStorage.getItem('refreshToken');
  const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');
  
  if (!refreshToken || !expiresAtRefresh) return false;
  
  const now = new Date();
  const refreshExpirationDate = new Date(expiresAtRefresh);
  
  // L'utilisateur est considéré comme connecté s'il a un refresh token valide
  // (même si l'access token est expiré, on peut le rafraîchir)
  return refreshExpirationDate > now;
}

/**
 * Vérifie si l'utilisateur doit être redirigé vers la page de login
 * (quand le refresh token est expiré)
 */
export function shouldRedirectToLogin(): boolean {
  if (typeof window === 'undefined') return false;
  
  const refreshToken = localStorage.getItem('refreshToken');
  const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');
  
  if (!refreshToken || !expiresAtRefresh) return true;
  
  const now = new Date();
  const refreshExpirationDate = new Date(expiresAtRefresh);
  
  return refreshExpirationDate <= now;
}

/**
 * Vérifie si le token va expirer bientôt et le rafraîchit si nécessaire
 * Ne rafraîchit que si le token expire dans les 2 prochaines minutes
 */
export async function checkAndRefreshTokenIfNeeded(): Promise<boolean> {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') return false;

  const accessToken = localStorage.getItem('accessToken');
  const expiresAtAccess = localStorage.getItem('expiresAtAccess');
  
  if (!accessToken || !expiresAtAccess) return false;
  
  const now = new Date();
  const expirationDate = new Date(expiresAtAccess);
  const timeUntilExpiry = expirationDate.getTime() - now.getTime();
  
  // Si le token expire dans moins de 2 minutes, le rafraîchir
  if (timeUntilExpiry < 2 * 60 * 1000) {
    try {
      const newToken = await getValidAccessToken();

      return newToken !== null;
    } catch (error) {
      // console.error('Erreur lors du rafraîchissement automatique du token:', error);

      return false;
    }
  }
  
  return true;
}

/**
 * Vérifie si une erreur est récupérable (problème temporaire de réseau/serveur)
 */
export function isRecoverableError(error: any): boolean {
  if (!error) return false;
  
  // Erreurs de réseau temporaires
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Erreurs de timeout
  if (error.name === 'AbortError') {
    return true;
  }
  
  // Erreurs 5xx (problèmes serveur temporaires)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  return false;
}


  
