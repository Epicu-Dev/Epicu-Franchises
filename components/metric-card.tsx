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
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-custom dark:shadow-custom-dark pb-20">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-light">{label}</p>
          </div>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgColor} dark:bg-opacity-20`}
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