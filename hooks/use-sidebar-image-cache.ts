import { useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour gérer le cache des images de la sidebar
 * Précharge les images et les met en cache pour améliorer les performances
 */
export function useSidebarImageCache() {
  const cacheRef = useRef<Set<string>>(new Set());

  const imagePaths = [
    "/images/icones/Nav/Accueil.svg",
    "/images/icones/Nav/Data.svg",
    "/images/icones/Nav/Clients.svg",
    "/images/icones/Nav/Prospects.svg",
    "/images/icones/Nav/Agenda.svg",
    "/images/icones/Nav/To-do.svg",
    "/images/icones/Nav/Facturation.svg",
    "/images/icones/Nav/Equipe.svg",
    "/images/icones/Nav/Studio.svg",
    "/images/icones/Nav/Ressources.svg",
    "/images/icones/Nav/Compte.svg",
    "/images/icones/Nav/Aide.svg",
    "/images/icones/Nav/Deconnexion.svg",
    "/images/logo-e.png"
  ];

  useEffect(() => {
    // Préchargement des images avec gestion du cache
    imagePaths.forEach((src) => {
      if (!cacheRef.current.has(src)) {
        const img = new window.Image();
        img.onload = () => {
          cacheRef.current.add(src);
        };
        img.onerror = () => {
          console.warn(`Impossible de charger l'image: ${src}`);
        };
        img.src = src;
      }
    });
  }, []);

  return {
    isImageCached: (src: string) => cacheRef.current.has(src),
    cachedImagesCount: cacheRef.current.size,
  };
}
