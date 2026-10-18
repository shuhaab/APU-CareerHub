import { AppShell } from "@/components/app-shell";
import { enforcePageRole } from "@/lib/auth/server";
import { getPortalNotifications } from "@/lib/data/firestore";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await enforcePageRole("admin");
  const notifications = await getPortalNotifications(user.uid, "admin");
  return <AppShell role="admin" profile={user.profile} notifications={notifications}>{children}</AppShell>;
}
