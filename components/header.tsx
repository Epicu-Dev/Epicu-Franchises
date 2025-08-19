'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@heroui/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ThemeSwitch } from './theme-switch';

export function Header() {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/profil');
  };

  return (
    <div className="w-full">
      
      {/* Main Header Section */}
      <div className="w-full bg-page-bg dark:bg-gray-900 px-6 py-4 flex justify-end items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher..."
            className="w-64 pr-4 pl-10"
            classNames={{
              input: "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
              inputWrapper: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white dark:bg-gray-800"
            }}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        
        {/* Theme Switch */}
        <ThemeSwitch />
        
        {/* User Profile Picture */}
        <button 
          className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <Image
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            alt="Profile"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </div>
  );
} 