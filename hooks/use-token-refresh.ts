import { useEffect, useRef } from 'react';
import { checkAndRefreshTokenIfNeeded } from '../utils/auth';

/**
 * Hook qui vérifie et rafraîchit automatiquement les tokens
 * - Vérification immédiate au montage
 * - Vérification toutes les 5 minutes
 * - Vérification avant expiration (30 minutes avant)
 */
export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Vérifier immédiatement
    checkAndRefreshTokenIfNeeded();

    // Vérifier toutes les 5 minutes
    intervalRef.current = setInterval(() => {
      checkAndRefreshTokenIfNeeded();
    }, 5 * 60 * 1000); // 5 minutes

    // Vérifier avant expiration (30 minutes avant)
    const checkBeforeExpiry = () => {
      const expiresAtAccess = localStorage.getItem('expiresAtAccess');
      if (expiresAtAccess) {
        const now = Date.now();
        const expiryTime = new Date(expiresAtAccess).getTime();
        const timeUntilExpiry = expiryTime - now;
        
        // Si le token expire dans moins de 30 minutes, programmer une vérification
        if (timeUntilExpiry < 30 * 60 * 1000 && timeUntilExpiry > 0) {
          timeoutRef.current = setTimeout(() => {
            checkAndRefreshTokenIfNeeded();
            checkBeforeExpiry(); // Reprogrammer pour le prochain cycle
          }, timeUntilExpiry - 5 * 60 * 1000); // 5 minutes avant expiration
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
