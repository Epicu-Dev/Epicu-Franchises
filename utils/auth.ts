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
      localStorage.clear();
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
    localStorage.clear();
    return null;
  }
}
  