import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { PasswordSettings } from "@/components/password-settings";
import { AdminMfaEnrollment } from "@/components/admin-mfa-enrollment";
import { getSessionAccount } from "@/lib/auth/server";

export default async function OnboardingPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/login");
  if (account.state === account.role) redirect(`/${account.role}`);
  return <main className="mx-auto grid max-w-xl gap-5 p-6">
    <h1 className="text-2xl font-semibold">{account.state === "pending" ? "Employer approval pending" : "Administrator setup"}</h1>
    {account.state === "pending" && <p>Your department access request is awaiting review. Sign in again after an administrator confirms your affiliation.</p>}
    {account.state === "password" && <PasswordSettings required admin />}
    {account.state === "mfa" && <AdminMfaEnrollment />}
    <LogoutButton compact />
  </main>;
}
