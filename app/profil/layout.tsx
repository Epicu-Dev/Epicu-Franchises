import { DashboardLayout } from '../dashboard-layout';

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 