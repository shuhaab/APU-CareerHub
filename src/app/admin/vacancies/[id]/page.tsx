import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, BriefcaseBusiness, Building2, CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { AdminVacancyManagementActions } from "@/components/admin-vacancy-management-actions";
import { AdminVacancyReviewActions } from "@/components/admin-vacancy-actions";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enforcePageRole } from "@/lib/auth/server";
import { getJobById } from "@/lib/data/firestore";

export default async function AdminVacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await enforcePageRole("admin");
  const job = await getJobById(id);
  if (!job) notFound();

  const actions = job.status === "pending_approval"
    ? <AdminVacancyReviewActions jobId={job.id} title={job.title} />
    : <AdminVacancyManagementActions jobId={job.id} title={job.title} status={job.status} />;

  return (
    <div className="space-y-7">
      <Button variant="ghost" asChild className="-ml-3 text-muted-foreground">
        <Link href="/admin/vacancies"><ArrowLeft className="size-4" /> All vacancies</Link>
      </Button>
      <DashboardHeading
        title={job.title}
        description={`${job.department} · ${job.category}`}
        actions={<div className="flex items-center gap-2"><StatusBadge status={job.status} />{actions}</div>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
            <h2 className="text-lg font-bold text-foreground">Opportunity description</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{job.description || "No opportunity description has been provided."}</p>
          </section>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-foreground">Responsibilities</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {job.responsibilities.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}
                {job.responsibilities.length === 0 && <li>No responsibilities have been provided.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-foreground">Requirements</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {job.requirements.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}
                {job.requirements.length === 0 && <li>No requirements have been provided.</li>}
              </ul>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-bold text-foreground">Useful skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}
              {job.skills.length === 0 && <p className="text-sm text-muted-foreground">No additional skills specified.</p>}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
          <h2 className="font-bold text-foreground">Vacancy details</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div className="flex gap-3"><Building2 className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Employer</dt><dd className="mt-1 font-medium text-foreground">{job.employerName}</dd></div></div>
            <div className="flex gap-3"><BriefcaseBusiness className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Employment type</dt><dd className="mt-1 font-medium text-foreground">{job.employmentType} · {job.workMode}</dd></div></div>
            <div className="flex gap-3"><MapPin className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Location</dt><dd className="mt-1 font-medium text-foreground">{job.location}</dd></div></div>
            <div className="flex gap-3"><Banknote className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Compensation</dt><dd className="mt-1 font-medium text-foreground">{job.compensation}</dd></div></div>
            <div className="flex gap-3"><Clock3 className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Expected hours</dt><dd className="mt-1 font-medium text-foreground">{job.hoursPerWeek}</dd></div></div>
            <div className="flex gap-3"><CalendarDays className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Application deadline</dt><dd className="mt-1 font-medium text-foreground">{job.deadline}</dd></div></div>
            <div className="flex gap-3"><UsersRound className="size-5 text-muted-foreground" /><div><dt className="text-xs text-muted-foreground">Openings</dt><dd className="mt-1 font-medium text-foreground">{job.openings}</dd></div></div>
          </dl>
          <div className="mt-6 border-t border-border pt-5"><p className="text-xs text-muted-foreground">Applications received</p><p className="mt-1 text-2xl font-bold text-foreground">{job.applicants}</p></div>
        </aside>
      </div>
    </div>
  );
}
