# Amélioration de l'UI des Messages d'Erreur

Ce document décrit les améliorations apportées à l'interface utilisateur des messages d'erreur et de succès dans l'application Epicu-Franchises.

## Composants Créés

### 1. MessageAlert (`components/message-alert.tsx`)

Un composant réutilisable pour afficher des messages d'alerte avec une UI moderne.

**Props :**
- `message`: Le message à afficher
- `type`: Le type de message (`"error" | "success" | "info" | "warning"`)
- `onClose`: Fonction appelée lors de la fermeture
- `autoHide`: Si le message doit se fermer automatiquement (défaut: `false`)
- `autoHideDelay`: Délai avant auto-fermeture en ms (défaut: `5000`)
- `showCloseButton`: Si le bouton de fermeture doit être affiché (défaut: `true`)
- `className`: Classes CSS supplémentaires

**Utilisation :**
```tsx
import MessageAlert from "@/components/message-alert";

<MessageAlert
  message="Opération réussie !"
  type="success"
  onClose={() => setMessage("")}
  autoHide={true}
  className="mt-4"
/>
```

### 2. ToastNotification (`components/toast-notification.tsx`)

Un composant de notification toast avec animations et barre de progression.

**Props :**
- `id`: Identifiant unique du toast
- `message`: Le message à afficher
- `type`: Le type de message
- `duration`: Durée d'affichage en ms
- `onClose`: Fonction appelée lors de la fermeture

### 3. ToastContainer (`components/toast-container.tsx`)

Conteneur qui gère l'affichage de plusieurs notifications toast.

### 4. GlobalToastContainer (`components/global-toast-container.tsx`)

Composant global qui utilise le contexte toast et affiche le ToastContainer.

## Hook Personnalisé

### useToast (`hooks/use-toast.ts`)

Hook personnalisé pour gérer les notifications toast.

**Méthodes disponibles :**
- `addToast(toast)`: Ajouter un toast personnalisé
- `removeToast(id)`: Supprimer un toast par ID
- `clearToasts()`: Supprimer tous les toasts
- `showError(message, duration?)`: Afficher un message d'erreur
- `showSuccess(message, duration?)`: Afficher un message de succès
- `showInfo(message, duration?)`: Afficher un message d'information
- `showWarning(message, duration?)`: Afficher un message d'avertissement

**Utilisation :**
```tsx
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { showSuccess, showError } = useToast();
  
  const handleSuccess = () => {
    showSuccess("Opération réussie !");
  };
  
  const handleError = () => {
    showError("Une erreur s'est produite", 8000);
  };
  
  // ...
}
```

## Contexte React

### ToastContext (`contexts/toast-context.tsx`)

Contexte React pour partager le hook useToast dans toute l'application.

**Utilisation :**
```tsx
import { useToastContext } from "@/contexts/toast-context";

function MyComponent() {
  const { showSuccess } = useToastContext();
  
  // ...
}
```

## Configuration

### 1. ToastProvider

Le `ToastProvider` est configuré dans `app/providers.tsx` pour rendre les notifications toast disponibles dans toute l'application.

### 2. GlobalToastContainer

Le `GlobalToastContainer` est ajouté dans `app/layout.tsx` pour afficher les notifications toast globalement.

### 3. Configuration des Images

Le fichier `next.config.js` a été mis à jour pour permettre l'utilisation d'images depuis Unsplash et corriger l'erreur 500.

## Fonctionnalités

### Animations
- **Entrée** : Slide depuis la droite avec fade-in et scale
- **Sortie** : Fade-out avec scale-down
- **Transitions** : Durée de 300ms avec easing

### Auto-fermeture
- Les messages de succès se ferment automatiquement après 5 secondes
- Les messages d'erreur restent affichés jusqu'à fermeture manuelle
- Barre de progression pour les notifications toast

### Responsive Design
- Adapté aux écrans mobiles et desktop
- Positionnement intelligent des notifications
- Espacement automatique entre plusieurs toasts

### Accessibilité
- Boutons avec `aria-label`
- Contraste des couleurs respecté
- Navigation au clavier supportée

## Exemple d'Utilisation Complète

```tsx
"use client";

import { useState } from "react";
import { useToastContext } from "@/contexts/toast-context";
import MessageAlert from "@/components/message-alert";

export default function ExamplePage() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const { showSuccess, showError } = useToastContext();

  const handleSuccess = () => {
    setMessage("Opération réussie !");
    setMessageType("success");
    showSuccess("Notification toast de succès !");
  };

  const handleError = () => {
    setMessage("Une erreur s'est produite");
    setMessageType("error");
    showError("Notification toast d'erreur !");
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <button onClick={handleSuccess}>Tester Succès</button>
        <button onClick={handleError}>Tester Erreur</button>
      </div>
      
      {message && (
        <MessageAlert
          message={message}
          type={messageType}
          onClose={() => setMessage("")}
          autoHide={messageType === "success"}
          className="mt-4"
        />
      )}
    </div>
  );
}
```

## Avantages

1. **Réutilisabilité** : Composants modulaires utilisables partout
2. **Cohérence** : UI uniforme dans toute l'application
3. **Accessibilité** : Respect des standards d'accessibilité
4. **Performance** : Animations optimisées et gestion efficace de l'état
5. **Maintenabilité** : Code bien structuré et documenté
6. **Flexibilité** : Configuration facile des types, durées et comportements

## Support des Types

Tous les composants sont entièrement typés avec TypeScript pour une meilleure expérience de développement et une détection d'erreurs précoce.

## Correction des Erreurs

- **Erreur 500 sur /home** : Corrigée en ajoutant la configuration des images Unsplash dans `next.config.js`
- **Configuration des images** : Ajout des patterns pour `images.unsplash.com` et `plus.unsplash.com`
