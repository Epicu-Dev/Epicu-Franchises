import { useEffect } from 'react';

import { checkAndRefreshTokenIfNeeded } from '../utils/auth';

/**
 * Hook qui vérifie et rafraîchit automatiquement les tokens
 * - Vérification immédiate au montage seulement
 * - Le refresh se fait uniquement lors des appels API via useAuthFetch
 */
export function useTokenRefresh() {
  useEffect(() => {
    // Vérifier immédiatement au montage seulement
    checkAndRefreshTokenIfNeeded().catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('Erreur lors de la vérification initiale du token:', error);
    });
  }, []);
}
