import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { EmployerVacancyActions } from "@/components/employer-vacancy-actions";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { enforcePageRole } from "@/lib/auth/server";
import { getEmployerJobs } from "@/lib/data/firestore";

export default async function EmployerVacanciesPage() {
  const user = await enforcePageRole("employer");
  const employerJobs = await getEmployerJobs(user.uid);
  return (
    <div className="space-y-7">
      <DashboardHeading title="Vacancies" description="Create, submit, and manage employment opportunities owned by your department." actions={<Button asChild className="bg-primary text-primary-foreground hover:bg-primary-hover"><Link href="/employer/vacancies/new"><Plus className="size-4" /> New vacancy</Link></Button>} />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
        <Table>
          <TableHeader><TableRow><TableHead>Vacancy</TableHead><TableHead>Status</TableHead><TableHead>Deadline</TableHead><TableHead className="text-right">Applicants</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
          <TableBody>{employerJobs.map((job) => <TableRow key={job.id}><TableCell><div className="font-semibold text-foreground">{job.title}</div><div className="mt-1 text-xs text-muted-foreground">{job.employmentType} · {job.location}</div></TableCell><TableCell><StatusBadge status={job.status} /></TableCell><TableCell className="text-muted-foreground">{job.deadline}</TableCell><TableCell className="text-right font-semibold">{job.applicants}</TableCell><TableCell><EmployerVacancyActions jobId={job.id} title={job.title} status={job.status} /></TableCell></TableRow>)}</TableBody>
          {employerJobs.length === 0 && <caption className="py-10 text-sm text-muted-foreground">No vacancies have been created yet.</caption>}
        </Table>
      </div>
    </div>
  );
}
