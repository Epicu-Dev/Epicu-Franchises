import { getValidAccessToken, clearAuthData, redirectToLogin } from '../utils/auth';

export const useAuthFetch = () => {
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    try {
      const token = await getValidAccessToken();

      if (!token) {
        clearAuthData();
        redirectToLogin();
        throw new Error('No access token available');
      }

      const headers = new Headers((init?.headers as HeadersInit) || {});
      headers.set('Authorization', `Bearer ${token}`);
      
      const merged: RequestInit = { ...init, headers };
      const response = await fetch(input, merged);

      // Si la réponse est 401, nettoyer et rediriger
      if (response.status === 401) {
        clearAuthData();
        redirectToLogin();
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      // Si c'est une erreur de réseau ou autre, ne pas rediriger automatiquement
      if (error instanceof Error && error.message === 'Authentication failed') {
        throw error;
      }
      
      // Pour les autres erreurs, essayer de rafraîchir le token une fois
      try {
        const refreshedToken = await getValidAccessToken();
        if (refreshedToken) {
          const headers = new Headers((init?.headers as HeadersInit) || {});
          headers.set('Authorization', `Bearer ${refreshedToken}`);
          const merged: RequestInit = { ...init, headers };

          return fetch(input, merged);
        }
      } catch {
        // Si le refresh échoue aussi, laisser l'erreur originale
      }
      
      throw error;
    }
  };

  return { authFetch };
};
