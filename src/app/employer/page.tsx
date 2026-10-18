import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, FilePlus2, Plus, UsersRound } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { LiveDashboardUpdates } from "@/components/live-dashboard-updates";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enforcePageRole } from "@/lib/auth/server";
import { getEmployerApplications, getEmployerJobs } from "@/lib/data/firestore";

export const dynamic = "force-dynamic";

export default async function EmployerDashboard() {
  const user = await enforcePageRole("employer");
  const [employerApplications, jobs] = await Promise.all([getEmployerApplications(user.uid), getEmployerJobs(user.uid)]);
  const activeJobs = jobs.filter((job) => job.status === "published");
  const applicantCounts = new Map<string, number>();
  for (const application of employerApplications) {
    applicantCounts.set(application.jobId, (applicantCounts.get(application.jobId) ?? 0) + 1);
  }
  const maxApplicants = Math.max(1, ...applicantCounts.values());
  const dashboardMetrics = [
    { label: "Active vacancies", value: String(activeJobs.length), change: `${jobs.length} total vacancy record${jobs.length === 1 ? "" : "s"}` },
    { label: "Total applicants", value: String(employerApplications.length), change: "Across your vacancies" },
    { label: "Awaiting review", value: String(employerApplications.filter((item) => item.currentStatus === "submitted").length), change: "Needs attention" },
  ];
  const icons = [BriefcaseBusiness, UsersRound, ClipboardCheck];
  return (
    <div className="space-y-8">
      <div className="-mb-4 flex justify-end"><LiveDashboardUpdates role="employer" /></div>
      <DashboardHeading eyebrow={user.profile.department} title="Recruitment overview" description="Manage your campus vacancies and keep every applicant moving through a clear review process." actions={<Button asChild className="bg-[#d91b62] text-white hover:bg-[#bb164f]"><Link href="/employer/vacancies/new"><Plus className="size-4" /> Create vacancy</Link></Button>} />
      <section className="grid gap-4 md:grid-cols-3">{dashboardMetrics.map((metric, index) => <MetricCard key={metric.label} {...metric} icon={icons[index]} accent={index === 0 ? "navy" : index === 1 ? "teal" : "pink"} />)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-lg text-[#18233f]">Recent applicants</CardTitle><p className="mt-1 text-sm text-slate-500">Latest submissions across your active vacancies.</p></div><Button variant="ghost" size="sm" asChild><Link href="/employer/applications">View all <ArrowRight className="size-4" /></Link></Button></CardHeader>
          <CardContent className="grid gap-3">
            {employerApplications.slice(0, 4).map((application) => (
              <Link href={`/employer/applications/${application.id}`} key={application.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:bg-slate-50">
                <Avatar className="size-10"><AvatarFallback className="bg-[#eef1f7] text-xs font-bold text-[#24345c]">{application.studentName.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#18233f]">{application.studentName}</p><p className="mt-1 truncate text-xs text-slate-400">{application.jobTitle} · {application.submittedAt}</p></div>
                <div className="hidden sm:block"><StatusBadge status={application.currentStatus} /></div>
              </Link>
            ))}
            {employerApplications.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No student applications have been submitted yet.</p>}
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
          <CardHeader><CardTitle className="text-lg text-[#18233f]">Vacancy performance</CardTitle><p className="text-sm text-slate-500">Live application totals by vacancy.</p></CardHeader>
          <CardContent className="grid gap-5">
            {activeJobs.slice(0, 4).map((job) => {
              const applicants = applicantCounts.get(job.id) ?? 0;
              return (
              <div key={job.id}><div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#18233f]">{job.title}</p><p className="mt-1 text-xs text-slate-400">{applicants} applicant{applicants === 1 ? "" : "s"}</p></div><span className="text-xs font-semibold capitalize text-slate-500">{job.status.replaceAll("_", " ")}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#d91b62]" style={{ width: `${(applicants / maxApplicants) * 100}%` }} /></div></div>
              );
            })}
            {activeJobs.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No vacancies are currently open. Closed vacancies remain available under Manage vacancies.</p>}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[{ icon: FilePlus2, title: "Create a vacancy", text: "Start a structured job post for administrator approval.", href: "/employer/vacancies/new" }, { icon: UsersRound, title: "Review applicants", text: "Compare applications and securely view submitted documents.", href: "/employer/applications" }, { icon: BriefcaseBusiness, title: "Manage vacancies", text: "Edit drafts, close applications, and review performance.", href: "/employer/vacancies" }].map((item) => <Link href={item.href} key={item.title} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"><item.icon className="size-5 text-[#d91b62]" /><h2 className="mt-4 font-bold text-[#18233f] group-hover:text-[#d91b62]">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p></Link>)}
      </section>
    </div>
  );
}
