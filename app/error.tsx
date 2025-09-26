"use client";

import { useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";
import { DashboardLayout } from "./dashboard-layout";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full shadow-custom dark:shadow-custom-dark">
          <CardBody className="p-8 text-center">
            {/* Icône d'erreur */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-danger-600 dark:text-danger-400" />
            </div>

            {/* Titre */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Oups ! Une erreur s'est produite
            </h1>
            
            {/* Description */}
            <p className="text-default-600 mb-6">
              Nous avons rencontré un problème inattendu. Veuillez réessayer ou rafraîchir la page.
            </p>

            {/* Détails de l'erreur (en mode développement) */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="mb-6 bg-default-100 dark:bg-default-50">
                <CardBody className="p-4 text-left">
                  <h3 className="text-sm font-medium text-foreground mb-2">Détails de l'erreur :</h3>
                  <p className="text-xs text-default-600 font-mono break-all">
                    {error.message}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              
              
              <Button
                color="default"

                variant="bordered"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                onPress={handleRefresh}
                className="font-medium border-1"
              >
                Rafraîchir la page
              </Button>
            </div>

            {/* Lien vers l'accueil */}
            <div className="mt-6">
              <Button
                as="a"
                href="/"
                variant="light"
                color="primary"
                startContent={<HomeIcon className="w-4 h-4" />}
                className="font-medium"
              >
                Retour à l'accueil
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
