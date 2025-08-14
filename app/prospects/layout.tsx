import { DashboardLayout } from '../dashboard-layout';

export default function ProspectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 