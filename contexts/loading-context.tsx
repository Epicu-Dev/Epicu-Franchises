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
      // Vérifier si on a déjà un profil en cache pour éviter le délai
      const cachedProfile = localStorage.getItem('userProfile');
      const cacheTime = localStorage.getItem('userProfileCacheTime');
      
      // Si on a un profil en cache récent (moins de 5 minutes), on charge immédiatement
      if (cachedProfile && cacheTime && (Date.now() - parseInt(cacheTime) < 300000)) {
        setIsLoading(false);
        setUserProfileLoaded(true);
      } else {
        // Petit délai pour une transition plus fluide seulement si pas de cache
        const timer = setTimeout(() => {
          setIsLoading(false);
          setUserProfileLoaded(true);
        }, 100); // Réduit encore plus le délai
        
        return () => clearTimeout(timer);
      }
    }
  }, [userLoading]);

  // Timeout de sécurité pour éviter le chargement infini
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (userLoading) {
        setIsLoading(false);
        setUserProfileLoaded(true);
      }
    }, 5000); // Réduit de 10 secondes à 5 secondes
    
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
