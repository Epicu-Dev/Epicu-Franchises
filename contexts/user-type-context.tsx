"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserType = "admin" | "franchise";

interface UserTypeContextType {
  userType: UserType;
  setUserType: (type: UserType) => void;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType>("admin");
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le type d'utilisateur depuis localStorage au montage
  useEffect(() => {
    const savedUserType = localStorage.getItem("userType") as UserType;
    if (savedUserType && (savedUserType === "admin" || savedUserType === "franchise")) {
      setUserTypeState(savedUserType);
    }
    setIsLoaded(true);
  }, []);

  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    localStorage.setItem("userType", type);
  };

  // Ne pas rendre les enfants tant que le localStorage n'est pas chargé
  if (!isLoaded) {
    return null;
  }

  return (
    <UserTypeContext.Provider value={{ userType, setUserType }}>
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (context === undefined) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
}
