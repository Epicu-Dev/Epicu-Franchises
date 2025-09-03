"use client";

import { useUser } from "@/contexts/user-context";
import { useLoading } from "@/contexts/loading-context";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

export default function TestAuthPage() {
  const { userProfile, isLoading, error, refreshUserProfile } = useUser();
  const { isLoading: appLoading, userProfileLoaded } = useLoading();
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    // Récupérer les données du localStorage
    const data = {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      userProfile: localStorage.getItem('userProfile'),
      userProfileCacheTime: localStorage.getItem('userProfileCacheTime'),
      userType: localStorage.getItem('userType'),
      expiresAtAccess: localStorage.getItem('expiresAtAccess'),
      expiresAtRefresh: localStorage.getItem('expiresAtRefresh'),
    };
    setLocalStorageData(data);
  }, []);

  const testApi = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setApiTest({
        status: response.status,
        ok: response.ok,
        data: data
      });
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  };

  const clearCache = () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userProfileCacheTime');
    window.location.reload();
  };

  const clearAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Test d'authentification</h1>
      
      {/* État du contexte utilisateur */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">État du contexte utilisateur</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Chargement:</strong> {isLoading ? <Spinner size="sm" /> : 'Terminé'}
              </div>
              <div>
                <strong>Profil chargé:</strong> {userProfileLoaded ? 'Oui' : 'Non'}
              </div>
              <div>
                <strong>Chargement app:</strong> {appLoading ? <Spinner size="sm" /> : 'Terminé'}
              </div>
              <div>
                <strong>Erreur:</strong> {error || 'Aucune'}
              </div>
            </div>
            
            {userProfile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Profil utilisateur:</h3>
                <pre className="text-sm overflow-auto">{JSON.stringify(userProfile, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Données du localStorage */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Données du localStorage</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Access Token:</strong> {localStorageData.accessToken ? 'Présent' : 'Manquant'}
              </div>
              <div>
                <strong>Refresh Token:</strong> {localStorageData.refreshToken ? 'Présent' : 'Manquant'}
              </div>
              <div>
                <strong>User Profile:</strong> {localStorageData.userProfile ? 'Présent' : 'Manquant'}
              </div>
              <div>
                <strong>User Type:</strong> {localStorageData.userType || 'Non défini'}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Contenu du localStorage:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(localStorageData, null, 2)}</pre>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Test de l'API */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Test de l'API /api/auth/me</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Button onPress={testApi} color="primary">
              Tester l'API
            </Button>
            
            {apiTest && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Résultat du test:</h3>
                <pre className="text-sm overflow-auto">{JSON.stringify(apiTest, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onPress={refreshUserProfile} color="primary">
                Rafraîchir le profil
              </Button>
              <Button onPress={clearCache} color="warning">
                Effacer le cache
              </Button>
              <Button onPress={clearAll} color="danger">
                Effacer tout
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
