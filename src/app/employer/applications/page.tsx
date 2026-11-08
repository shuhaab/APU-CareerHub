import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applicationStatusLabels } from "@/lib/application-status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { enforcePageRole } from "@/lib/auth/server";
import { getEmployerApplications, getEmployerJobs } from "@/lib/data/firestore";

export default async function EmployerApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await enforcePageRole("employer");
  const [employerApplications, vacancies] = await Promise.all([getEmployerApplications(user.uid), getEmployerJobs(user.uid)]);
  const filters = await searchParams;
  const query = typeof filters.q === "string" ? filters.q.trim().slice(0, 100) : "";
  const vacancy = typeof filters.vacancy === "string" ? filters.vacancy : "";
  const status = typeof filters.status === "string" ? filters.status : "";
  const matches = employerApplications.filter((application) =>
    (!vacancy || application.jobId === vacancy) && (!status || application.currentStatus === status)
    && (!query || `${application.studentName} ${application.studentNumber}`.toLowerCase().includes(query.toLowerCase())),
  );
  return (
    <div className="space-y-7">
      <DashboardHeading title="Applications" description="Review students who applied to vacancies owned by your department." />
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
        <label className="grid flex-1 gap-1 text-sm font-medium">Applicant or student ID
          <span className="relative"><Search className="absolute left-3 top-2.5 size-4" /><Input className="pl-9" name="q" defaultValue={query} maxLength={100} /></span>
        </label>
        <label className="grid gap-1 text-sm font-medium">Vacancy
          <select className="h-9 max-w-full rounded-md border border-input px-2" name="vacancy" defaultValue={vacancy}><option value="">All vacancies</option>{vacancies.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
        </label>
        <label className="grid gap-1 text-sm font-medium">Status
          <select className="h-9 rounded-md border border-input px-2" name="status" defaultValue={status}><option value="">All statuses</option>{Object.entries(applicationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <Button type="submit">Filter</Button>
      </form>
      {!matches.length && <p role="status" className="text-muted-foreground">No applications match these filters.</p>}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
        <Table><TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Vacancy</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="w-28"><span className="sr-only">View</span></TableHead></TableRow></TableHeader>
          <TableBody>{matches.map((application) => <TableRow key={application.id}><TableCell><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarFallback className="bg-muted text-xs font-bold text-foreground">{application.studentName.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar><div><p className="font-semibold text-foreground">{application.studentName}</p><p className="text-xs text-muted-foreground">{application.studentNumber}</p></div></div></TableCell><TableCell><p className="max-w-56 truncate text-sm font-medium">{application.jobTitle}</p></TableCell><TableCell><StatusBadge status={application.currentStatus} /></TableCell><TableCell className="text-muted-foreground">{application.submittedAt}</TableCell><TableCell><Button variant="ghost" size="sm" asChild><Link href={`/employer/applications/${application.id}`}>Review <ArrowRight className="size-4" /></Link></Button></TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
    </div>
  );
}
