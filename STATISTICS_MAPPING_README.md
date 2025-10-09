# Système de Mapping des Statistiques

## Vue d'ensemble

Ce système permet de récupérer dynamiquement les statistiques depuis différentes tables et vues d'Airtable selon le type de statistique et les filtres appliqués (temporels et géographiques).

## Architecture

### 1. Fichier de mapping (`utils/statistics-mapping.ts`)

Contient la logique de mapping qui détermine :
- Quelle table utiliser (`STATISTIQUES MENSUELLES`, `SYNTHESES ANNUELLES`, `SYNTHESE NATIONALE`)
- Quelle vue utiliser (`Vue complète`, `Mois en cours`, `Vue globale`, etc.)
- Quel champ récupérer selon le chemin spécifié

### 2. API modifiée (`pages/api/data/data.ts`)

L'API `/api/data/data` a été modifiée pour :
- Accepter de nouveaux paramètres : `statisticType`, `periodType`, `isSinceCreation`, `isCustomDate`
- Utiliser le système de mapping dynamique
- Récupérer les données depuis la bonne table/vue selon la configuration

### 3. Frontend mis à jour

Les pages `app/home/page.tsx` et `app/home-admin/page.tsx` ont été mises à jour pour :
- Envoyer les bons paramètres à l'API
- Récupérer les statistiques de manière granulaire
- Gérer les différents types de périodes

## Types de statistiques supportées

- `chiffre-affaires-global` : Chiffre d'affaires global
- `clients-signes` : Clients signés
- `franchises` : Franchises
- `abonnes-en-plus` : Abonnés en plus
- `vues` : Vues
- `taux-conversion` : Taux de conversion
- `prospects` : Prospects
- `posts-publies` : Posts publiés
- `prestations-studio` : Prestations studio

## Filtres temporels

- `depuis-creation` : Depuis la création
- `n-importe-quel-mois` : N'importe quel mois
- `ce-mois-ci` : Ce mois-ci
- `annee` : Année

## Filtres géographiques

- `ville` : Filtrage par ville
- `pays` : Filtrage par pays (national)

## Exemples d'utilisation

### Récupérer le chiffre d'affaires global pour ce mois-ci dans une ville

```javascript
const params = new URLSearchParams();
params.set('date', '12-2024');
params.set('ville', 'paris');
params.set('statisticType', 'chiffre-affaires-global');
params.set('periodType', 'month');
params.set('isSinceCreation', 'false');
params.set('isCustomDate', 'false');

const response = await fetch(`/api/data/data?${params.toString()}`);
```

### Récupérer les abonnés depuis la création au niveau national

```javascript
const params = new URLSearchParams();
params.set('date', '12-2024');
params.set('ville', 'all');
params.set('statisticType', 'abonnes-en-plus');
params.set('periodType', 'month');
params.set('isSinceCreation', 'true');
params.set('isCustomDate', 'false');

const response = await fetch(`/api/data/data?${params.toString()}`);
```

## Mapping des tables et vues

### Tables disponibles

1. **STATISTIQUES MENSUELLES**
   - Vue complète
   - Vue complète dernier mois
   - Mois en cours
   - Année en cours
   - Franchises existantes

2. **SYNTHESES ANNUELLES**
   - Vue globale
   - Année en cours

3. **SYNTHESE NATIONALE**
   - Vue globale
   - Mois en cours

### Exemples de mapping

| Statistique | Filtre temporel | Filtre géo | Table | Vue | Champ |
|-------------|----------------|------------|-------|-----|-------|
| Chiffre d'affaires | Depuis création | Ville | STATISTIQUES MENSUELLES | Vue complète dernier mois | CA depuis la création |
| Abonnés | Ce mois-ci | Ville | STATISTIQUES MENSUELLES | Mois en cours | Total abonnés gagnés /M-1 |
| Franchises | Année | Pays | SYNTHESES ANNUELLES | Vue globale | Franchises existantes |

## Gestion des erreurs

- Si une statistique n'est pas disponible pour une configuration donnée, l'API retourne une erreur 404
- Les statistiques non disponibles sont marquées avec `available: false` dans le mapping
- Le frontend gère gracieusement les erreurs en affichant 0 pour les statistiques non disponibles

## Tests

Un fichier de test `test-statistics-mapping.js` est disponible pour vérifier le bon fonctionnement du système de mapping.

## Migration

Le système est rétrocompatible. L'ancienne API continue de fonctionner avec les paramètres par défaut, mais les nouvelles fonctionnalités nécessitent les nouveaux paramètres.

## Maintenance

Pour ajouter une nouvelle statistique :

1. Ajouter le type dans `StatisticType`
2. Ajouter le mapping dans `STATISTICS_MAPPING`
3. Ajouter les champs dans `getFieldsForStatistic`
4. Mettre à jour le frontend si nécessaire

Pour modifier un mapping existant, il suffit de modifier la configuration dans `STATISTICS_MAPPING`.
