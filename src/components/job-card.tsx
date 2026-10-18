import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Clock3, MapPin, WalletCards } from "lucide-react";
import type { Job } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const departmentColors: Record<string, string> = {
  "APU Library": "bg-rose-50 text-rose-700 ring-rose-100",
  "Marketing & Communications": "bg-violet-50 text-violet-700 ring-violet-100",
  "Technology Services": "bg-sky-50 text-sky-700 ring-sky-100",
  "Student Affairs": "bg-amber-50 text-amber-700 ring-amber-100",
  "School of Computing": "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Academic Support Centre": "bg-indigo-50 text-indigo-700 ring-indigo-100",
};

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  return (
    <article className="group flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(35,52,92,0.05)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_55px_rgba(35,52,92,0.11)] sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <span className={`grid size-11 place-items-center rounded-xl ring-1 ${departmentColors[job.department] ?? "bg-slate-50 text-slate-700 ring-slate-100"}`}>
          <BriefcaseBusiness className="size-5" />
        </span>
        <Badge variant="secondary" className="max-w-[70%] rounded-full bg-slate-100 text-slate-600">{job.employmentType}</Badge>
      </div>
      <div className="mt-5 min-w-0 flex-1">
        <p className="break-words text-xs font-semibold uppercase tracking-[0.15em] text-[#d91b62] [overflow-wrap:anywhere]">{job.department}</p>
        <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-[#18233f] group-hover:text-[#d91b62] [overflow-wrap:anywhere]">{job.title}</h3>
        {!compact && <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">{job.description}</p>}
        <div className="mt-5 grid gap-2.5 text-sm text-slate-500">
          <span className="flex min-w-0 items-center gap-2 break-words [overflow-wrap:anywhere]"><MapPin className="size-4 shrink-0 text-slate-400" />{job.location}</span>
          <span className="flex min-w-0 items-center gap-2 break-words [overflow-wrap:anywhere]"><WalletCards className="size-4 shrink-0 text-slate-400" />{job.compensation}</span>
          <span className="flex min-w-0 items-center gap-2 break-words [overflow-wrap:anywhere]"><Clock3 className="size-4 shrink-0 text-slate-400" />Apply by {job.deadline}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-5">
        <span className="min-w-0 break-words text-xs font-medium text-slate-400 [overflow-wrap:anywhere]">Posted {job.postedAt}</span>
        <Button variant="ghost" size="sm" asChild className="-mr-2 text-[#24345c] hover:bg-rose-50 hover:text-[#d91b62]">
          <Link href={`/jobs/${job.id}`}>View role <ArrowUpRight className="size-4" /></Link>
        </Button>
      </div>
    </article>
  );
}
