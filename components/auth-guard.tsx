"use client";

import { useEffect } from 'react';
import { isRefreshTokenValid, isUserLoggedIn, getValidAccessToken, clearAuthData, redirectToLogin } from '@/utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Vérifier si on est côté client
        if (typeof window === 'undefined') {
          return;
        }

        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Si pas de tokens, déconnecté
        if (!accessToken || !refreshToken) {
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

        // Vérifier la validité de l'access token
        if (!isUserLoggedIn()) {
          // Essayer de rafraîchir le token
          const refreshedToken = await getValidAccessToken();
          
          if (!refreshedToken) {
            clearAuthData();
            redirectToLogin();
            return;
          }
        }

        // Si on arrive ici, l'utilisateur est authentifié
        // Pas besoin de faire quoi que ce soit, le contenu s'affiche normalement
      } catch (error) {
        // console.error('Erreur lors de la vérification d\'authentification:', error);
        clearAuthData();
        redirectToLogin();
      }
    };

    checkAuthentication();
  }, []);

  // Toujours afficher le contenu, la vérification se fait en arrière-plan
  return <>{children}</>;
}
