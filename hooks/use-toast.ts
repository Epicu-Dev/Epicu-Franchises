"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info" | "warning";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration || 5000,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Méthodes utilitaires pour différents types de toast
  const showError = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "error", duration });
  }, [addToast]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "success", duration });
  }, [addToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "info", duration });
  }, [addToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: "warning", duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
}
