import { AccountSettings } from "@/components/account-settings";
import { enforcePageRole } from "@/lib/auth/server";

export default async function StudentAccountPage() {
  const { profile } = await enforcePageRole("student");
  return <AccountSettings profile={profile} />;
}
