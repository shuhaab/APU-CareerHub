import { EmailSupportPage } from "@/components/email-support-page";
import { enforcePageRole } from "@/lib/auth/server";

export default async function EmployerSupportPage() {
  await enforcePageRole("employer");
  return <EmailSupportPage role="employer" />;
}
