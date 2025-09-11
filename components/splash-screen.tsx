"use client";

import { Spinner } from "@heroui/spinner";
import Image from "next/image";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo EPICU */}
        <div className="relative">
          <Image
            priority
            alt="EPICU Logo"
            className="animate-pulse"
            height={120}
            src="/images/logo.png"
            width={120}
          />
        </div>
        
        {/* Texte de chargement */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            EPICU
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chargement de votre espace...
          </p>
        </div>
        
        {/* Spinner de chargement */}
        <div className="flex items-center space-x-2">
          <Spinner color="primary" size="sm" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Initialisation
          </span>
        </div>
      </div>
    </div>
  );
}
