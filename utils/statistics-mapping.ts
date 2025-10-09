// Types pour les statistiques
export type StatisticType = 
  | 'chiffre-affaires-global'
  | 'clients-signes'
  | 'franchises'
  | 'abonnes-en-plus'
  | 'vues'
  | 'taux-conversion'
  | 'prospects'
  | 'posts-publies'
  | 'prestations-studio';

export type TimeFilter = 
  | 'depuis-creation'
  | 'n-importe-quel-mois'
  | 'ce-mois-ci'
  | 'annee';

export type LocationFilter = 
  | 'ville'
  | 'pays';

export interface StatisticsMapping {
  table: string;
  view: string;
  path: string;
  available: boolean;
}

// Configuration de mapping basée sur les tableaux fournis
const STATISTICS_MAPPING: Record<StatisticType, Record<TimeFilter, Record<LocationFilter, StatisticsMapping>>> = {
  'chiffre-affaires-global': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'CA depuis la création',
        available: true
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Année en cours',
        path: 'CA total depuis création',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'CA TOTAL',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'CA France',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'CA TOTAL',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Mois en cours',
        path: 'CA France',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Vue globale',
        path: 'CA TOTAL',
        available: true
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Vue globale',
        path: 'CA FRANCE',
        available: true
      }
    }
  },
  'clients-signes': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Prospects signés depuis la création',
        available: false
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Année en cours',
        path: 'Prospects signés depuis la création',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Prospects signés ds le mois',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Prospects signés ds le mois',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Prospects signés ds le mois',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Prospects signés ds le mois',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Prospects signés ds le mois',
        available: true
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Vue globale',
        path: 'Prospects signés ds le mois',
        available: true
      }
    }
  },
  'franchises': {
    'depuis-creation': {
      'ville': {
        table: 'SYNTHESE NATIONALE',
        view: 'Mois en cours',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Mois en cours',
        path: 'Franchises existantes',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Franchises existantes',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Franchises existantes',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'SYNTHESE NATIONALE',
        view: 'Mois en cours',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Mois en cours',
        path: 'Franchises existantes',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Vue globale',
        path: 'Franchises créées',
        available: true
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Vue globale',
        path: 'Franchises existantes',
        available: true
      }
    }
  },
  'abonnes-en-plus': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Total abonnés',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Abonnés à Afficher',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Total abonnés',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Total abonnés',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Total abonnés gagnés /M-1',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Total abonnés gagnés /M-1',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Total abonnés gagnés /A-1',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Total abonnés gagnés /A-1',
        available: true
      }
    }
  },
  'vues': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Total vues depuis la création',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Total vues depuis la création',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Total vues',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Total vues',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Total vues',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Total vues',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Total vues annuel',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Total vues annuel',
        available: true
      }
    }
  },
  'taux-conversion': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Tx de conversion depuis la création',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Tx de conversion depuis la création',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Tx de conversion',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Tx de conversion',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Tx de conversion',
        available: true
      }
    }
  },
  'prospects': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Prospects vus depuis la création',
        available: false
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Année en cours',
        path: 'Prospects vus depuis la création',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Prospects vus ds le mois',
        available: true
      },
      'pays': {
        table: 'SYNTHESE NATIONALE',
        view: 'Vue globale',
        path: 'Prospects vus ds le mois',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Prospects vus ds le mois',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Prospects vus ds le mois',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Prospects vus ds le mois',
        available: false
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Prospects vus ds le mois',
        available: false
      }
    }
  },
  'posts-publies': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Posts publiés',
        available: false
      },
      'pays': {
        table: 'SYNTHESES ANNUELLES',
        view: 'Année en cours',
        path: 'Posts publiés',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Posts publiés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Posts publiés',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Nbre publications ds le mois',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Nbre publications ds le mois',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Posts publiés',
        available: false
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Posts publiés',
        available: false
      }
    }
  },
  'prestations-studio': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Prestations studio',
        available: false
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète dernier mois',
        path: 'Prestations studio',
        available: false
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Prestations studio',
        available: false
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Vue complète',
        path: 'Prestations studio',
        available: false
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Prestations studio',
        available: false
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Mois en cours',
        path: 'Prestations studio',
        available: false
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Prestations studio',
        available: false
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES',
        view: 'Année en cours',
        path: 'Prestations studio',
        available: false
      }
    }
  }
};

/**
 * Obtient la configuration de mapping pour une statistique donnée
 */
export function getStatisticsMapping(
  statisticType: StatisticType,
  timeFilter: TimeFilter,
  locationFilter: LocationFilter
): StatisticsMapping | null {
  const mapping = STATISTICS_MAPPING[statisticType]?.[timeFilter]?.[locationFilter];
  return mapping || null;
}

/**
 * Convertit les filtres du frontend vers les types internes
 */
export function convertFrontendFilters(
  periodType: string,
  isSinceCreation: boolean,
  isCustomDate: boolean,
  selectedCity: string
): { timeFilter: TimeFilter; locationFilter: LocationFilter } {
  let timeFilter: TimeFilter;
  
  if (isSinceCreation) {
    timeFilter = 'depuis-creation';
  } else if (periodType === 'year') {
    timeFilter = 'annee';
  } else if (isCustomDate) {
    timeFilter = 'n-importe-quel-mois';
  } else {
    timeFilter = 'ce-mois-ci';
  }

  const locationFilter: LocationFilter = selectedCity === 'national' ? 'pays' : 'ville';

  return { timeFilter, locationFilter };
}

/**
 * Obtient tous les mappings disponibles pour une statistique
 */
export function getAllMappingsForStatistic(statisticType: StatisticType): Array<{
  timeFilter: TimeFilter;
  locationFilter: LocationFilter;
  mapping: StatisticsMapping;
}> {
  const mappings: Array<{
    timeFilter: TimeFilter;
    locationFilter: LocationFilter;
    mapping: StatisticsMapping;
  }> = [];

  for (const [timeFilter, timeData] of Object.entries(STATISTICS_MAPPING[statisticType])) {
    for (const [locationFilter, mapping] of Object.entries(timeData)) {
      if (mapping.available) {
        mappings.push({
          timeFilter: timeFilter as TimeFilter,
          locationFilter: locationFilter as LocationFilter,
          mapping
        });
      }
    }
  }

  return mappings;
}
