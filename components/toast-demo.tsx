"use client";

import { Button } from "@heroui/button";
import { useToastContext } from "@/contexts/toast-context";

export default function ToastDemo() {
  const { showError, showSuccess, showInfo, showWarning } = useToastContext();

  const handleShowError = () => {
    showError("Ceci est un message d'erreur de test", 8000);
  };

  const handleShowSuccess = () => {
    showSuccess("Opération réussie !", 5000);
  };

  const handleShowInfo = () => {
    showInfo("Information importante à noter", 6000);
  };

  const handleShowWarning = () => {
    showWarning("Attention, cette action est irréversible", 7000);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Démonstration des Notifications Toast
      </h3>
      <div className="space-y-3">
        <Button
          color="danger"
          variant="flat"
          onClick={handleShowError}
          className="w-full"
        >
          Afficher une Erreur
        </Button>
        <Button
          color="success"
          variant="flat"
          onClick={handleShowSuccess}
          className="w-full"
        >
          Afficher un Succès
        </Button>
        <Button
          color="primary"
          variant="flat"
          onClick={handleShowInfo}
          className="w-full"
        >
          Afficher une Information
        </Button>
        <Button
          color="warning"
          variant="flat"
          onClick={handleShowWarning}
          className="w-full"
        >
          Afficher un Avertissement
        </Button>
      </div>
    </div>
  );
}
