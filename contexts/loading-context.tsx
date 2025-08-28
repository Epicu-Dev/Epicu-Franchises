"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './user-context';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  userProfileLoaded: boolean;
  setUserProfileLoaded: (loaded: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);
  const { isLoading: userLoading } = useUser();

  // L'application est considérée comme chargée quand le profil utilisateur est chargé
  useEffect(() => {
    if (!userLoading) {
      // Petit délai pour une transition plus fluide
      const timer = setTimeout(() => {
        setIsLoading(false);
        setUserProfileLoaded(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [userLoading]);

  // Timeout de sécurité pour éviter le chargement infini
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (userLoading) {
        console.log('Timeout de sécurité - arrêt du loading');
        setIsLoading(false);
        setUserProfileLoaded(true);
      }
    }, 10000); // 10 secondes de timeout
    
    return () => clearTimeout(safetyTimer);
  }, [userLoading]);

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setIsLoading, 
      userProfileLoaded, 
      setUserProfileLoaded 
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);

  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  return context;
}
