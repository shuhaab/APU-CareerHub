import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { enforcePageRole } from "@/lib/auth/server";
import { getEmployerApplications, getEmployerJobs } from "@/lib/data/firestore";

export default async function EmployerApplicationsPage() {
  const user = await enforcePageRole("employer");
  const [employerApplications, vacancies] = await Promise.all([getEmployerApplications(user.uid), getEmployerJobs(user.uid)]);
  return (
    <div className="space-y-7">
      <DashboardHeading title="Applications" description="Review students who applied to vacancies owned by your department." />
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search applicant or student ID" /></div>
        <Select><SelectTrigger className="w-full"><SelectValue placeholder="All vacancies" /></SelectTrigger><SelectContent><SelectItem value="all">All vacancies</SelectItem>{vacancies.map((job) => <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>)}</SelectContent></Select>
        <Select><SelectTrigger className="w-full"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent>{["All statuses", "Submitted", "Under review", "Shortlisted", "Interview", "Offered", "Rejected"].map((item) => <SelectItem key={item} value={item.toLowerCase().replaceAll(" ", "-")}>{item}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
        <Table><TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Vacancy</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="w-28"><span className="sr-only">View</span></TableHead></TableRow></TableHeader>
          <TableBody>{employerApplications.map((application) => <TableRow key={application.id}><TableCell><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarFallback className="bg-[#eef1f7] text-xs font-bold text-[#24345c]">{application.studentName.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar><div><p className="font-semibold text-[#18233f]">{application.studentName}</p><p className="text-xs text-slate-400">{application.studentNumber}</p></div></div></TableCell><TableCell><p className="max-w-56 truncate text-sm font-medium">{application.jobTitle}</p></TableCell><TableCell><StatusBadge status={application.currentStatus} /></TableCell><TableCell className="text-slate-500">{application.submittedAt}</TableCell><TableCell><Button variant="ghost" size="sm" asChild><Link href={`/employer/applications/${application.id}`}>Review <ArrowRight className="size-4" /></Link></Button></TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
    </div>
  );
}
