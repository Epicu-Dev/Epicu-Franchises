"use client";

import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Layout simple pour les pages publiques (login, signup, etc.)
 * Pas de vérification d'authentification
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-page-bg dark:bg-black">
      {children}
    </div>
  );
}
