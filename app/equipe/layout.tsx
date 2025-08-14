import { DashboardLayout } from '../dashboard-layout';

export default function EquipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
