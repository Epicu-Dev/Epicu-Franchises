"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Card } from "@heroui/card";
import { CardBody } from "@heroui/card";
import { CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Listbox } from "@heroui/listbox";
import { ListboxItem } from "@heroui/listbox";
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
  DocumentDuplicateIcon,
  CubeIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

import { ThemeSwitch } from "./theme-switch";

interface SidebarProps {
  onLogout: () => void;
  onHelpClick?: () => void;
}

export function Sidebar({ onLogout, onHelpClick }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    { key: "home", label: "Accueil", icon: HomeIcon, href: "/home" },
    {
      key: "home-admin",
      label: "Accueil Admin",
      icon: HomeIcon,
      href: "/home-admin",
    },
    { key: "data", label: "Data", icon: ChartBarIcon, href: "/data" },
    { key: "clients", label: "Clients", icon: UsersIcon, href: "/clients" },
    {
      key: "prospects",
      label: "Prospects",
      icon: BellIcon,
      href: "/prospects",
    },
    { key: "agenda", label: "Agenda", icon: CalendarIcon, href: "/agenda" },
    { key: "todo", label: "To do", icon: CheckCircleIcon, href: "/todo" },
    {
      key: "facturation",
      label: "Facturation",
      icon: DocumentTextIcon,
      href: "/facturation",
    },
    { key: "equipe", label: "Equipe", icon: UserGroupIcon, href: "/equipe" },
    {
      key: "studio",
      label: "Le studio",
      icon: BuildingStorefrontIcon,
      href: "/studio",
    },
    {
      key: "ressources",
      label: "Ressources",
      icon: DocumentDuplicateIcon,
      href: "/ressources",
    },
    { key: "tirage", label: "Tirage au sort", icon: CubeIcon, href: "/tirage" },
  ];

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

  return (
    <Card className="h-full w-64 bg-page-bg dark:bg-gray-900 rounded-none border-r border-gray-200 dark:border-gray-700">
      <CardBody className="p-0 h-full flex flex-col">
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
                  Admin
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              size="sm"
              variant="light"
              onPress={() => setIsProfileOpen(!isProfileOpen)}
            >
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
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
              const item = menuItems.find((item) => item.key === key);

              if (item) handleItemClick(item);
            }}
          >
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <ListboxItem
                  key={item.key}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    isActive
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
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    isActive
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
  );
}
