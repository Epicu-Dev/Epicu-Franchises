"use client";

import { SplashScreen } from "./splash-screen";

import { useLoading } from "@/contexts/loading-context";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { isLoading } = useLoading();

  if (isLoading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
