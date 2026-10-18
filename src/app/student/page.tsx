import Link from "next/link";
import { ArrowRight, Bookmark, BriefcaseBusiness, ClipboardList, Sparkles } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { JobCard } from "@/components/job-card";
import { LiveDashboardUpdates } from "@/components/live-dashboard-updates";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { enforcePageRole } from "@/lib/auth/server";
import { getPublishedJobs, getStudentApplications } from "@/lib/data/firestore";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await enforcePageRole("student");
  const [jobs, studentApplications] = await Promise.all([getPublishedJobs(), getStudentApplications(user.uid)]);
  const activeApplications = studentApplications.filter((item) => !["rejected", "withdrawn"].includes(item.currentStatus));
  const shortlisted = studentApplications.filter((item) => ["shortlisted", "interview", "offered"].includes(item.currentStatus));
  const dashboardMetrics = [
    { label: "Active applications", value: String(activeApplications.length), change: `${studentApplications.length} total submitted` },
    { label: "Progressing", value: String(shortlisted.length), change: "Shortlisted or beyond" },
    { label: "Available roles", value: String(jobs.length), change: "Published opportunities" },
  ];
  const completionFields = [user.profile.fullName, user.profile.studentId, user.profile.programme, user.profile.phone, user.profile.bio, user.profile.skills?.length, user.profile.availability, user.profile.availableFrom];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const missingProfileDetails = [
    [user.profile.phone, "phone number"],
    [user.profile.bio, "short introduction"],
    [user.profile.skills?.length, "skills"],
    [user.profile.availability, "weekly availability"],
    [user.profile.availableFrom, "available-from date"],
  ].filter(([value]) => !value).map(([, label]) => label);
  const profileSkills = new Set((user.profile.skills ?? []).map((skill) => skill.toLowerCase()));
  const matchScore = (job: (typeof jobs)[number]) => job.skills.filter((skill) => profileSkills.has(skill.toLowerCase())).length;
  const recommendedJobs = [...jobs].sort((a, b) => matchScore(b) - matchScore(a));
  const icons = [ClipboardList, Sparkles, Bookmark];
  return (
    <div className="space-y-8">
      <div className="-mb-4 flex justify-end"><LiveDashboardUpdates role="student" /></div>
      <DashboardHeading
        eyebrow={new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        title={`Welcome, ${user.profile.fullName.split(" ")[0]}`}
        description="Keep your applications moving and discover roles selected for your profile."
        actions={<Button asChild className="bg-[#d91b62] text-white hover:bg-[#bb164f]"><Link href="/student/jobs">Find a job <ArrowRight className="size-4" /></Link></Button>}
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="Application summary">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} icon={icons[index]} accent={index === 0 ? "navy" : index === 1 ? "pink" : "teal"} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="border-slate-200 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-lg text-[#18233f]">Application activity</CardTitle><p className="mt-1 text-sm text-slate-500">Your most recent application updates.</p></div>
            <Button variant="ghost" size="sm" asChild><Link href="/student/applications">View all <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {studentApplications.slice(0, 2).map((application) => (
              <Link href={`/student/applications/${application.id}`} key={application.id} className="group flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50/60 sm:flex-row sm:items-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef1f7] text-[#24345c]"><BriefcaseBusiness className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold text-[#18233f] group-hover:text-[#d91b62]">{application.jobTitle}</p><p className="mt-1 text-xs text-slate-400">{application.department} · Applied {application.submittedAt}</p></div>
                <StatusBadge status={application.currentStatus} />
              </Link>
            ))}
            {studentApplications.length === 0 && <p className="py-8 text-center text-sm text-slate-500">You have not submitted an application yet.</p>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-[#1d294a] text-white shadow-[0_16px_45px_rgba(29,41,74,0.18)]">
          <CardHeader><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#ff6da4]"><Sparkles className="size-4" /> Profile strength</div><CardTitle className="mt-2 text-2xl">{completion}% complete</CardTitle></CardHeader>
          <CardContent>
            <Progress value={completion} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#ff6da4]" />
            <p className="mt-4 text-sm leading-6 text-white/65">{missingProfileDetails.length > 0 ? `Add your ${missingProfileDetails.slice(0, 2).join(" and ")} to strengthen your applications.` : "Your student profile contains all recommended information."}</p>
            <Button variant="outline" asChild className="mt-5 border-white/15 bg-white/8 text-white hover:bg-white/15 hover:text-white"><Link href="/student/profile">Complete profile</Link></Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold text-[#18233f]">Recommended for you</h2><p className="mt-1 text-sm text-slate-500">{profileSkills.size > 0 ? "Ordered by skills shared with your profile." : "Add skills to your profile for more relevant recommendations."}</p></div><Button variant="outline" size="sm" asChild className="hidden sm:flex"><Link href="/student/jobs">View all jobs</Link></Button></div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{recommendedJobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} compact />)}{jobs.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-500">No published opportunities are currently available.</p>}</div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:flex sm:items-center sm:justify-between">
        <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-sky-700 shadow-sm"><BriefcaseBusiness className="size-5" /></span><div><h2 className="font-bold text-sky-950">{jobs.length} published opportunit{jobs.length === 1 ? "y" : "ies"}</h2><p className="mt-1 text-sm text-sky-900/65">{jobs[0] ? `Next available role: ${jobs[0].title} · ${jobs[0].department}` : "New campus vacancies will appear here after administrator approval."}</p></div></div>
        <Button variant="outline" asChild className="mt-4 border-sky-200 bg-white text-sky-800 sm:mt-0"><Link href="/student/jobs">Browse roles</Link></Button>
      </section>
    </div>
  );
}
