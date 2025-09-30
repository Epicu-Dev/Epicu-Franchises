"use client";

import { useEffect, useState } from 'react';
import { isRefreshTokenValid, getValidAccessToken, clearAuthData, redirectToLogin } from '@/utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Vérifier si on est côté client
        if (typeof window === 'undefined') {
          setIsChecking(false);
          return;
        }

        const refreshToken = localStorage.getItem('refreshToken');
        const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');

        // Si pas de refresh token, déconnecté
        if (!refreshToken || !expiresAtRefresh) {
          clearAuthData();
          redirectToLogin();
          return;
        }

        // Vérifier la validité du refresh token
        if (!isRefreshTokenValid()) {
          clearAuthData();
          redirectToLogin();
          return;
        }

        // Vérifier la validité de l'access token et le rafraîchir si nécessaire
        const validToken = await getValidAccessToken();
        
        if (!validToken) {
          clearAuthData();
          redirectToLogin();
          return;
        }

        // Si on arrive ici, l'utilisateur est authentifié
        setIsChecking(false);
      } catch (error) {
        console.error('Erreur lors de la vérification d\'authentification:', error);
        clearAuthData();
        redirectToLogin();
      }
    };

    checkAuthentication();
  }, []);

  // Afficher un indicateur de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
