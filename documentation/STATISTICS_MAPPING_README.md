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
- `ca-studio` : Chiffre d'affaires studio

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

1. **STATISTIQUES CREATION VILLE**
   - Vue globale
   - Champ de date : `Name` (Nom de la ville EPICU)

2. **STATISTIQUES CREATION FRANCE**
   - Vue globale
   - Champ de date : `Pays` (Texte, pour le moment seulement France)

3. **STATISTIQUES MENSUELLES VILLE**
   - Vue complète
   - Mois en cours
   - Champ de date : `Date - ville EPICU` (Formule : DATETIME_FORMAT({Mois-Année},'MM/YYYY')&" - "&{Ville EPICU})

4. **STATISTIQUES MENSUELLES FRANCE**
   - Vue globale
   - Mois en cours
   - Champ de date : `Période` (DATETIME_FORMAT({Mois-Année},'MM/YYYY'))

5. **STATISTIQUES ANNUELLES VILLE**
   - Vue globale
   - Champ de date : `Année-Ville` (Formule : DATETIME_FORMAT(Date,'YYYY')&" - "&{Ville EPICU})

6. **STATISTIQUES ANNUELLES FRANCE**
   - Année en cours
   - Champ de date : `Année` (DATETIME_FORMAT(Date, 'YYYY'))

### Exemples de mapping

| Statistique | Filtre temporel | Filtre géo | Table | Vue | Champ |
|-------------|----------------|------------|-------|-----|-------|
| Chiffre d'affaires | Depuis création | Ville | STATISTIQUES CREATION VILLE | Vue globale | CA total |
| Chiffre d'affaires | Ce mois-ci | Ville | STATISTIQUES MENSUELLES VILLE | Mois en cours | CA total |
| Chiffre d'affaires | Année | Pays | STATISTIQUES ANNUELLES FRANCE | Année en cours | CA total |
| Abonnés | Depuis création | Ville | STATISTIQUES CREATION VILLE | Vue globale | Nombre d'abonnés |
| Abonnés | Ce mois-ci | Ville | STATISTIQUES MENSUELLES VILLE | Mois en cours | Progression abonnés |
| Franchises | Année | Pays | STATISTIQUES ANNUELLES FRANCE | Année en cours | Franchises existantes |
| CA Studio | Depuis création | Ville | STATISTIQUES CREATION VILLE | Vue globale | CA studio |
| Clients signés | Ce mois-ci | Ville | STATISTIQUES MENSUELLES VILLE | Mois en cours | Clients signés |

## Champs de date spécifiques par table

**Important** : Chaque table utilise un champ de date différent pour la recherche. Le système adapte automatiquement la formule de recherche selon la table utilisée.

### Mapping des champs de date

| Table | Champ de date | Format | Exemple |
|-------|---------------|--------|---------|
| STATISTIQUES MENSUELLES VILLE | `Date - ville EPICU` | MM/YYYY - Ville EPICU | "12/2024 - Paris" |
| STATISTIQUES ANNUELLES VILLE | `Année-Ville` | YYYY - Ville EPICU | "2024 - Paris" |
| STATISTIQUES CREATION VILLE | `Name` | Nom de la ville EPICU | "Paris" |
| STATISTIQUES MENSUELLES FRANCE | `Période` | MM/YYYY | "12/2024" |
| STATISTIQUES ANNUELLES FRANCE | `Année` | YYYY | "2024" |
| STATISTIQUES CREATION FRANCE | `Pays` | Texte | "France" |

## Cohérence des champs

**Principe important** : Pour chaque type de statistique, les champs (A Chemin) sont cohérents. Seules les tables et vues changent selon les filtres temporels et géographiques.

### Exceptions avec variations de champs

Certains types de statistiques ont des variations de champs selon le contexte :

- **Abonnés** : 
  - `Nombre d'abonnés` (pour "depuis création + ville")
  - `Progression abonnés` (pour tous les autres cas)

- **Taux de conversion** :
  - `Tx de conversion` (pour les vues ville)
  - `Tx de conversion` (pour les vues pays)

### Champs cohérents

Tous les autres types de statistiques utilisent le même champ pour tous les filtres :

- **Chiffre d'affaires global** : `CA total`
- **Clients signés** : `Clients signés`
- **Franchises** : `Franchises existantes`
- **Vues** : `Total vues`
- **Prospects** : `Prospects vus`
- **Posts publiés** : `Posts publiés`
- **Prestations studio** : `Prestations studio`
- **CA studio** : `CA studio`

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
