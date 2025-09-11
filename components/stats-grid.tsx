"use client";

import {
  ChartBarIcon,
  EyeIcon,
  UsersIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

import { MetricCard } from "@/components/metric-card";

interface StatsData {
  abonnes: number;
  vues: number;
  prospectsSignes: number;
  tauxConversion: number;
}

interface StatsGridProps {
  statistics: StatsData | null;
  loading: boolean;
  className?: string;
}

export function StatsGrid({ statistics, loading, className = "" }: StatsGridProps) {
  const metrics = [
    {
      value: loading ? "..." : statistics ? `+${statistics.abonnes.toLocaleString()}` : "0",
      label: "Nombre d'abonnés",
      icon: <ChartBarIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-green-stats/40",
      iconColor: "text-custom-green-stats",
    },
    {
      value: loading ? "..." : statistics ? `+${statistics.vues.toLocaleString()}` : "0",
      label: "Nombre de vues",
      icon: <EyeIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-rose/40",
      iconColor: "text-custom-rose",
    },
    {
      value: loading ? "..." : statistics ? statistics.prospectsSignes.toString() : "0",
      label: "Prospects signés",
      icon: <UsersIcon className="h-6 w-6" />,
      iconBgColor: "bg-yellow-100",
      iconColor: "text-yellow-400",
    },
    {
      value: loading ? "..." : statistics ? `${statistics.tauxConversion.toFixed(1)}%` : "0%",
      label: "Taux de conversion",
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      iconBgColor: "bg-custom-orange-food/40",
      iconColor: "text-custom-orange-food",
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          icon={metric.icon}
          iconBgColor={metric.iconBgColor}
          iconColor={metric.iconColor}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </div>
  );
}
