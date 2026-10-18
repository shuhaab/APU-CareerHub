import { AccountSettings } from "@/components/account-settings";
import { enforcePageRole } from "@/lib/auth/server";

export default async function AdminAccountPage() {
  const { profile } = await enforcePageRole("admin");
  return <AccountSettings profile={profile} />;
}
