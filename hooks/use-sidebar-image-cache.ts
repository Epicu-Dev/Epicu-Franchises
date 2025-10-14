import { useEffect, useRef, useState } from 'react';

/**
 * Hook personnalisé pour gérer le cache de toutes les images SVG de l'application
 * Précharge les images et les met en cache pour améliorer les performances
 * Optimisé pour le chargement prioritaire des SVG
 */
export function useSidebarImageCache() {
  const cacheRef = useRef<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const imagePaths = [
    // Icônes de navigation
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
    
    // Icônes pour la page d'accueil admin
    "/images/icones/Home-admin/abonnes.svg",
    "/images/icones/Home-admin/chiffre-affaires.svg",
    "/images/icones/Home-admin/clients.svg",
    "/images/icones/Home-admin/franchises.svg",
    "/images/icones/Home-admin/posts.svg",
    "/images/icones/Home-admin/prospects.svg",
    "/images/icones/Home-admin/studio.svg",
    "/images/icones/Home-admin/vues.svg",
    
    // Icônes pour la page d'accueil franchisé
    "/images/icones/Home-franchisé/abonnes.svg",
    "/images/icones/Home-franchisé/conversion.svg",
    "/images/icones/Home-franchisé/prospects.svg",
    "/images/icones/Home-franchisé/vues.svg",
    
    // Logo
    "/images/logo-e.png"
  ];

  useEffect(() => {
    // Préchargement immédiat et agressif des images avec priorité
    const preloadImages = async () => {
      // Charger les images critiques en premier (navigation et icônes principales)
      const criticalImages = imagePaths.slice(0, 13); // Icônes de navigation
      const otherImages = imagePaths.slice(13); // Autres icônes
      
      // Charger les images critiques avec priorité maximale
      const criticalPromises = criticalImages.map((src) => {
        if (!cacheRef.current.has(src)) {
          return new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              cacheRef.current.add(src);
              resolve();
            };
            img.onerror = () => {
              console.warn(`Impossible de charger l'image critique: ${src}`);
              resolve();
            };
            // Chargement prioritaire pour les images critiques
            img.loading = 'eager';
            img.src = src;
          });
        }
        return Promise.resolve();
      });
      
      // Charger les autres images en parallèle
      const otherPromises = otherImages.map((src) => {
        if (!cacheRef.current.has(src)) {
          return new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              cacheRef.current.add(src);
              resolve();
            };
            img.onerror = () => {
              console.warn(`Impossible de charger l'image: ${src}`);
              resolve();
            };
            img.src = src;
          });
        }
        return Promise.resolve();
      });
      
      // Charger d'abord les images critiques, puis les autres
      await Promise.all(criticalPromises);
      await Promise.all(otherPromises);
      
      setIsInitialized(true);
    };

    preloadImages();
  }, []);

  return {
    isImageCached: (src: string) => cacheRef.current.has(src),
    cachedImagesCount: cacheRef.current.size,
    isInitialized,
  };
}
