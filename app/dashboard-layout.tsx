'use client';

import { useState } from 'react';

import { useTokenRefresh } from '@/hooks/use-token-refresh';
import { AuthGuard } from '@/components/auth-guard';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { HelpModal } from '@/components/help-modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Activer le rafraîchissement automatique des tokens
  useTokenRefresh();

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      // Déconnexion des tokens d'authentification principaux
      if (accessToken && refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, refreshToken }),
        });
      }

      // Déconnexion des tokens Google Calendar
      try {
        await fetch('/api/google-calendar/disconnect', {
          method: 'POST',
        });
      } catch (error) {
        // Erreur silencieuse pour la déconnexion Google (peut ne pas être connecté)
        console.warn('Erreur lors de la déconnexion Google Calendar:', error);
      }
    } catch {
      // Erreur silencieuse lors de la déconnexion
    } finally {
      // Le AuthGuard gérera la redirection
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-page-bg dark:bg-black">
        {/* Sidebar */}
        <Sidebar onHelpClick={handleHelpClick} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
          {/* Header */}
          <Header />

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-6 pt-6 md:pt-20 md:pt-6 bg-page-bg dark:bg-black ">
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
    </AuthGuard>
  );
} 