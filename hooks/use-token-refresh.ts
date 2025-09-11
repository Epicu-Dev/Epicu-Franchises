import { useEffect } from 'react';
import { checkAndRefreshTokenIfNeeded } from '../utils/auth';

/**
 * Hook qui vérifie et rafraîchit automatiquement les tokens toutes les 10 minutes
 */
export function useTokenRefresh() {
  useEffect(() => {
    // Vérifier immédiatement
    checkAndRefreshTokenIfNeeded();

    // Puis vérifier toutes les 10 minutes
    const interval = setInterval(() => {
      checkAndRefreshTokenIfNeeded();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, []);
}
