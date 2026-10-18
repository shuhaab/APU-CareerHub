import { AccountSettings } from "@/components/account-settings";
import { enforcePageRole } from "@/lib/auth/server";

export default async function EmployerAccountPage() {
  const { profile } = await enforcePageRole("employer");
  return <AccountSettings profile={profile} />;
}
