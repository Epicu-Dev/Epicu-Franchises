'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Input } from '@heroui/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';


export function Header() {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/profil');
  };

  return (
    <div className="w-full">

      {/* Main Header Section */}
      <div className="w-full bg-page-bg dark:bg-gray-900 px-6 py-4 flex justify-end items-center gap-4 ">
        {/* Token Status Indicator */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              className="w-64 pr-4 pl-10"
              classNames={{
                input: "text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500",
                inputWrapper: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-page-bg"
              }}
              placeholder="Rechercher..."
              startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
              type="text"
            />
          </div>

          {/* Theme Switch */}
          {/* <ThemeSwitch /> */}

          {/* User Profile Picture */}
          <button
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            <Image
              alt="Profile"
              className="w-full h-full object-cover"
              height={40}
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
              width={40}
            />
          </button>
        </div>
      </div>
    </div>
  );
} 