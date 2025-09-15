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
      // Vider le localStorage si le refresh token est invalide
      const errorData = await res.json().catch(() => ({}));
      if (errorData.message === 'Refresh token invalide' || errorData.message === 'Refresh token expiré') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('expiresAtAccess');
        localStorage.removeItem('expiresAtRefresh');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userProfileCacheTime');
      }

      return null;
    }

    const data = await res.json();

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('expiresAtAccess', data.expiresAtAccess);
    localStorage.setItem('expiresAtRefresh', data.expiresAtRefresh);

    return data.accessToken;
  } catch (err) {
    console.error('Erreur lors du refresh token :', err);
    // Ne pas vider le localStorage immédiatement, laisser le dashboard-layout gérer
    // console.warn('Erreur réseau lors du refresh, mais on ne vide pas le localStorage');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAtAccess');
    localStorage.removeItem('expiresAtRefresh');
    
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
  
