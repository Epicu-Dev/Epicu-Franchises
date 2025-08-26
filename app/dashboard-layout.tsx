'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isRefreshTokenValid } from '@/utils/auth';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { HelpModal } from '@/components/help-modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken || !isRefreshTokenValid()) {
      router.push('/login');
    } else {
      // setEmail(userEmail); // This line was removed as per the edit hint
    }
  }, [router]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });

    localStorage.clear();
    router.push('/login');
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