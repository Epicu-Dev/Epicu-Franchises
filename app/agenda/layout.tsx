import { DashboardLayout } from '../dashboard-layout';

export default function AgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 