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
  | 'prestations-studio'
  | 'ca-studio';

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

// Configuration de mapping basée sur les nouveaux tableaux fournis
const STATISTICS_MAPPING: Record<StatisticType, Record<TimeFilter, Record<LocationFilter, StatisticsMapping>>> = {
  'chiffre-affaires-global': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'CA total',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'CA total',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'CA total',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'CA total',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'CA total',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'CA total',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'CA total',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'CA total',
        available: true
      }
    }
  },
  'clients-signes': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Clients signés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Clients signés',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Clients signés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Clients signés',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Clients signés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Clients signés',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Clients signés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Clients signés',
        available: true
      }
    }
  },
  'franchises': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Franchises existantes',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Franchises existantes',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Franchises existantes',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Franchises existantes',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Franchises existantes',
        available: true
      }
    }
  },
  'abonnes-en-plus': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Progression abonnés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Progression abonnés',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Progression abonnés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Progression abonnés',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Progression abonnés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Progression abonnés',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Progression abonnés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Progression abonnés',
        available: true
      }
    }
  },
  'vues': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Total vues',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Total vues',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Total vues',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Total vues',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Total vues',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Total vues',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Total vues',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Total vues',
        available: true
      }
    }
  },
  'taux-conversion': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Tx de conversion',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Tx de conversion',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Tx de conversion',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Tx de conversion',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Tx de conversion',
        available: true
      }
    }
  },
  'prospects': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Prospects vus',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Prospects vus',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Prospects vus',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Prospects vus',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Prospects vus',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Prospects vus',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Prospects vus',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Prospects vus',
        available: true
      }
    }
  },
  'posts-publies': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Posts publiés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Posts publiés',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Posts publiés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Posts publiés',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Posts publiés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Posts publiés',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Posts publiés',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Posts publiés',
        available: true
      }
    }
  },
  'prestations-studio': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'Prestations studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'Prestations studio',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'Prestations studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'Prestations studio',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'Prestations studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'Prestations studio',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'Prestations studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'Prestations studio',
        available: true
      }
    }
  },
  'ca-studio': {
    'depuis-creation': {
      'ville': {
        table: 'STATISTIQUES CREATION VILLE',
        view: 'Vue globale',
        path: 'CA studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES CREATION FRANCE',
        view: 'Vue globale',
        path: 'CA studio',
        available: true
      }
    },
    'n-importe-quel-mois': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Vue complète',
        path: 'CA studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Vue globale',
        path: 'CA studio',
        available: true
      }
    },
    'ce-mois-ci': {
      'ville': {
        table: 'STATISTIQUES MENSUELLES VILLE',
        view: 'Mois en cours',
        path: 'CA studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES MENSUELLES FRANCE',
        view: 'Mois en cours',
        path: 'CA studio',
        available: true
      }
    },
    'annee': {
      'ville': {
        table: 'STATISTIQUES ANNUELLES VILLE',
        view: 'Vue globale',
        path: 'CA studio',
        available: true
      },
      'pays': {
        table: 'STATISTIQUES ANNUELLES FRANCE',
        view: 'Année en cours',
        path: 'CA studio',
        available: true
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

  const locationFilter: LocationFilter = (selectedCity === 'national' || selectedCity === 'all') ? 'pays' : 'ville';

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
