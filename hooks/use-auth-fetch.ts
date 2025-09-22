import { getValidAccessToken, clearAuthData, redirectToLogin } from '../utils/auth';

export const useAuthFetch = () => {
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    try {
      let token = await getValidAccessToken();

      if (!token) {
        clearAuthData();
        redirectToLogin();
        throw new Error('No access token available');
      }

      const headers = new Headers((init?.headers as HeadersInit) || {});

      headers.set('Authorization', `Bearer ${token}`);

      const merged: RequestInit = { ...init, headers };
      const response = await fetch(input, merged);

      // Si la réponse est 401, essayer de rafraîchir le token une seule fois
      if (response.status === 401) {
        try {
          const refreshedToken = await getValidAccessToken();

          if (refreshedToken && refreshedToken !== token) {
            // Si on a un nouveau token, réessayer la requête une seule fois
            const newHeaders = new Headers((init?.headers as HeadersInit) || {});
            newHeaders.set('Authorization', `Bearer ${refreshedToken}`);
            const newMerged: RequestInit = { ...init, headers: newHeaders };
            const retryResponse = await fetch(input, newMerged);

            // Si la retry réussit, retourner la réponse
            if (retryResponse.status !== 401) {
              return retryResponse;
            }
          }
        } catch (refreshError) {
          // eslint-disable-next-line no-console
          console.warn('Échec du refresh du token:', refreshError);
        }

        // Si on arrive ici, c'est que le refresh a échoué
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
      
      // Pour les autres erreurs, ne pas essayer de refresh automatiquement
      // car getValidAccessToken a déjà géré le refresh si nécessaire
      throw error;
    }
  };

  return { authFetch };
};
