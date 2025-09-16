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

  const now = new Date();

  if (accessToken && expiresAtAccess && new Date(expiresAtAccess) > now) {
    return accessToken; // ✅ toujours valide
  }

  // 🔄 Sinon, tenter le refresh
  if (!refreshToken || !accessToken) {
    return null;
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
        accessToken,
      }),
    });

    if (!res.ok) {
      // Seulement vider le localStorage pour les erreurs d'authentification (401, 403)
      if (res.status === 401 || res.status === 403) {
        clearAuthData();
      }
      // Pour les autres erreurs (500, 502, etc.), ne pas vider le localStorage
      // car cela peut être un problème temporaire de serveur

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
  const accessToken = localStorage.getItem('accessToken');
  const expiresAtAccess = localStorage.getItem('expiresAtAccess');
  
  if (!accessToken || !expiresAtAccess) return false;
  
  const now = new Date();
  const expirationDate = new Date(expiresAtAccess);
  
  return expirationDate > now;
}

/**
 * Vérifie si le token va expirer dans les 30 prochaines minutes
 * et le rafraîchit automatiquement si nécessaire
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
  
  // Si le token expire dans moins de 5 minutes, le rafraîchir
  if (timeUntilExpiry < 5 * 60 * 1000) {
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

/**
 * Fonction de debug pour vérifier l'état des tokens
 * Utile pour diagnostiquer les problèmes de déconnexion
 */
export function debugTokenState(): void {
  if (typeof window === 'undefined') {
    console.log('Debug token state: côté serveur');
    return;
  }

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const expiresAtAccess = localStorage.getItem('expiresAtAccess');
  const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');

  const now = new Date();
  const accessExpiry = expiresAtAccess ? new Date(expiresAtAccess) : null;
  const refreshExpiry = expiresAtRefresh ? new Date(expiresAtRefresh) : null;

  console.log('=== État des tokens ===');
  console.log('Access Token:', accessToken ? `${accessToken.substring(0, 10)}...` : 'Aucun');
  console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 10)}...` : 'Aucun');
  console.log('Access Token expire:', accessExpiry ? accessExpiry.toISOString() : 'Inconnu');
  console.log('Refresh Token expire:', refreshExpiry ? refreshExpiry.toISOString() : 'Inconnu');
  console.log('Access Token valide:', accessExpiry ? accessExpiry > now : false);
  console.log('Refresh Token valide:', refreshExpiry ? refreshExpiry > now : false);
  console.log('Temps restant access:', accessExpiry ? Math.round((accessExpiry.getTime() - now.getTime()) / 1000 / 60) + ' minutes' : 'N/A');
  console.log('======================');
}
  
