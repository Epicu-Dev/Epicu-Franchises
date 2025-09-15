'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isRefreshTokenValid, isUserLoggedIn, getValidAccessToken } from '@/utils/auth';
import { useTokenRefresh } from '@/hooks/use-token-refresh';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { HelpModal } from '@/components/help-modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Activer le rafraîchissement automatique des tokens
  useTokenRefresh();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier d'abord si l'authentification a déjà été vérifiée récemment
        const lastAuthCheck = localStorage.getItem('lastAuthCheck');
        const now = Date.now();

        // Si la vérification a été faite il y a moins de 30 secondes, on skip
        if (lastAuthCheck && (now - parseInt(lastAuthCheck)) < 30000) {
          setIsAuthChecking(false);

          return;
        }

        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken || !refreshToken) {
          router.push('/login');

          return;
        }

        if (!isRefreshTokenValid()) {
          localStorage.clear();
          router.push('/login');

          return;
        }

        if (!isUserLoggedIn()) {
          // Essayer de rafraîchir le token avant de rediriger
          const refreshedToken = await getValidAccessToken();

          if (!refreshedToken) {
            localStorage.clear();
            router.push('/login');

            return;
          }
        }

        // Vérifier que le profil utilisateur est présent (optionnel)
        const userProfile = localStorage.getItem('userProfile');

        if (!userProfile) {
          // Ne pas rediriger, laisser le UserContext gérer le rechargement du profil
        }

        // Marquer la vérification comme faite
        localStorage.setItem('lastAuthCheck', now.toString());
        setIsAuthChecking(false);
      } catch {
        localStorage.clear();
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, refreshToken }),
        });
      }
    } catch {
      // Erreur silencieuse lors de la déconnexion
    } finally {
      localStorage.clear();
      router.push('/login');
    }
  };

  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-page-bg dark:bg-black">
      {/* Sidebar */}
      <Sidebar onHelpClick={handleHelpClick} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Header */}
        <Header />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6 pt-20 md:pt-6 bg-page-bg dark:bg-black ">
          <div className="max-w-7xl mx-auto">
            {!isAuthChecking && children}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onOpenChange={setIsHelpModalOpen}
      />
    </div>
  );
} 