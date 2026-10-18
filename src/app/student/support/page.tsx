import { EmailSupportPage } from "@/components/email-support-page";
import { enforcePageRole } from "@/lib/auth/server";

export default async function StudentSupportPage() {
  await enforcePageRole("student");
  return <EmailSupportPage role="student" />;
}
