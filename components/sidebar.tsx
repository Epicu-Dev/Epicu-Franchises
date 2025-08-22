"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@heroui/card";
import { CardBody } from "@heroui/card";
import { CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Listbox } from "@heroui/listbox";
import { ListboxItem } from "@heroui/listbox";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

import { useUserType } from "../contexts/user-type-context";

import { ThemeSwitch } from "./theme-switch";

interface SidebarProps {
  onLogout: () => void;
  onHelpClick?: () => void;
}

export function Sidebar({ onLogout, onHelpClick }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userType, setUserType } = useUserType();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fermer le sidebar mobile lors du changement de route
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
    { key: "home", label: "Accueil", icon: HomeIcon, href: "/home", showFor: ["franchise"] },
    {
      key: "home-admin",
      label: "Accueil ",
      icon: HomeIcon,
      href: "/home-admin",
      showFor: ["admin"]
    },
    { key: "data", label: "Data", icon: ChartBarIcon, href: "/data", showFor: ["franchise"] },
    { key: "clients", label: "Clients", icon: UsersIcon, href: "/clients", showFor: ["franchise"] },
    {
      key: "prospects",
      label: "Prospects",
      icon: BellIcon,
      href: "/prospects",
      showFor: ["franchise"]
    },
    { key: "agenda", label: "Agenda", icon: CalendarIcon, href: "/agenda", showFor: ["franchise"] },
    { key: "todo", label: "To do", icon: CheckCircleIcon, href: "/todo", showFor: ["franchise"] },
    {
      key: "facturation",
      label: "Facturation",
      icon: DocumentTextIcon,
      href: "/facturation",
      showFor: ["franchise"]
    },
    { key: "equipe", label: "Equipe", icon: UserGroupIcon, href: "/equipe", showFor: ["admin"] },
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
    { key: "tirage", label: "Tirage au sort", icon: CubeIcon, href: "/tirage", showFor: ["franchise"] },
  ];

  // Filtrer les éléments du menu selon le type d'utilisateur
  const filteredMenuItems = menuItems.filter(item => item.showFor.includes(userType));

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

  const handleUserTypeChange = (type: "admin" | "franchise") => {
    setUserType(type);
    // Rediriger vers la page d'accueil appropriée
    if (type === "admin") {
      router.push("/home-admin");
    } else {
      router.push("/home");
    }
  };

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
        <CardBody className="p-0 h-full flex flex-col">
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
                    Dominique Durand
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userType === "admin" ? "Admin" : "Franchisé"}
                  </p>
                </div>
              </div>
              <Dropdown>
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
              </Dropdown>
            </div>
          </CardHeader>

          {/* Menu Section */}
          <div className="flex-1 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              MENU
            </h3>
            <Listbox
              aria-label="Menu navigation"
              className="gap-1"
              onAction={(key) => {
                const item = filteredMenuItems.find((item) => item.key === key);

                if (item) handleItemClick(item);
              }}
            >
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <ListboxItem
                    key={item.key}
                    className={`rounded-lg px-3 py-2 transition-colors ${isActive
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    startContent={<item.icon className="h-5 w-5" />}
                  >
                    {item.label}
                  </ListboxItem>
                );
              })}
            </Listbox>
          </div>

          <hr className="mx-4 border-gray-200 dark:border-gray-700" />

          {/* Settings Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              PARAMÈTRES
            </h3>
            <Listbox
              aria-label="Settings navigation"
              className="gap-1"
              onAction={(key) => {
                const item = settingsItems.find((item) => item.key === key);

                if (item) handleItemClick(item);
              }}
            >
              {settingsItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <ListboxItem
                    key={item.key}
                    className={`rounded-lg px-3 py-2 transition-colors ${isActive
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : item.key === "logout"
                        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    startContent={<item.icon className="h-5 w-5" />}
                  >
                    {item.label}
                  </ListboxItem>
                );
              })}
            </Listbox>
          </div>

          {/* Theme Switch Section */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Thème
              </span>
              <ThemeSwitch />
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
