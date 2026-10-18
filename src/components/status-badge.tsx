import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, JobStatus } from "@/types";

const applicationStyles: Record<ApplicationStatus, string> = {
  submitted: "border-sky-200 bg-sky-50 text-sky-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-700",
  shortlisted: "border-violet-200 bg-violet-50 text-violet-700",
  interview: "border-indigo-200 bg-indigo-50 text-indigo-700",
  offered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  withdrawn: "border-slate-200 bg-slate-50 text-slate-600",
};

const jobStyles: Record<JobStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  pending_approval: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  closed: "border-rose-200 bg-rose-50 text-rose-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

const labels: Record<ApplicationStatus | JobStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  draft: "Draft",
  pending_approval: "Pending approval",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ApplicationStatus | JobStatus }) {
  const style = status in applicationStyles
    ? applicationStyles[status as ApplicationStatus]
    : jobStyles[status as JobStatus];

  return <Badge variant="outline" className={cn("font-semibold", style)}>{labels[status]}</Badge>;
}
