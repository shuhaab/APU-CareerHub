import { Activity, BriefcaseBusiness, FileCheck2, LogIn, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { getAuditLogs } from "@/lib/data/firestore";

function presentation(action: string) {
  if (action.startsWith("authentication.")) return { icon: LogIn, label: action.endsWith("signed_in") ? "User signed in" : "User signed out", type: "Authentication" };
  if (action === "admin.created") return { icon: UserCheck, label: "Administrator account created", type: "Access" };
  if (action === "employer.approved") return { icon: UserCheck, label: "Employer access approved", type: "Access" };
  if (action.startsWith("vacancy.")) return { icon: BriefcaseBusiness, label: action.replaceAll(".", " "), type: "Vacancy" };
  if (action.startsWith("application.")) return { icon: FileCheck2, label: action.replaceAll(".", " "), type: "Application" };
  if (action.startsWith("support.")) return { icon: Mail, label: "Support request submitted", type: "Support" };
  if (action.startsWith("user.")) return { icon: ShieldCheck, label: action.replaceAll(".", " "), type: "User" };
  return { icon: Activity, label: action.replaceAll(".", " "), type: "System" };
}

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();
  return (
    <div className="space-y-7">
      <DashboardHeading title="Audit logs" description="Review important security, access, vacancy, and application actions recorded by the portal." />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-6">
        <div className="grid gap-1">
          {logs.map((log) => {
            const item = presentation(log.action);
            return <div key={log.id} className="flex gap-4 border-b border-slate-100 py-5 last:border-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef1f7] text-[#24345c]"><item.icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold capitalize text-[#18233f]">{item.label}</p><Badge variant="secondary">{item.type}</Badge></div><p className="mt-1 text-sm text-slate-500"><strong className="font-medium">{log.actorName}</strong> · {log.entityType} {log.entityId}</p><time className="mt-2 block text-xs text-slate-400">{log.createdAt}</time></div></div>;
          })}
          {logs.length === 0 && <p className="py-12 text-center text-sm text-slate-500">No audited activity has been recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
