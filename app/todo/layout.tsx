import { DashboardLayout } from '../dashboard-layout';

export default function TodoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 