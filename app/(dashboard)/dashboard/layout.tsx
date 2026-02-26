import { getProfile } from "@/lib/get-profile";
import DashboardShell from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
