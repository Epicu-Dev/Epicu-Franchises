# Synchronisation de Suppression Google Calendar

## Problème résolu

Lors de la suppression d'un événement créé via l'interface EPICU, l'événement était supprimé uniquement de la base de données Airtable mais **pas de Google Calendar**, laissant des événements orphelins dans le calendrier Google.

## Solution implémentée

### 1. Stockage de l'ID Google Calendar

**Fichier modifié :** `components/unified-event-modal.tsx`

- Lors de la création d'un événement EPICU, l'ID Google Calendar est maintenant stocké dans le champ `Google Event ID` de l'enregistrement Airtable
- Cette synchronisation se fait automatiquement après la création réussie de l'événement dans Google Calendar

```typescript
// Mettre à jour l'événement Airtable avec l'ID Google Calendar
const localEventId = await localResponse.json();
if (localEventId.id && createdGoogleEvent.id) {
  await authFetch(`/api/agenda?id=${localEventId.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      googleEventId: createdGoogleEvent.id
    }),
  });
}
```

### 2. Suppression bidirectionnelle

**Fichier modifié :** `pages/api/agenda/index.ts`

- Ajout du champ `Google Event ID` dans la liste des champs récupérés
- Modification de la logique de suppression pour vérifier la présence d'un ID Google Calendar
- Si un `googleEventId` est présent, l'événement est supprimé des deux côtés (Airtable + Google Calendar)

```typescript
// Vérifier s'il y a un ID Google Calendar associé et le supprimer
const googleEventId = eventToDelete.get('Google Event ID');
if (googleEventId) {
  // Appeler l'API de suppression Google Calendar
  const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/google-calendar/events/delete?eventId=${googleEventId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': req.headers.cookie || '',
    },
  });
}
```

### 3. Interface mise à jour

**Fichier modifié :** `app/agenda/page.tsx`

- Ajout du champ `googleEventId` dans l'interface `Event`
- Ajout du champ `googleEventId` dans l'interface `ApiEvent`
- Transmission de l'ID Google Calendar lors de la transformation des événements

## Flux de fonctionnement

### Création d'événement
```
1. Utilisateur crée un événement via l'interface EPICU
   ↓
2. Événement créé dans Airtable
   ↓
3. Événement créé dans Google Calendar
   ↓
4. ID Google Calendar stocké dans l'enregistrement Airtable
```

### Suppression d'événement
```
1. Utilisateur supprime un événement via l'interface EPICU
   ↓
2. Système vérifie s'il y a un googleEventId
   ↓
3. Si oui : Suppression de Google Calendar + Suppression d'Airtable
   ↓
4. Si non : Suppression d'Airtable uniquement
```

## Avantages

✅ **Synchronisation complète** : Les événements sont supprimés des deux côtés
✅ **Rétrocompatibilité** : Les anciens événements sans ID Google Calendar continuent de fonctionner
✅ **Gestion d'erreurs** : Si la suppression Google Calendar échoue, l'événement Airtable est quand même supprimé
✅ **Logs détaillés** : Suivi complet des opérations de synchronisation

## Configuration requise

### Base de données Airtable
- Ajouter un champ `Google Event ID` (type : "Single line text") dans la table AGENDA
- Ce champ stockera l'ID de l'événement correspondant dans Google Calendar

### Google Calendar
- L'utilisateur doit être connecté à Google Calendar
- Un calendrier contenant "EPICU" dans son nom doit exister
- Les permissions de lecture/écriture/suppression doivent être accordées

## Test de la fonctionnalité

Un script de test est fourni : `test-google-calendar-sync.js`

```bash
# Exécuter le test
node test-google-calendar-sync.js
```

**Note :** N'oubliez pas de remplacer les tokens d'accès et IDs de test par des valeurs valides.

## Gestion d'erreurs

- **Erreur de création Google Calendar** : L'événement Airtable est créé mais sans ID Google Calendar
- **Erreur de suppression Google Calendar** : L'événement Airtable est supprimé, un warning est loggé
- **Erreur de stockage ID** : L'événement est créé dans les deux systèmes mais sans liaison

## Logs de débogage

Le système génère des logs détaillés pour le suivi :

```
✅ Événement créé avec succès dans Google Calendar
✅ ID Google Calendar stocké dans l'événement Airtable
🔄 Suppression de l'événement Google Calendar: [ID]
✅ Événement Google Calendar [ID] supprimé avec succès
```

## Impact sur les performances

- **Création** : +1 requête PATCH pour stocker l'ID Google Calendar
- **Suppression** : +1 requête DELETE vers l'API Google Calendar
- **Lecture** : Aucun impact, le champ `googleEventId` est simplement inclus dans les données
