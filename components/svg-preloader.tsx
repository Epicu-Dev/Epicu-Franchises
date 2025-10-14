"use client";

import { useEffect, useState } from 'react';
import { useGlobalImageCache } from '@/hooks/use-global-image-cache';

/**
 * Composant invisible qui force le préchargement de tous les SVG
 * Utilisé pour s'assurer que les icônes sont disponibles immédiatement
 */
export function SvgPreloader() {
  const { cachedImagesCount, isImageCached } = useGlobalImageCache();
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    // Vérifier si toutes les images critiques sont chargées
    const criticalImages = [
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
    ];

    const checkPreloading = () => {
      const allCriticalLoaded = criticalImages.every(src => isImageCached(src));
      if (allCriticalLoaded) {
        setIsPreloading(false);
      }
    };

    // Vérifier immédiatement
    checkPreloading();

    // Vérifier périodiquement si pas encore chargé
    const interval = setInterval(checkPreloading, 100);

    // Nettoyer l'intervalle après 5 secondes maximum
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsPreloading(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isImageCached]);

  // Composant invisible qui force le rendu pour déclencher le préchargement
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: 0, 
        height: 0, 
        opacity: 0, 
        pointerEvents: 'none',
        zIndex: -1
      }}
      aria-hidden="true"
    >
      {/* Force le préchargement en rendant les images invisibles */}
      {isPreloading && (
        <>
          <img src="/images/icones/Nav/Accueil.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Data.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Clients.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Prospects.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Agenda.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/To-do.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Facturation.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Equipe.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Studio.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Ressources.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Compte.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Aide.svg" alt="" loading="eager" />
          <img src="/images/icones/Nav/Deconnexion.svg" alt="" loading="eager" />
          <img src="/images/icones/Home-franchisé/abonnes.svg" alt="" loading="eager" />
          <img src="/images/icones/Home-franchisé/conversion.svg" alt="" loading="eager" />
          <img src="/images/icones/Home-franchisé/prospects.svg" alt="" loading="eager" />
          <img src="/images/icones/Home-franchisé/vues.svg" alt="" loading="eager" />
        </>
      )}
    </div>
  );
}
