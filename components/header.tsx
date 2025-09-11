'use client';

import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Avatar } from '@heroui/avatar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { useUser } from '../contexts/user-context';


export function Header() {
  const router = useRouter();
  const { userProfile } = useUser();

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
          {/* <div className="relative">
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
          </div> */}

          {/* Theme Switch */}
          {/* <ThemeSwitch /> */}

          {/* User Profile Picture */}
          <button
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            <Avatar
              className="w-10 h-10"
              name={userProfile ? `${userProfile.firstname || 'Prénom'} ${userProfile.lastname || 'Nom'}` : 'Utilisateur'}
              src={userProfile?.trombi?.[0]?.url}
            />
          </button>
        </div>
      </div>
    </div>
  );
} 