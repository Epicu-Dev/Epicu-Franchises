# Cache Global Persistant pour la Sidebar

Ce document décrit le système de cache global persistant implémenté pour optimiser les performances de la sidebar et éviter le rechargement des icônes lors des changements d'onglet.

## 🚀 Architecture du Cache Global

### 1. Cache Global Persistant
- **Fichier**: `utils/image-cache.ts`
- **Fonctionnalité**: Classe singleton qui maintient le cache en mémoire de manière persistante
- **Bénéfices**: Les icônes ne se rechargent plus lors des changements d'onglet

```tsx
// Instance globale unique
const globalImageCache = new GlobalImageCache();

// Le cache persiste entre les changements d'onglet
globalImageCache.isImageCached('/images/icones/Nav/Accueil.svg');
```

### 2. Hook de Cache Global
- **Fichier**: `hooks/use-global-image-cache.ts`
- **Fonctionnalité**: Interface React pour le cache global
- **Bénéfices**: Utilisation simple et transparente du cache persistant

```tsx
import { useGlobalImageCache } from '@/hooks/use-global-image-cache';

function Sidebar() {
  const { isImageCached, cachedImagesCount, isInitialized } = useGlobalImageCache();
  
  // Vérifier si une image est en cache
  const isCached = isImageCached('/images/icones/Nav/Accueil.svg');
}
```

### 3. Composant d'Icône Optimisé
- **Fichier**: `components/sidebar.tsx`
- **Fonctionnalité**: Composant `CustomIcon` mémorisé avec gestion du cache
- **Bénéfices**: Affichage instantané des icônes déjà en cache

```tsx
const CustomIcon = memo(({ alt, className, isActive, src, isCached }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(Boolean(isCached));
  
  // Si l'image est en cache, l'afficher immédiatement
  useEffect(() => {
    if (isCached) {
      setIsLoaded(true);
      return;
    }
    // Sinon, charger l'image
  }, [src, isCached]);
  
  return (
    <Image
      alt={alt}
      className={`${baseClass} ${visibilityClass} transition-opacity duration-200`}
      src={src}
      priority={true}
      loading="eager"
    />
  );
});
```

### 4. Préchargement Intelligent
- **Fichier**: `components/svg-preloader.tsx`
- **Fonctionnalité**: Préchargement prioritaire des images critiques
- **Bénéfices**: Chargement immédiat des icônes de navigation

## 📊 Résolution du Problème

### Problème Initial
- ❌ Les icônes se rechargeaient à chaque changement d'onglet
- ❌ Le hook `useSidebarImageCache` était réinitialisé dans `Providers`
- ❌ Expérience utilisateur dégradée avec clignotements

### Solution Implémentée
- ✅ Cache global persistant qui ne se remet jamais à zéro
- ✅ Gestion intelligente des promesses de chargement
- ✅ Interface identique pour une migration transparente
- ✅ Expérience utilisateur fluide sans rechargement

## 🔧 Utilisation

### Hook de Cache Global
```tsx
import { useGlobalImageCache } from '@/hooks/use-global-image-cache';

function MyComponent() {
  const { 
    isImageCached, 
    cachedImagesCount, 
    isInitialized,
    preloadImage 
  } = useGlobalImageCache();
  
  // Vérifier si une image est en cache
  const isCached = isImageCached('/images/icones/Nav/Accueil.svg');
  
  // Obtenir le nombre d'images mises en cache
  console.log(`${cachedImagesCount} images en cache`);
  
  // Précharger une image spécifique
  preloadImage('/images/icones/Nav/Data.svg');
}
```

### Cache Global Direct
```tsx
import globalImageCache from '@/utils/image-cache';

// Vérifier si une image est en cache
const isCached = globalImageCache.isImageCached('/images/icones/Nav/Accueil.svg');

// Obtenir le nombre d'images en cache
const count = globalImageCache.getCachedImagesCount();

// Précharger une image spécifique
await globalImageCache.preloadSpecificImage('/images/icones/Nav/Data.svg');
```

## 🎯 Bénéfices

1. **Performance**: Plus de rechargement des icônes lors des changements d'onglet
2. **UX**: Navigation fluide sans clignotement
3. **Mémoire**: Cache persistant optimisé
4. **Réseau**: Réduction des requêtes HTTP répétées
5. **Compatibilité**: Interface identique à l'ancien système

## 🔍 Monitoring

Pour surveiller l'efficacité du cache global :

1. **DevTools Network**: Vérifier qu'il n'y a plus de requêtes répétées
2. **Console**: Utiliser `cachedImagesCount` pour le monitoring
3. **Navigation**: Tester les changements d'onglet pour vérifier l'absence de rechargement

## 📝 Notes Techniques

- Le cache global est une instance singleton qui persiste pendant toute la session
- Les images critiques (navigation) sont chargées en priorité
- Le cache gère intelligemment les promesses de chargement pour éviter les doublons
- Interface identique à l'ancien hook pour une migration transparente
- Compatible avec tous les composants existants

## 🚀 Migration

L'ancien système `useSidebarImageCache` a été remplacé par `useGlobalImageCache` :

```tsx
// Ancien système (supprimé)
import { useSidebarImageCache } from '@/hooks/use-sidebar-image-cache';

// Nouveau système
import { useGlobalImageCache } from '@/hooks/use-global-image-cache';
```

L'interface reste identique, seule l'import change.