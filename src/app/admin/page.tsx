import Link from "next/link";
import { AlertCircle, ArrowRight, BriefcaseBusiness, ClipboardList, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { LiveDashboardUpdates } from "@/components/live-dashboard-updates";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllApplications, getAllJobs, getAllUsers } from "@/lib/data/firestore";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [jobs, applications, users] = await Promise.all([getAllJobs(), getAllApplications(), getAllUsers()]);
  const icons = [BriefcaseBusiness, ClipboardList, ShieldCheck];
  const pendingJobs = jobs.filter((job) => job.status === "pending_approval");
  const pendingEmployers = users.filter((user) => user.requestedRole === "employer" && !user.approved);
  const dashboardMetrics = [
    { label: "Published jobs", value: String(jobs.filter((job) => job.status === "published").length), change: `${jobs.length} total vacancies` },
    { label: "Active applications", value: String(applications.filter((item) => !["rejected", "withdrawn"].includes(item.currentStatus)).length), change: `${applications.length} total applications` },
    { label: "Pending approvals", value: String(pendingJobs.length + pendingEmployers.length), change: `${pendingJobs.length} jobs · ${pendingEmployers.length} employers` },
  ];
  const approvals = [
    ...pendingJobs.map((job) => ({ title: job.title, meta: `${job.department} · Vacancy approval`, type: "job", href: "/admin/vacancies" })),
    ...pendingEmployers.map((user) => ({ title: user.fullName, meta: `${user.department} · Employer access request`, type: "employer", href: "/admin/users" })),
  ];
  return (
    <div className="space-y-8">
      <div className="-mb-4 flex justify-end"><LiveDashboardUpdates role="admin" /></div>
      <DashboardHeading eyebrow="System administration" title="Portal health and oversight" description="Review pending approvals, monitor employment activity, and protect a consistent process across APU." />
      <section className="grid gap-4 md:grid-cols-3">{dashboardMetrics.map((metric, index) => <MetricCard key={metric.label} {...metric} icon={icons[index]} accent={index === 0 ? "navy" : index === 1 ? "teal" : "pink"} />)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(35,52,92,0.04)]"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-lg text-[#18233f]">Pending approvals</CardTitle><p className="mt-1 text-sm text-slate-500">Items requiring an administrator decision.</p></div><Badge className="bg-rose-50 text-[#d91b62]">{approvals.length} pending</Badge></CardHeader><CardContent className="grid gap-3">{approvals.slice(0, 5).map((item) => <div key={`${item.type}-${item.title}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.type === "job" ? "bg-rose-50 text-[#d91b62]" : "bg-sky-50 text-sky-700"}`}>{item.type === "job" ? <BriefcaseBusiness className="size-5" /> : <UserCheck className="size-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#18233f]">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.meta}</p></div><Button variant="outline" size="sm" asChild><Link href={item.href}>Review</Link></Button></div>)}{approvals.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No approvals are waiting.</p>}</CardContent></Card>
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(35,52,92,0.04)]"><CardHeader><CardTitle className="text-lg text-[#18233f]">System records</CardTitle><p className="text-sm text-slate-500">Current records stored in Firebase.</p></CardHeader><CardContent><div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-slate-50 p-5"><p className="text-2xl font-bold text-[#18233f]">{applications.length}</p><p className="mt-1 text-xs text-slate-400">Applications</p></div><div className="rounded-xl bg-slate-50 p-5"><p className="text-2xl font-bold text-[#18233f]">{jobs.length}</p><p className="mt-1 text-xs text-slate-400">Vacancies</p></div><div className="rounded-xl bg-slate-50 p-5"><p className="text-2xl font-bold text-[#18233f]">{users.length}</p><p className="mt-1 text-xs text-slate-400">Users</p></div></div></CardContent></Card>
      </section>
      {pendingEmployers.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-amber-700"><AlertCircle className="size-5" /></span><div><h2 className="font-bold text-amber-950">Employer review required</h2><p className="mt-1 text-sm text-amber-900/65">{pendingEmployers.length} employer access request{pendingEmployers.length === 1 ? " is" : "s are"} awaiting approval.</p></div></div><Button variant="outline" asChild className="mt-4 border-amber-200 bg-white text-amber-900 sm:mt-0"><Link href="/admin/users">Review requests <ArrowRight className="size-4" /></Link></Button></section>}
      <section className="grid gap-4 md:grid-cols-3">{[{ icon: UsersRound, label: "Manage users", text: "Review accounts, roles, approvals, and access status.", href: "/admin/users" }, { icon: BriefcaseBusiness, label: "Review vacancies", text: "Approve job posts and maintain consistent opportunity quality.", href: "/admin/vacancies" }, { icon: ShieldCheck, label: "Audit activity", text: "Inspect important actions recorded across the system.", href: "/admin/audit-logs" }].map((item) => <Link href={item.href} key={item.label} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><item.icon className="size-5 text-[#d91b62]" /><h2 className="mt-4 font-bold text-[#18233f] group-hover:text-[#d91b62]">{item.label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p></Link>)}</section>
    </div>
  );
}
