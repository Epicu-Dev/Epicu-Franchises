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

import { useUser } from "@/contexts/user-context";

interface SubscribersData {
  foodSubscribers: string;
  shopSubscribers: string;
  travelSubscribers: string;
  funSubscribers: string;
  beautySubscribers: string;
}

interface SubscribersEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubscribersData) => void;
  initialData: SubscribersData;
  month: string;
}

export const SubscribersEditModal: React.FC<SubscribersEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  month,
}) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState<SubscribersData>(initialData);
  const [activeTab, setActiveTab] = useState<string>("");
  const [cityData, setCityData] = useState<Record<string, SubscribersData>>({});

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
      
      // Définir le premier tab comme actif
      if (userProfile.villes.length > 0) {
        const firstCityKey = userProfile.villes[0].ville.toLowerCase().replace(/\s+/g, '-');

        setActiveTab(firstCityKey);
        setFormData(initialCityData[firstCityKey] || initialData);
      }
    }
  }, [initialData, isOpen, hasMultipleCities, userProfile?.villes]);

  const handleInputChange = (field: keyof SubscribersData, value: string) => {
    // Permettre seulement les nombres
    if (value === "" || /^\d+$/.test(value)) {
      const newFormData = {
        ...formData,
        [field]: value
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
    if (hasMultipleCities) {
      const cityFormData = cityData[key] || initialData;

      setFormData(cityFormData);
    }
  };

  const handleSave = () => {
    // Si l'utilisateur a plusieurs villes, sauvegarder les données de la ville active
    if (hasMultipleCities && activeTab) {
      onSave(cityData[activeTab] || formData);
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
      key: "foodSubscribers" as keyof SubscribersData,
      label: "FOOD",
      color: "bg-custom-orange-food/10 text-custom-orange-food",
      placeholder: "Nombre d'abonnés Food"
    },
    {
      key: "shopSubscribers" as keyof SubscribersData,
      label: "SHOP",
      color: "bg-custom-purple-shop/10 text-custom-purple-shop",
      placeholder: "Nombre d'abonnés Shop"
    },
    {
      key: "travelSubscribers" as keyof SubscribersData,
      label: "TRAVEL",
      color: "bg-custom-green-travel/10 text-custom-green-travel",
      placeholder: "Nombre d'abonnés Travel"
    },
    {
      key: "funSubscribers" as keyof SubscribersData,
      label: "FUN",
      color: "bg-custom-green-travel/10 text-custom-green-travel",
      placeholder: "Nombre d'abonnés Fun"
    },
    {
      key: "beautySubscribers" as keyof SubscribersData,
      label: "BEAUTY",
      color: "bg-custom-blue-beauty/10 text-custom-blue-beauty",
      placeholder: "Nombre d'abonnés Beauty"
    }
  ];

  return (
    <Modal

      isOpen={isOpen}
      size="2xl"
      onClose={handleCancel}
    >
      <ModalContent>
        <ModalHeader >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder={category.placeholder}
                    type="text"
                    value={formData[category.key]}
                    variant="bordered"
                    onChange={(e) => handleInputChange(category.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button
            className="flex-1 border-1" color='primary' variant="bordered"
            onPress={handleCancel}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            color="primary"
            onPress={handleSave}
          >
            Sauvegarder
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};