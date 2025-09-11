import { DashboardLayout } from '../dashboard-layout';

export default function RessourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
