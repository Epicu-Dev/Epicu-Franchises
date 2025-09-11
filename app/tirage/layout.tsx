import { DashboardLayout } from '../dashboard-layout';

export default function TirageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
