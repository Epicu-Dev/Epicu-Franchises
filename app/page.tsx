"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isUserLoggedIn } from "@/utils/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier l'état de connexion côté client
    const checkAuthStatus = () => {
      if (isUserLoggedIn()) {
        // Utilisateur connecté, rediriger vers /home
        router.push("/home");
      } else {
        // Utilisateur non connecté, rediriger vers /login
        router.push("/login");
      }
    };

    // Exécuter la vérification après le montage du composant
    checkAuthStatus();
  }, [router]);

  // Afficher un message de chargement pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}
