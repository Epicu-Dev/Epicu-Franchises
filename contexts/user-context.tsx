"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { UserProfile, UserType } from '../types/user';
import { getValidAccessToken } from '../utils/auth';

interface UserContextType {
  userProfile: UserProfile | null;
  userType: UserType;
  isLoading: boolean;
  error: string | null;
  refreshUserProfile: () => Promise<void>;
  setUserType: (type: UserType) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserTypeState] = useState<UserType>("franchise");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le type d'utilisateur depuis localStorage au montage
  useEffect(() => {
    const savedUserType = localStorage.getItem("userType") as UserType;

    if (savedUserType && (savedUserType === "admin" || savedUserType === "franchise")) {
      setUserTypeState(savedUserType);
    }
    
    // Charger immédiatement le profil utilisateur depuis le localStorage
    const cachedProfile = localStorage.getItem('userProfile');

    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);

        setUserProfile(parsed);
        // Ne pas marquer comme chargé pour permettre la mise à jour via l'API
      } catch (e) {
        // Erreur lors du parsing du profil en cache, on continue
      }
    }
    
    setIsLoaded(true);
  }, []);

  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    localStorage.setItem("userType", type);
  };

  const clearUserData = () => {
    setUserProfile(null);
    setError(null);
    localStorage.removeItem('userProfile');
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const accessToken = await getValidAccessToken();

      if (!accessToken) {
        setError('Token d\'accès non trouvé');
        setIsLoading(false);

        return;
      }

      // Toujours faire un appel API pour s'assurer d'avoir les données les plus récentes
      // Ajouter un timestamp pour éviter le cache
      const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données utilisateur');
      }

      const userData = await response.json();

      // Transformer les données Airtable en format UserProfile
      const transformedProfile: UserProfile = {
        id: userData.id,
        email: userData['Email perso'] || '',
        firstname: userData['Prénom'] || '',
        lastname: userData['Nom'] || '',
        role: userData['Rôle'] || '',
        villes: userData['villes'] || [],
        telephone: userData['Téléphone'] || '',
        identifier: userData['Identifiant'] || '',
        trombi: userData['Trombi'] || undefined
      };

      setUserProfile(transformedProfile);
      
      // Mettre en cache les données utilisateur avec un cache plus court (5 minutes)
      localStorage.setItem('userProfile', JSON.stringify(transformedProfile));
      localStorage.setItem('userProfileCacheTime', Date.now().toString());
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      
      // En cas d'erreur, utiliser les données en cache si elles existent et ne sont pas trop vieilles
      const cachedProfile = localStorage.getItem('userProfile');
      const cacheTime = localStorage.getItem('userProfileCacheTime');
      
      if (cachedProfile && cacheTime) {
        try {
          const parsed = JSON.parse(cachedProfile);

          // Utiliser le cache seulement s'il a moins de 30 minutes
          if (Date.now() - parseInt(cacheTime) < 1800000) {
            setUserProfile(parsed);
          }
        } catch {
          // Cache invalide, on ne fait rien
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    // Supprimer le cache pour forcer un nouveau fetch
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userProfileCacheTime');
    
    // Forcer un rechargement immédiat
    setIsLoading(true);
    await fetchUserProfile();
  };

  // Charger le profil utilisateur au montage
  useEffect(() => {
    if (isLoaded) {
      // Vérifier si on a déjà un profil en cache récent
      const cachedProfile = localStorage.getItem('userProfile');
      const cacheTime = localStorage.getItem('userProfileCacheTime');
      
      // Si on a un profil en cache récent (moins de 5 minutes), on ne fait pas d'appel API
      if (cachedProfile && cacheTime && (Date.now() - parseInt(cacheTime) < 300000)) {
        setIsLoading(false);
        return;
      }
      
      fetchUserProfile();
    }
  }, [isLoaded]);

  // Ne pas rendre les enfants tant que le localStorage n'est pas chargé
  if (!isLoaded) {
    return null;
  }

  return (
    <UserContext.Provider value={{ 
      userProfile, 
      userType, 
      isLoading, 
      error, 
      refreshUserProfile, 
      setUserType, 
      clearUserData 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
