import { EmailSupportPage } from "@/components/email-support-page";
import { enforcePageRole } from "@/lib/auth/server";

export default async function AdminSupportPage() {
  await enforcePageRole("admin");
  return <EmailSupportPage role="admin" />;
}
