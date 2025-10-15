# Synchronisation des Créneaux de Publication

## Vue d'ensemble

Le système de synchronisation des créneaux de publication permet de :
1. **Stocker l'ID du créneau** lors de la création d'un événement de publication
2. **Libérer automatiquement le créneau** lors de la suppression de l'événement
3. **Rechercher le bon créneau** par catégorie et date si l'ID n'est pas disponible

## Fonctionnalités implémentées

### 1. Stockage de l'ID du créneau

**Fichier modifié :** `components/unified-event-modal.tsx`

- Lors de la création d'un événement de publication avec sélection de créneau
- L'ID du créneau est automatiquement stocké dans le champ de liaison `Creneau` de l'événement
- Le créneau est marqué comme "Indisponible" (🟥)

```typescript
// Mettre à jour l'événement créé avec l'ID du créneau
if (createdEventId) {
  await authFetch(`/api/agenda?id=${createdEventId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'Creneau': [formData.selectedSlotId] // Champ de liaison (array)
    }),
  });
}
```

### 2. Libération automatique des créneaux

**Fichier modifié :** `pages/api/agenda/index.ts`

- **Méthode 1 (Prioritaire)** : Utilise l'ID du créneau stocké
- **Méthode 2 (Fallback)** : Recherche par catégorie et date
- Le créneau est automatiquement libéré (🟩 Libre) lors de la suppression

```typescript
// Méthode 1: Utiliser l'ID du créneau stocké (plus fiable)
if (creneauId) {
  creneauToUpdate = await base('CALENDRIER PUBLICATIONS').find(creneauId);
}

// Méthode 2: Recherche par catégorie et date (fallback)
if (!creneauToUpdate && eventDate && eventEtablissements.length > 0) {
  // Recherche par catégorie et date...
}
```

### 3. Support des champs dans l'API

**Fichier modifié :** `pages/api/agenda/index.ts`

- Ajout du champ `'Creneau'` dans les champs récupérés
- Support dans les sections POST et PATCH
- Extraction de l'ID du créneau depuis le champ de liaison
- Logs de débogage pour le suivi

### 4. Interface mise à jour

**Fichier modifié :** `app/agenda/page.tsx`

- Ajout du champ `creneauId` dans l'interface `Event`
- Ajout du champ `creneauId` dans l'interface `ApiEvent`
- Transmission de l'ID du créneau dans les données d'événement

## Flux de fonctionnement

### Création d'événement de publication
```
1. Utilisateur sélectionne un créneau libre
   ↓
2. Événement de publication créé dans Airtable
   ↓
3. Événement créé dans Google Calendar (si connecté)
   ↓
4. Créneau marqué comme "Indisponible" (🟥)
   ↓
5. ID du créneau ET ID Google Calendar stockés dans l'événement
```

### Suppression d'événement de publication
```
1. Utilisateur supprime l'événement de publication
   ↓
2. Système vérifie s'il y a un creneauId stocké
   ↓
3. Si oui : Libération directe du créneau par ID
   ↓
4. Si non : Recherche par catégorie et date
   ↓
5. Créneau libéré (🟩 Libre)
   ↓
6. Événement supprimé de Google Calendar (si applicable)
```

## Codes de statut des créneaux

| Statut | ID Airtable | Emoji | Description |
|--------|-------------|-------|-------------|
| Libre | `recfExTXxcNivX1i4` | 🟩 | Créneau disponible |
| Indisponible | `recsdyl2X41rpj7LG` | 🟥 | Créneau occupé |

## Mapping des catégories

| Nom catégorie | Emoji | Description |
|---------------|-------|-------------|
| FOOD | 🟠 FOOD | Restaurants, cafés, etc. |
| SHOP | 🟣 SHOP | Boutiques, magasins |
| TRAVEL | 🟢 TRAVEL | Voyages, transports |
| FUN | 🔴 FUN | Divertissements, loisirs |
| BEAUTY | 🩷 BEAUTY | Beauté, bien-être |

## Configuration requise

### Base de données Airtable
- Ajouter un champ `Creneau` (type : "Link to another record") dans la table AGENDA
- Ce champ créera une liaison vers la table CALENDRIER PUBLICATIONS
- L'ID du créneau sera automatiquement extrait de cette liaison

### Champs Airtable requis
- **Table AGENDA** : `Creneau` (Link to another record)
- **Table CALENDRIER PUBLICATIONS** : `Statut de publication` (Single select)

## Avantages

✅ **Synchronisation fiable** : L'ID du créneau est stocké via une liaison Airtable
✅ **Fallback robuste** : Recherche par catégorie et date si l'ID n'est pas disponible
✅ **Libération automatique** : Les créneaux sont libérés lors de la suppression
✅ **Logs détaillés** : Suivi complet des opérations de synchronisation
✅ **Rétrocompatibilité** : Fonctionne avec les anciens événements sans ID de créneau

## Gestion d'erreurs

- **Erreur de stockage ID** : L'événement est créé mais sans liaison au créneau
- **Erreur de libération** : L'événement est supprimé, un warning est loggé
- **Créneau introuvable** : Recherche par catégorie et date en fallback
- **Erreur de recherche** : L'événement est supprimé, un warning est loggé

## Logs de débogage

Le système génère des logs détaillés :

```
🔄 Suppression d'un événement de type publication - Date: 2024-01-15, Creneau ID: rec123
🎯 Utilisation de l'ID du créneau stocké: rec123
✅ Créneau trouvé par ID: rec123
⏰ Créneau trouvé: rec123 - Statut actuel: recsdyl2X41rpj7LG
🔄 Libération du créneau rec123 - Statut actuel: recsdyl2X41rpj7LG
✅ Créneau rec123 libéré avec succès - Statut: 🟩 Libre
```

## Test de la fonctionnalité

Un script de test est fourni : `test-creneau-sync.js`

```bash
# Exécuter le test
node test-creneau-sync.js
```

**Note :** N'oubliez pas de remplacer les tokens d'accès par des valeurs valides.

## Impact sur les performances

- **Création** : +1 requête PATCH pour stocker l'ID du créneau
- **Suppression** : +1 requête pour libérer le créneau (ou recherche si nécessaire)
- **Lecture** : Aucun impact, le champ `creneauId` est simplement inclus dans les données

## Cas d'usage

1. **Création avec Google Calendar** : Sélection d'un créneau → Création Airtable + Google Calendar → Stockage des deux IDs → Créneau indisponible
2. **Création sans Google Calendar** : Sélection d'un créneau → Création Airtable → Stockage de l'ID créneau → Créneau indisponible
3. **Suppression normale** : Suppression de l'événement → Libération du créneau par ID → Suppression Google Calendar
4. **Suppression legacy** : Suppression d'ancien événement → Recherche par catégorie/date → Libération → Suppression Google Calendar
5. **Erreur de stockage** : Création réussie → Pas d'ID stocké → Libération par recherche
