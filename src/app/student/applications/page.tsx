import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enforcePageRole } from "@/lib/auth/server";
import { getStudentApplications } from "@/lib/data/firestore";
import type { Application } from "@/types";

function ApplicationList({ applications, showClosed = false }: { applications: Application[]; showClosed?: boolean }) {
  const rows = applications.filter((item) => showClosed ? ["rejected", "withdrawn"].includes(item.currentStatus) : !["rejected", "withdrawn"].includes(item.currentStatus));
  return (
    <div className="mt-5 grid gap-4">
      {rows.map((application) => (
        <article key={application.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-foreground"><BriefcaseBusiness className="size-5" /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="font-bold text-foreground">{application.jobTitle}</h2><StatusBadge status={application.currentStatus} /></div><p className="mt-1 text-sm text-muted-foreground">{application.department}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> Submitted {application.submittedAt}</p></div>
            <Button variant="outline" asChild><Link href={`/student/applications/${application.id}`}>View progress <ArrowRight className="size-4" /></Link></Button>
          </div>
        </article>
      ))}
      {rows.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-card px-5 py-12 text-center text-sm text-muted-foreground">No applications in this category.</p>}
    </div>
  );
}

export default async function StudentApplicationsPage() {
  const user = await enforcePageRole("student");
  const applications = await getStudentApplications(user.uid);
  return (
    <div>
      <DashboardHeading title="My applications" description="Follow every application from submission through the final decision." />
      <Tabs defaultValue="active" className="mt-7">
        <TabsList><TabsTrigger value="active">Active applications</TabsTrigger><TabsTrigger value="closed">Previous applications</TabsTrigger></TabsList>
        <TabsContent value="active"><ApplicationList applications={applications} /></TabsContent>
        <TabsContent value="closed"><ApplicationList applications={applications} showClosed /></TabsContent>
      </Tabs>
    </div>
  );
}
