import { AppShell } from "@/components/app-shell";
import { enforcePageRole } from "@/lib/auth/server";
import { getPortalNotifications } from "@/lib/data/firestore";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await enforcePageRole("student");
  const notifications = await getPortalNotifications(user.uid, "student");
  return <AppShell role="student" profile={user.profile} notifications={notifications}>{children}</AppShell>;
}
