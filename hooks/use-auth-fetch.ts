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
        // Vérifier si le refresh token est encore valide avant de déconnecter
        const refreshToken = localStorage.getItem('refreshToken');
        const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');
        
        if (!refreshToken || !expiresAtRefresh || new Date(expiresAtRefresh) <= new Date()) {
          // Le refresh token est vraiment expiré, on peut déconnecter
          clearAuthData();
          redirectToLogin();
          throw new Error('No access token available - refresh token expired');
        } else {
          // Le refresh token est encore valide, c'est probablement un problème temporaire
          console.warn('Impossible d\'obtenir un token valide, mais refresh token encore valide. Problème temporaire probable.');
          throw new Error('No access token available - temporary issue');
        }
      }

      const headers = new Headers((init?.headers as HeadersInit) || {});
      headers.set('Authorization', `Bearer ${token}`);

      const merged: RequestInit = { ...init, headers };
      const response = await fetch(input, merged);

      // Si la réponse est 401, vérifier si c'est vraiment un problème d'authentification
      if (response.status === 401) {
        // Vérifier si le refresh token est encore valide avant de déconnecter
        const refreshToken = localStorage.getItem('refreshToken');
        const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');
        
        if (!refreshToken || !expiresAtRefresh || new Date(expiresAtRefresh) <= new Date()) {
          // Le refresh token est vraiment expiré, on peut déconnecter
          clearAuthData();
          redirectToLogin();
          throw new Error('Authentication failed - refresh token expired');
        } else {
          // Le refresh token est encore valide, c'est probablement un problème temporaire
          console.warn('Erreur 401 de l\'API, mais refresh token encore valide. Problème temporaire probable.');
          throw new Error('Authentication failed - token invalid on server (temporary)');
        }
      }

      return response;
    } catch (error) {
      // Si c'est une erreur d'authentification, la laisser remonter
      if (error instanceof Error && (
        error.message === 'Refresh token expired, please login again' ||
        error.message === 'No access token available' ||
        error.message === 'Authentication failed - token invalid on server' ||
        error.message === 'Authentication failed - refresh token expired'
      )) {
        throw error;
      }
      
      // Pour les autres erreurs (réseau, etc.), les laisser remonter aussi
      throw error;
    }
  };

  return { authFetch };
};
