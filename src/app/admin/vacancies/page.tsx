import { enforcePageRole } from "@/lib/auth/server";
import { DashboardHeading } from "@/components/app-shell";
import { AdminVacancyManagementActions } from "@/components/admin-vacancy-management-actions";
import { AdminVacancyReviewActions } from "@/components/admin-vacancy-actions";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllJobs } from "@/lib/data/firestore";
import type { Job } from "@/types";

function VacancyTable({ rows }: { rows: Job[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vacancy</TableHead>
          <TableHead>Employer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Applicants</TableHead>
          <TableHead className="w-28">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((job) => (
          <TableRow key={job.id}>
            <TableCell>
              <p className="font-semibold text-foreground">{job.title}</p>
              <p className="text-xs text-muted-foreground">{job.category} · {job.employmentType}</p>
            </TableCell>
            <TableCell className="text-muted-foreground">{job.department}</TableCell>
            <TableCell><StatusBadge status={job.status} /></TableCell>
            <TableCell className="text-muted-foreground">{job.deadline}</TableCell>
            <TableCell className="font-semibold">{job.applicants}</TableCell>
            <TableCell>
              {job.status === "pending_approval"
                ? <AdminVacancyReviewActions jobId={job.id} title={job.title} />
                : <AdminVacancyManagementActions jobId={job.id} title={job.title} status={job.status} />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AdminVacanciesPage() {
  await enforcePageRole("admin");
  const rows = await getAllJobs();
  const activeRows = rows.filter((job) => job.status !== "archived");
  const archivedRows = rows.filter((job) => job.status === "archived");

  return (
    <div className="space-y-7">
      <DashboardHeading title="Vacancy oversight" description="Approve, monitor, close, or archive job vacancies across all authorized APU employers." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
        <VacancyTable rows={activeRows} />
      </div>
      {archivedRows.length > 0 && (
        <details className="overflow-hidden rounded-2xl border border-border bg-card">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground">Archived vacancies ({archivedRows.length})</summary>
          <div className="border-t border-border"><VacancyTable rows={archivedRows} /></div>
        </details>
      )}
    </div>
  );
}
