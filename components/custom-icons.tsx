import React from 'react';

interface CustomIconProps {
  name: 'abonnes' | 'chiffre-affaires' | 'clients' | 'franchises' | 'posts' | 'prospects' | 'studio' | 'vues';
  className?: string;
}

interface FranchiseIconProps {
  name: 'abonnes' | 'conversion' | 'prospects' | 'vues';
  className?: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ name, className = "h-6 w-6" }) => {
  const iconPath = `/images/icones/Home-admin/${name}.svg`;
  
  return (
    <img 
      src={iconPath} 
      alt={`${name} icon`}
      className={className}
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
  
  return (
    <img 
      src={iconPath} 
      alt={`${name} icon`}
      className={className}
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
