'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isRefreshTokenValid, isUserLoggedIn } from '@/utils/auth';
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken || !refreshToken) {
          console.log('Tokens manquants, redirection vers login');
          router.push('/login');
          return;
        }

        if (!isRefreshTokenValid()) {
          console.log('Refresh token expiré, redirection vers login');
          localStorage.clear();
          router.push('/login');
          return;
        }

        if (!isUserLoggedIn()) {
          console.log('Access token expiré, redirection vers login');
          localStorage.clear();
          router.push('/login');
          return;
        }

        // Vérifier que le profil utilisateur est présent
        const userProfile = localStorage.getItem('userProfile');
        if (!userProfile) {
          console.log('Profil utilisateur manquant, redirection vers login');
          localStorage.clear();
          router.push('/login');
          return;
        }

        setIsAuthChecking(false);
      } catch (error) {
        console.error('Erreur lors de la vérification d\'authentification:', error);
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
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.clear();
      router.push('/login');
    }
  };

  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  // Afficher un loader pendant la vérification d'authentification
  if (isAuthChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-page-bg dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

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
            {children}
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