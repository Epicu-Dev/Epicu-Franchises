import { useEffect, useState } from 'react';
import globalImageCache from '@/utils/image-cache';

/**
 * Hook qui utilise le cache global persistant pour les images
 * Ce hook ne réinitialise jamais le cache, évitant ainsi le rechargement des icônes
 */
export function useGlobalImageCache() {
  const [isInitialized, setIsInitialized] = useState(globalImageCache.getIsInitialized());
  const [cachedImagesCount, setCachedImagesCount] = useState(globalImageCache.getCachedImagesCount());

  useEffect(() => {
    // Initialiser le cache seulement s'il ne l'est pas déjà
    if (!isInitialized) {
      globalImageCache.initialize().then(() => {
        setIsInitialized(true);
        setCachedImagesCount(globalImageCache.getCachedImagesCount());
      });
    }
  }, [isInitialized]);

  return {
    isImageCached: (src: string) => globalImageCache.isImageCached(src),
    cachedImagesCount,
    isInitialized,
    preloadImage: (src: string) => globalImageCache.preloadSpecificImage(src),
  };
}
