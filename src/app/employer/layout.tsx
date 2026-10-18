import { AppShell } from "@/components/app-shell";
import { enforcePageRole } from "@/lib/auth/server";
import { getPortalNotifications } from "@/lib/data/firestore";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await enforcePageRole("employer");
  const notifications = await getPortalNotifications(user.uid, "employer");
  return <AppShell role="employer" profile={user.profile} notifications={notifications}>{children}</AppShell>;
}
