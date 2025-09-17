# Processus de suppression d'événement de type publication

## Vue d'ensemble
Lors de la suppression d'un événement de type "publication" dans l'agenda, le système libère automatiquement le créneau associé en le passant du statut "Réservé" (🟥) au statut "Libre" (🟩).

## Flux de traitement

```
1. Suppression d'événement agenda
   ↓
2. Vérification du type d'événement
   ↓ (si type = "publication")
3. Récupération des détails de l'événement
   - Date de l'événement
   - Établissements associés
   ↓
4. Récupération de la catégorie d'établissement
   - Trouver l'établissement par ID
   - Récupérer sa catégorie
   - Mapper le nom vers l'emoji (ex: "FOOD" → "🟠 FOOD")
   ↓
5. Recherche du créneau correspondant
   - Filtrer par catégorie et date
   - Vérifier le statut actuel
   ↓
6. Libération du créneau
   - Si statut ≠ "Libre" (recfExTXxcNivX1i4)
   - Changer vers "Libre" (recfExTXxcNivX1i4)
   ↓
7. Suppression de l'événement agenda
```

## Codes de statut des créneaux

| Statut | ID Airtable | Emoji | Description |
|--------|-------------|-------|-------------|
| Libre | `recfExTXxcNivX1i4` | 🟩 | Créneau disponible |
| Indisponible | `recsdyl2X41rpj7LG` | 🟥 | Créneau occupé |

## Mapping des catégories

| Nom catégorie | Emoji | ID Airtable |
|---------------|-------|-------------|
| FOOD | 🟠 FOOD | Variable |
| SHOP | 🟣 SHOP | Variable |
| TRAVEL | 🟢 TRAVEL | Variable |
| FUN | 🔴 FUN | Variable |
| BEAUTY | 🩷 BEAUTY | Variable |

## Gestion d'erreurs

- Si la récupération de l'établissement échoue → Continue la suppression
- Si la recherche de catégorie échoue → Continue la suppression  
- Si la recherche de créneau échoue → Continue la suppression
- Si la mise à jour du créneau échoue → Continue la suppression

**Important** : La suppression de l'événement agenda se fait toujours, même si la libération du créneau échoue.

## Endpoints utilisés

- `DELETE /api/agenda?id={eventId}` - Suppression de l'événement
- `GET /api/publications/creneaux` - Recherche du créneau (interne)
- `PATCH /api/publications/creneaux` - Mise à jour du statut (interne)

## Exemple de requête

```bash
DELETE /api/agenda?id=recEvent123
```

**Réponse attendue :**
```json
{
  "id": "recEvent123"
}
```

Le créneau associé sera automatiquement libéré en arrière-plan.
