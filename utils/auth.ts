export function isRefreshTokenValid(): boolean {
  const refreshToken = localStorage.getItem('refreshToken');
  const expiresAt = localStorage.getItem('expiresAtRefresh');

  if (!refreshToken || !expiresAt) return false;

  const now = new Date();
  const expirationDate = new Date(expiresAt);

  return expirationDate > now;
}
  
export async function getValidAccessToken(): Promise<string | null> {
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
      // Vider le localStorage dans tous les cas d'erreur 401
      if (res.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('expiresAtAccess');
        localStorage.removeItem('expiresAtRefresh');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userProfileCacheTime');
        
        // Rediriger vers la page de connexion
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      return null;
    }

    const data = await res.json();

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('expiresAtAccess', data.expiresAtAccess);
    localStorage.setItem('expiresAtRefresh', data.expiresAtRefresh);

    return data.accessToken;
  } catch {
    // En cas d'erreur réseau, vider le localStorage et rediriger
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAtAccess');
    localStorage.removeItem('expiresAtRefresh');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userProfileCacheTime');
    
    // Rediriger vers la page de connexion
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return null;
  }
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
  const accessToken = localStorage.getItem('accessToken');
  const expiresAtAccess = localStorage.getItem('expiresAtAccess');
  
  if (!accessToken || !expiresAtAccess) return false;
  
  const now = new Date();
  const expirationDate = new Date(expiresAtAccess);
  const timeUntilExpiry = expirationDate.getTime() - now.getTime();
  
  // Si le token expire dans moins de 30 minutes, le rafraîchir
  if (timeUntilExpiry < 30 * 60 * 1000) {
    // console.log('Token expire bientôt, rafraîchissement automatique...');
    const newToken = await getValidAccessToken();

    return newToken !== null;
  }
  
  return true;
}
  
