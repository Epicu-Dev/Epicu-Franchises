import { useEffect, useRef } from 'react';

import { checkAndRefreshTokenIfNeeded } from '../utils/auth';

/**
 * Hook qui vérifie et rafraîchit automatiquement les tokens
 * - Vérification immédiate au montage
 * - Vérification toutes les 10 minutes (réduit de 5 à 10 pour éviter les conflits)
 * - Vérification avant expiration (30 minutes avant)
 */
export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef<boolean>(false);

  const safeCheckAndRefresh = async () => {
    // Éviter les vérifications multiples simultanées
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    try {
      await checkAndRefreshTokenIfNeeded();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Erreur lors de la vérification automatique du token:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // Vérifier immédiatement
    safeCheckAndRefresh();

    // Vérifier toutes les 10 minutes (réduit pour éviter les conflits)
    intervalRef.current = setInterval(() => {
      safeCheckAndRefresh();
    }, 10 * 60 * 1000); // 10 minutes

    // Vérifier avant expiration (30 minutes avant)
    const checkBeforeExpiry = () => {
      const expiresAtAccess = localStorage.getItem('expiresAtAccess');

      if (expiresAtAccess) {
        const now = Date.now();
        const expiryTime = new Date(expiresAtAccess).getTime();
        const timeUntilExpiry = expiryTime - now;
        
        // Si le token expire dans moins de 5 minutes, programmer une vérification
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          timeoutRef.current = setTimeout(() => {
            safeCheckAndRefresh();
            checkBeforeExpiry(); // Reprogrammer pour le prochain cycle
          }, Math.max(timeUntilExpiry - 5 * 60 * 1000, 0)); // 5 minutes avant expiration, minimum 0
        }
      }
    };

    checkBeforeExpiry();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
