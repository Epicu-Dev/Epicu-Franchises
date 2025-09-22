"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";

import { useUser } from "@/contexts/user-context";
import { Data } from "@/types/data";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

type SubscribersData = Pick<Data, 'abonnesFood' | 'abonnesShop' | 'abonnesTravel' | 'abonnesFun' | 'abonnesBeauty'>;

interface SubscribersEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubscribersData, selectedCity?: string) => void;
  initialData: SubscribersData;
  month: string;
  date: string; // Format MM-YYYY
  saving?: boolean;
}

export const SubscribersEditModal: React.FC<SubscribersEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  month,
  date,
  saving = false,
}) => {
  const { userProfile } = useUser();
  const { authFetch } = useAuthFetch();
  const [formData, setFormData] = useState<SubscribersData>(initialData);
  const [activeTab, setActiveTab] = useState<string>("");
  const [cityData, setCityData] = useState<Record<string, SubscribersData>>({});
  const [loadingCityData, setLoadingCityData] = useState<Record<string, boolean>>({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fonction pour charger les données d'une ville spécifique
  const loadCityData = async (cityKey: string, city: any) => {
    if (loadingCityData[cityKey]) return; // Éviter les appels multiples

    setLoadingCityData(prev => ({ ...prev, [cityKey]: true }));
    setIsLoadingData(true);

    try {
      const villeParam = city.id || city.ville.toLowerCase().replace(/\s+/g, '-');
      const response = await authFetch(`/api/data/data?ville=${encodeURIComponent(villeParam)}&date=${encodeURIComponent(date)}`);

      if (response.ok) {
        const apiData = await response.json();
        const citySubscribersData: SubscribersData = {
          abonnesFood: apiData.abonnesFood || 0,
          abonnesShop: apiData.abonnesShop || 0,
          abonnesTravel: apiData.abonnesTravel || 0,
          abonnesFun: apiData.abonnesFun || 0,
          abonnesBeauty: apiData.abonnesBeauty || 0,
        };

        setCityData(prev => ({
          ...prev,
          [cityKey]: citySubscribersData
        }));
      } else {
        // En cas d'erreur, utiliser les données initiales
        setCityData(prev => ({
          ...prev,
          [cityKey]: initialData
        }));
      }
    } catch {
      // En cas d'erreur, utiliser les données initiales
      setCityData(prev => ({
        ...prev,
        [cityKey]: initialData
      }));
    } finally {
      setLoadingCityData(prev => ({ ...prev, [cityKey]: false }));
      setIsLoadingData(false);
    }
  };

  // Vérifier si l'utilisateur a plusieurs villes
  const hasMultipleCities = userProfile?.villes && userProfile.villes.length > 1;

  useEffect(() => {
    setFormData(initialData);
    
    // Initialiser les données par ville si l'utilisateur a plusieurs villes
    if (hasMultipleCities && userProfile?.villes) {
      const initialCityData: Record<string, SubscribersData> = {};

      userProfile.villes.forEach(city => {
        const cityKey = city.ville.toLowerCase().replace(/\s+/g, '-');

        initialCityData[cityKey] = initialData;
      });

      setCityData(initialCityData);
      
      // Définir le premier tab comme actif et charger ses données
      if (userProfile.villes.length > 0) {
        const firstCity = userProfile.villes[0];
        const firstCityKey = firstCity.ville.toLowerCase().replace(/\s+/g, '-');

        setActiveTab(firstCityKey);
        setFormData(initialData);
        
        // Charger les données de la première ville
        loadCityData(firstCityKey, firstCity);
      }
    }
  }, [initialData, isOpen, hasMultipleCities, userProfile?.villes, date]);

  // Mettre à jour formData quand les données de la ville active changent
  useEffect(() => {
    if (hasMultipleCities && activeTab && cityData[activeTab]) {
      setFormData(cityData[activeTab]);
    }
  }, [cityData, activeTab, hasMultipleCities]);

  const handleInputChange = (field: keyof SubscribersData, value: string) => {
    // Permettre seulement les nombres
    if (value === "" || /^\d+$/.test(value)) {
      const newFormData = {
        ...formData,
        [field]: value === "" ? 0 : parseInt(value)
      };

      setFormData(newFormData);
      
      // Mettre à jour les données de la ville active si l'utilisateur a plusieurs villes
      if (hasMultipleCities && activeTab) {
        setCityData(prev => ({
          ...prev,
          [activeTab]: newFormData
        }));
      }
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    // Charger les données de la ville sélectionnée
    if (hasMultipleCities && userProfile?.villes) {
      const city = userProfile.villes.find(c => 
        c.ville.toLowerCase().replace(/\s+/g, '-') === key
      );
      
      if (city) {
        // Charger les données de cette ville depuis l'API
        loadCityData(key, city);
        
        // Afficher les données actuelles (ou initiales en attendant)
        const cityFormData = cityData[key] || initialData;

        setFormData(cityFormData);
      }
    }
  };

  const handleSave = () => {
    // Si l'utilisateur a plusieurs villes, sauvegarder les données de la ville active
    if (hasMultipleCities && activeTab) {
      const selectedCity = userProfile?.villes?.find(c => 
        c.ville.toLowerCase().replace(/\s+/g, '-') === activeTab
      );

      onSave(cityData[activeTab] || formData, selectedCity?.ville);
    } else {
      onSave(formData);
    }
    onClose();
  };

  const handleCancel = () => {
    setFormData(initialData);
    onClose();
  };

  const categories = [
    {
      key: "abonnesFood" as keyof SubscribersData,
      label: "FOOD",
      color: "bg-custom-orange-food/10 text-custom-orange-food",
      placeholder: "Nombre d'abonnés Food"
    },
    {
      key: "abonnesShop" as keyof SubscribersData,
      label: "SHOP",
      color: "bg-custom-purple-shop/10 text-custom-purple-shop",
      placeholder: "Nombre d'abonnés Shop"
    },
    {
      key: "abonnesTravel" as keyof SubscribersData,
      label: "TRAVEL",
      color: "bg-custom-green-travel/10 text-custom-green-travel",
      placeholder: "Nombre d'abonnés Travel"
    },
    {
      key: "abonnesFun" as keyof SubscribersData,
      label: "FUN",
      color: "bg-custom-red-fun/10 text-custom-red-fun",
      placeholder: "Nombre d'abonnés Fun"
    },
    {
      key: "abonnesBeauty" as keyof SubscribersData,
      label: "BEAUTY",
      color: "bg-custom-blue-beauty/10 text-custom-blue-beauty",
      placeholder: "Nombre d'abonnés Beauty"
    }
  ];

  return (
    <Modal

      isOpen={isOpen}
      size="2xl"
      className="pb-20 md:pb-0"
      onClose={handleCancel}
    >
      <ModalContent>
        <ModalHeader className="flex justify-center">
          Modifier les nombres d&apos;abonnés - {month}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6 pb-6">
            <p className="text-sm font-light">
              Modifiez les nombres d&apos;abonnés pour chaque catégorie :
            </p>

            {/* Tabs conditionnels pour les villes */}
            {hasMultipleCities && userProfile?.villes && (
              <Tabs
                className="w-full"
                classNames={{
                  cursor: "w-[50px] left-[12px] h-1 rounded",
                  tab: "pb-6 data-[selected=true]:font-semibold text-base font-light",
                }}
                isDisabled={isLoadingData || saving}
                selectedKey={activeTab}
                variant="underlined"
                onSelectionChange={(key) => handleTabChange(key as string)}
              >
                {userProfile.villes.map((city) => (
                  <Tab
                    key={city.ville.toLowerCase().replace(/\s+/g, '-')}
                    title={city.ville}
                  />
                ))}
              </Tabs>
            )}

            {/* Spinner de chargement */}
            {isLoadingData && (
              <div className="flex justify-center items-center py-8">
                <Spinner color="primary" size="lg" />
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Chargement des données...
                </span>
              </div>
            )}

           {!isLoadingData && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded ${category.color}`}>
                      {category.label}
                    </span>
                  </div>
                  <Input
                    classNames={{
                      base: "w-full",
                      input: "text-sm",
                      inputWrapper: "border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                    }}
                    isDisabled={isLoadingData || saving}
                    placeholder={category.placeholder}
                    type="text"
                    value={formData[category.key]?.toString() || "0"}
                    variant="bordered"
                    onChange={(e) => handleInputChange(category.key, e.target.value)}
                  />
                </div>
              ))}
            </div>}
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button
            className="flex-1 border-1" 
            color='primary' 
            isDisabled={saving}
            variant="bordered"
            onPress={handleCancel}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            color="primary"
            isDisabled={saving || isLoadingData}
            isLoading={saving}
            onPress={handleSave}
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};