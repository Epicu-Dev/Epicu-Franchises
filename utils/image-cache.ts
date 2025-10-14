/**
 * Cache global persistant pour les images SVG
 * Ce cache ne se remet jamais à zéro et persiste entre les changements d'onglet
 */

class GlobalImageCache {
  private cache = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private isInitialized = false;

  private imagePaths = [
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

  /**
   * Vérifie si une image est en cache
   */
  isImageCached(src: string): boolean {
    return this.cache.has(src);
  }

  /**
   * Retourne le nombre d'images en cache
   */
  getCachedImagesCount(): number {
    return this.cache.size;
  }

  /**
   * Vérifie si le cache est initialisé
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Précharge une image spécifique
   */
  private preloadImage(src: string): Promise<void> {
    // Si l'image est déjà en cache, retourner une promesse résolue
    if (this.cache.has(src)) {
      return Promise.resolve();
    }

    // Si l'image est déjà en cours de chargement, retourner la promesse existante
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Créer une nouvelle promesse de chargement
    const promise = new Promise<void>((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        this.cache.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Impossible de charger l'image: ${src}`);
        this.loadingPromises.delete(src);
        resolve();
      };
      img.loading = 'eager';
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Initialise le cache en préchargeant toutes les images
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Charger les images critiques en premier (navigation et icônes principales)
      const criticalImages = this.imagePaths.slice(0, 13); // Icônes de navigation
      const otherImages = this.imagePaths.slice(13); // Autres icônes
      
      // Charger les images critiques avec priorité maximale
      const criticalPromises = criticalImages.map(src => this.preloadImage(src));
      
      // Charger les autres images en parallèle
      const otherPromises = otherImages.map(src => this.preloadImage(src));
      
      // Charger d'abord les images critiques, puis les autres
      await Promise.all(criticalPromises);
      await Promise.all(otherPromises);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du cache d\'images:', error);
      this.isInitialized = true; // Marquer comme initialisé même en cas d'erreur
    }
  }

  /**
   * Force le préchargement d'une image spécifique
   */
  async preloadSpecificImage(src: string): Promise<void> {
    return this.preloadImage(src);
  }
}

// Instance globale unique
const globalImageCache = new GlobalImageCache();

export default globalImageCache;
