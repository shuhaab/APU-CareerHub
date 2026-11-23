import { ApplicationThread } from "@/components/application-thread";
import { getApplicationThread } from "@/lib/application-thread";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, FileText, GraduationCap, Mail, Phone } from "lucide-react";
import { ApplicationStatusForm } from "@/components/application-status-form";
import { DashboardHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enforcePageRole } from "@/lib/auth/server";
import { getApplicationById, getEmployerReviewNotes, getStudentDocuments, getUserProfile } from "@/lib/data/firestore";

export default async function EmployerApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string }> }) {
  const { id } = await params;
  const user = await enforcePageRole("employer");
  const application = await getApplicationById(id);
  if (!application || application.employerId !== user.uid) notFound();
  const [student, allDocuments, notes] = await Promise.all([getUserProfile(application.studentId), getStudentDocuments(application.studentId), getEmployerReviewNotes(id, user.uid)]);
  if (!student) notFound();
  const documents = allDocuments.filter((document) => document.id === application.documentId);
  const initials = student.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const avatarUrl = student.avatarUrl ? `${student.avatarUrl}&applicationId=${encodeURIComponent(application.id)}` : undefined;
  const { before } = await searchParams;
  const thread = await getApplicationThread(user, id, before);

  return (
    <div className="space-y-7">
      <Button variant="ghost" asChild className="-ml-3 text-muted-foreground"><Link href="/employer/applications"><ArrowLeft className="size-4" /> All applications</Link></Button>
      <DashboardHeading title={student.fullName} description={`${student.studentId ?? "Student"} · Applied for ${application.jobTitle}`} actions={<StatusBadge status={application.currentStatus} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar className="size-16">{avatarUrl && <AvatarImage src={avatarUrl} alt={`${student.fullName}'s profile picture`} />}<AvatarFallback className="bg-muted text-lg font-bold text-foreground">{initials}</AvatarFallback></Avatar><div className="flex-1"><h2 className="text-xl font-bold text-foreground">{student.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">{student.programme}</p><div className="mt-3 flex flex-wrap gap-2">{student.skills?.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div></div>
            <div className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"><span className="flex gap-3 text-sm text-muted-foreground"><Mail className="size-4 text-muted-foreground" /> {student.email}</span><span className="flex gap-3 text-sm text-muted-foreground"><Phone className="size-4 text-muted-foreground" /> {student.phone || "Not supplied"}</span><span className="flex gap-3 text-sm text-muted-foreground"><GraduationCap className="size-4 text-muted-foreground" /> {student.programme}</span><span className="flex gap-3 text-sm text-muted-foreground"><CalendarDays className="size-4 text-muted-foreground" /> Submitted {application.submittedAt}</span></div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><h2 className="font-bold text-foreground">Cover letter</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{application.coverLetter || "No cover letter was supplied."}</p></section>
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><h2 className="font-bold text-foreground">Submitted documents</h2>{documents.map((document) => <div key={document.id} className="mt-4 flex items-center gap-3 rounded-xl border border-border p-4"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-primary"><FileText className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{document.originalName}</p><p className="text-xs text-muted-foreground">{Math.max(1, Math.round(document.size / 1024))} KB · Protected document</p></div><Button variant="outline" size="sm" asChild><a href={`/api/documents/download?ownerId=${student.id}&documentId=${document.id}&applicationId=${application.id}`}><Download className="size-4" /> Download</a></Button></div>)}{documents.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No application-specific document was attached.</p>}</section>
          {notes.length > 0 && <section className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="font-semibold">Private review notes</h2>
            <ul className="mt-3 grid gap-3">{notes.map((entry) => <li key={entry.id} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{entry.changedAt}</p><p className="mt-1 whitespace-pre-wrap text-sm">{entry.note}</p></li>)}</ul>
          </section>}
        </div>
        <ApplicationStatusForm applicationId={application.id} currentStatus={application.currentStatus} version={application.version} />
      </div>
      {thread && <ApplicationThread applicationId={id} path={`/employer/applications/${id}`} thread={thread} olderView={Boolean(before)} />}
    </div>
  );
}
