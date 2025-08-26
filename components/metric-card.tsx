'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export function MetricCard({ value, label, icon, iconBgColor, iconColor }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-custom dark:shadow-custom-dark pb-20 relative overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="mb-1 font-semibold text-2xl">{value}</h2>
            <p className="text-sm text-primary-light font-light">{label}</p>
          </div>
          <div className={`z-1 absolute top-[-60px] right-[-50px] h-40 w-40 rounded-full ${iconBgColor}`}>

          </div>
         
          <div
            className={`z-10 w-12 h-12 rounded-full flex items-center justify-center  dark:bg-opacity-20`}
          >
            <div className={`${iconColor} dark:opacity-90`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 