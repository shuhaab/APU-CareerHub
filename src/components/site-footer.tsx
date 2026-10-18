import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getSessionUser, type SessionUser } from "@/lib/auth/server";
import { GMAIL_SUPPORT_URL, SUPPORT_EMAIL } from "@/lib/support";

export async function SiteFooter({ sessionUser }: { sessionUser?: SessionUser | null } = {}) {
  const user = sessionUser === undefined ? await getSessionUser() : sessionUser;
  return (
    <footer id="support" className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
            A focused employment portal connecting APU students with meaningful on-campus work opportunities.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Quick links</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-500">
            <Link href="/jobs" className="hover:text-[#d91b62]">Browse opportunities</Link>
            {user ? <Link href={`/${user.role}`} className="hover:text-[#d91b62]">Go to dashboard</Link> : <><Link href="/login" className="hover:text-[#d91b62]">Student sign in</Link><Link href="/register" className="hover:text-[#d91b62]">Employer access</Link></>}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Student support</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-500">
            <span className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> APU Campus, Technology Park Malaysia</span>
            <a href={GMAIL_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#d91b62]"><Mail className="size-4 shrink-0" /> {SUPPORT_EMAIL}</a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-5 text-center text-xs text-slate-400">
        © 2026 APU CareerHub · On-campus employment portal
      </div>
    </footer>
  );
}
