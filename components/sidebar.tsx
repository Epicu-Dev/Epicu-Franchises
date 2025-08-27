"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@heroui/card";
import { CardBody } from "@heroui/card";
import { CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ArchiveBoxIcon,
  ArrowRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

import { useUser } from "../contexts/user-context";
import { useLoading } from "../contexts/loading-context";
import { UserProfile } from "../types/user";

interface SidebarProps {
  onLogout: () => void;
  onHelpClick?: () => void;
}

export function Sidebar({ onLogout, onHelpClick }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, userType, setUserType } = useUser();
  const { setUserProfileLoaded } = useLoading();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fermer le sidebar mobile lors du changement de route
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Signaler que le profil est chargé quand les données utilisateur sont disponibles
  useEffect(() => {
    setUserProfileLoaded(true);
  }, [setUserProfileLoaded]);

  // Gérer la fermeture avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  const menuItems = [
    {
      key: "home-admin",
      label: "Accueil Admin",
      icon: HomeIcon,
      href: "/home-admin",
      showFor: ["admin"]
    },
    { key: "home", label: "Accueil", icon: Squares2X2Icon, href: "/home", showFor: ["franchise", "admin"] },
    { key: "data", label: "Data", icon: ChartBarIcon, href: "/data", showFor: ["franchise", "admin"] },
    { key: "clients", label: "Clients", icon: UsersIcon, href: "/clients", showFor: ["franchise", "admin"] },
    {
      key: "prospects",
      label: "Prospects",
      icon: UsersIcon,
      href: "/prospects",
      showFor: ["franchise", "admin"]
    },
    { key: "agenda", label: "Agenda", icon: CalendarIcon, href: "/agenda", showFor: ["franchise"] },
    { key: "todo", label: "To do", icon: BellIcon, href: "/todo", showFor: ["franchise"] },
    {
      key: "facturation",
      label: "Facturation",
      icon: DocumentTextIcon,
      href: "/facturation",
      showFor: []
    },
    { key: "equipe", label: "Equipe", icon: UserGroupIcon, href: "/equipe", showFor: ["franchise", "admin"] },
    {
      key: "studio",
      label: "Le studio",
      icon: BuildingStorefrontIcon,
      href: "/studio",
      showFor: ["admin", "franchise"]
    },
    {
      key: "ressources",
      label: "Ressources",
      icon: ArchiveBoxIcon,
      href: "/ressources",
      showFor: ["admin", "franchise"]
    },
    { key: "tirage", label: "Tirage au sort", icon: CubeIcon, href: "/tirage", showFor: ["franchise", "admin"] },
  ];

  // Filtrer les éléments du menu selon le rôle de l'utilisateur
  const filteredMenuItems = menuItems.filter(item => {
    if (!userProfile?.role) return false;

    // Mapper les rôles de l'API vers les types du menu
    const roleMapping: { [key: string]: string[] } = {
      'Admin': ['admin'],
      'Franchisé': ['franchise'],
      'Collaborateur': ['franchise'],
      // Ajouter d'autres mappings selon les rôles disponibles
    };

    const allowedTypes = roleMapping[userProfile.role] || ['franchise'];

    return item.showFor.some(type => allowedTypes.includes(type));
  });

  const settingsItems = [
    { key: "compte", label: "Compte", icon: Cog6ToothIcon, href: "/profil" },
    {
      key: "aide",
      label: "Aide",
      icon: QuestionMarkCircleIcon,
      action: onHelpClick,
    },
    {
      key: "logout",
      label: "Se déconnecter",
      icon: ArrowRightOnRectangleIcon,
      action: onLogout,
    },
  ];

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // const handleUserTypeChange = (type: "admin" | "franchise") => {
  //   // Cette fonction n'est plus utilisée car nous utilisons le vrai rôle de l'API
  //   // Gardée pour compatibilité mais ne fait rien
  //   console.log('Changement de type utilisateur désactivé - utilisation du rôle API');
  // };

  return (
    <>
      {/* Bouton hamburger pour mobile */}
      <Button
        isIconOnly
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        size="sm"
        onPress={() => setIsMobileOpen(true)}
      >
        <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </Button>

      {/* Overlay pour mobile */}
      {isMobileOpen && (
        <div
          aria-label="Fermer le menu"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMobileOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <Card className={`
        h-full w-64 bg-white dark:bg-gray-900 rounded-none 
        fixed md:relative z-50 md:z-auto
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} shadow="none">
        <CardBody className="p-0 h-full flex flex-col text-rimary">
          {/* Header avec bouton fermer sur mobile */}
          <div className="flex items-center justify-between p-4 md:hidden border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
            <Button
              isIconOnly
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              size="sm"
              variant="light"
              onPress={() => setIsMobileOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile Section */}
          <CardHeader className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    alt="Profile"
                    className="w-full h-full object-cover"
                    height={40}
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                    width={40}
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {userProfile ? `${userProfile.firstname} ${userProfile.lastname}` : 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userProfile?.role || 'Rôle non défini'}
                  </p>
                </div>
              </div>
              {/* <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    size="sm"
                    variant="light"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Sélection du type d'utilisateur"
                  onAction={(key) => handleUserTypeChange(key as "admin" | "franchise")}
                >
                  <DropdownItem key="admin" className="text-gray-700 dark:text-gray-300">
                    Admin
                  </DropdownItem>
                  <DropdownItem key="franchise" className="text-gray-700 dark:text-gray-300">
                    Franchisé
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown> */}
            </div>
          </CardHeader>

          {/* Menu Section */}
          <div className="flex-1 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              MENU
            </h3>
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.key}
                  className={`group rounded-lg gap-4 flex font-light cursor-pointer px-3 py-2 pointer transition-colors w-full text-left ${isActive
                    ? "bg-black text-white dark:bg-white dark:text-black shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                    }`}
                  onClick={() => handleItemClick(item)}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">

                    {item.label}
                  </div>
                  <ArrowRightIcon className={`h-5 w-5 opacity-0  transition-opacity ${isActive ? "" : "group-hover:opacity-100"}`} />

                </button>
              )
            })}

          </div>

          <hr className="mx-4 border-gray-200 dark:border-gray-700" />

          {/* Settings Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              PARAMÈTRES
            </h3>
            {
              settingsItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <button
                    key={item.key}
                    className={`group rounded-lg gap-4 flex font-light cursor-pointer px-3 py-2 pointer transition-colors w-full text-left ${isActive
                      ? "bg-black text-white dark:bg-white dark:text-black shadow"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                      }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <item.icon className="h-5 w-5" />
                    <div className="flex-1">

                      {item.label}
                    </div>
                    <ArrowRightIcon className={`h-5 w-5 opacity-0  transition-opacity ${isActive ? "" : "group-hover:opacity-100"}`} />

                  </button>
                )
              })
            }

          </div>
          <div className="flex justify-center items-center pb-6">
            <img alt="logo" height={42} src="/images/logo-e.png" width={42} />
          </div>
        </CardBody>
      </Card>
    </>
  );
}
