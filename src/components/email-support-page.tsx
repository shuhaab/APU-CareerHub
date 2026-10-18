import { ExternalLink, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { GMAIL_SUPPORT_URL, SUPPORT_EMAIL } from "@/lib/support";
import type { UserRole } from "@/types";

const descriptions: Record<UserRole, string> = {
  student: "Get help with your profile, documents, job applications, or application status.",
  employer: "Get help with employer access, vacancies, applicant reviews, or account settings.",
  admin: "Get help with account access, approvals, administrative actions, or portal configuration.",
};

export function EmailSupportPage({ role }: { role: UserRole }) {
  return (
    <div className="space-y-7">
      <DashboardHeading title="Help & support" description={descriptions[role]} />

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-[#d91b62]"><Mail className="size-6" /></span>
          <h2 className="mt-5 text-xl font-bold text-[#18233f]">Contact email support</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            If you need assistance, send an email describing what you were trying to do, what happened, and any error message you received.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Support email</p>
            <a href={GMAIL_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 break-all font-semibold text-[#d91b62] hover:underline">
              {SUPPORT_EMAIL}<ExternalLink className="size-4 shrink-0" />
            </a>
          </div>

          <Button asChild className="mt-6 h-10 bg-[#24345c] px-4 text-white hover:bg-[#18233f]">
            <a href={GMAIL_SUPPORT_URL} target="_blank" rel="noopener noreferrer"><Mail className="size-4" /> Open Gmail</a>
          </Button>
        </div>

        <aside className="h-fit rounded-2xl bg-[#1d294a] p-6 text-white shadow-[0_12px_36px_rgba(29,41,74,0.16)]">
          <MessageSquareText className="size-6 text-[#ff6da4]" />
          <h2 className="mt-4 font-bold">What to include</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/68">
            <li>• Your registered account email and role</li>
            <li>• The page or feature you were using</li>
            <li>• A clear description of the problem</li>
            <li>• The exact error message, if available</li>
          </ul>
          <div className="mt-6 flex gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-white/50"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>Never send your password, temporary password, authentication code, or private documents by email.</p></div>
        </aside>
      </section>
    </div>
  );
}
