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
          // Vérifier si le refresh token est encore valide avant de déconnecter
          const refreshToken = localStorage.getItem('refreshToken');
          const expiresAtRefresh = localStorage.getItem('expiresAtRefresh');
          
          if (!refreshToken || !expiresAtRefresh || new Date(expiresAtRefresh) <= new Date()) {
            // Le refresh token est vraiment expiré, on peut déconnecter
            clearAuthData();
            redirectToLogin();
            return;
          } else {
            // Le refresh token est encore valide, c'est probablement un problème temporaire
            console.warn('Impossible d\'obtenir un token valide, mais refresh token encore valide. Problème temporaire probable.');
            // Ne pas déconnecter, juste attendre et réessayer
            setTimeout(() => {
              window.location.reload();
            }, 5000); // Recharger la page dans 5 secondes
            return;
          }
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
