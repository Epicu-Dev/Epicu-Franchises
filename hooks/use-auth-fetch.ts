import { getValidAccessToken, shouldRedirectToLogin, clearAuthData, redirectToLogin } from '../utils/auth';

export const useAuthFetch = () => {
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    try {
      // Vérifier d'abord si on doit rediriger vers login (refresh token expiré)
      if (shouldRedirectToLogin()) {
        clearAuthData();
        redirectToLogin();
        throw new Error('Refresh token expired, please login again');
      }

      // Obtenir un token valide (refresh automatique si nécessaire)
      const token = await getValidAccessToken();

      if (!token) {
        // Si on arrive ici, c'est que le refresh a échoué
        clearAuthData();
        redirectToLogin();
        throw new Error('No access token available');
      }

      const headers = new Headers((init?.headers as HeadersInit) || {});
      headers.set('Authorization', `Bearer ${token}`);

      const merged: RequestInit = { ...init, headers };
      const response = await fetch(input, merged);

      // Si la réponse est 401, cela signifie que le token n'est plus valide côté serveur
      // Dans ce cas, on nettoie tout et on redirige vers login
      if (response.status === 401) {
        clearAuthData();
        redirectToLogin();
        throw new Error('Authentication failed - token invalid on server');
      }

      return response;
    } catch (error) {
      // Si c'est une erreur d'authentification, la laisser remonter
      if (error instanceof Error && (
        error.message === 'Refresh token expired, please login again' ||
        error.message === 'No access token available' ||
        error.message === 'Authentication failed - token invalid on server'
      )) {
        throw error;
      }
      
      // Pour les autres erreurs (réseau, etc.), les laisser remonter aussi
      throw error;
    }
  };

  return { authFetch };
};
