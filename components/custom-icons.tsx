import React, { useState, useEffect, memo } from 'react';
import { useSidebarImageCache } from '@/hooks/use-sidebar-image-cache';

interface CustomIconProps {
  name: 'abonnes' | 'chiffre-affaires' | 'clients' | 'franchises' | 'posts' | 'prospects' | 'studio' | 'vues';
  className?: string;
}

interface FranchiseIconProps {
  name: 'abonnes' | 'conversion' | 'prospects' | 'vues';
  className?: string;
}

// Composant d'icône optimisé avec cache
const OptimizedIcon = memo(({ src, alt, className, isCached }: { 
  src: string; 
  alt: string; 
  className: string; 
  isCached: boolean; 
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(Boolean(isCached));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isCached) {
      setIsLoaded(true);
      return;
    }

    const img = new window.Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;
  }, [src, isCached]);

  if (hasError) {
    return <div className={`${className} bg-gray-300 rounded`} />;
  }

  const visibilityClass = isLoaded ? 'opacity-100' : 'opacity-0';

  return (
    <img 
      src={src} 
      alt={alt}
      className={`${className} ${visibilityClass} transition-opacity duration-200`}
      loading="eager"
    />
  );
});

OptimizedIcon.displayName = 'OptimizedIcon';

export const CustomIcon: React.FC<CustomIconProps> = ({ name, className = "h-6 w-6" }) => {
  const iconPath = `/images/icones/Home-admin/${name}.svg`;
  const { isImageCached } = useSidebarImageCache();
  
  return (
    <OptimizedIcon 
      src={iconPath}
      alt={`${name} icon`}
      className={className}
      isCached={isImageCached(iconPath)}
    />
  );
};

// Composants spécifiques pour chaque icône
export const AbonnesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="abonnes" className={className} />
);

export const ChiffreAffairesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="chiffre-affaires" className={className} />
);

export const ClientsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="clients" className={className} />
);

export const FranchisesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="franchises" className={className} />
);

export const PostsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="posts" className={className} />
);

export const ProspectsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="prospects" className={className} />
);

export const StudioIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="studio" className={className} />
);

export const VuesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CustomIcon name="vues" className={className} />
);

// Composants pour les icônes des franchisés
export const FranchiseIcon: React.FC<FranchiseIconProps> = ({ name, className = "h-6 w-6" }) => {
  const iconPath = `/images/icones/Home-franchisé/${name}.svg`;
  const { isImageCached } = useSidebarImageCache();
  
  return (
    <OptimizedIcon 
      src={iconPath}
      alt={`${name} icon`}
      className={className}
      isCached={isImageCached(iconPath)}
    />
  );
};

// Composants spécifiques pour chaque icône de franchisé
export const FranchiseAbonnesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FranchiseIcon name="abonnes" className={className} />
);

export const ConversionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FranchiseIcon name="conversion" className={className} />
);

export const FranchiseProspectsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FranchiseIcon name="prospects" className={className} />
);

export const FranchiseVuesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FranchiseIcon name="vues" className={className} />
);
