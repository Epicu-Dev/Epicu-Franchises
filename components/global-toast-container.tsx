"use client";

import ToastContainer from "./toast-container";

import { useToastContext } from "@/contexts/toast-context";

export default function GlobalToastContainer() {
  const { toasts } = useToastContext();
  
  // Ne rend le composant que s'il y a des toasts à afficher
  if (toasts.length === 0) return null;
  
  return <ToastContainer />;
}
