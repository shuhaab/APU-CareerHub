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
import { getApplicationById, getStudentDocuments, getUserProfile } from "@/lib/data/firestore";

export default async function EmployerApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await enforcePageRole("employer");
  const application = await getApplicationById(id);
  if (!application || application.employerId !== user.uid) notFound();
  const [student, allDocuments] = await Promise.all([getUserProfile(application.studentId), getStudentDocuments(application.studentId)]);
  if (!student) notFound();
  const documents = allDocuments.filter((document) => document.applicationId === id || document.id === application.documentId);
  const initials = student.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const avatarUrl = student.avatarUrl ? `${student.avatarUrl}&applicationId=${encodeURIComponent(application.id)}` : undefined;
  return (
    <div className="space-y-7">
      <Button variant="ghost" asChild className="-ml-3 text-slate-500"><Link href="/employer/applications"><ArrowLeft className="size-4" /> All applications</Link></Button>
      <DashboardHeading title={student.fullName} description={`${student.studentId ?? "Student"} · Applied for ${application.jobTitle}`} actions={<StatusBadge status={application.currentStatus} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar className="size-16">{avatarUrl && <AvatarImage src={avatarUrl} alt={`${student.fullName}'s profile picture`} />}<AvatarFallback className="bg-[#eef1f7] text-lg font-bold text-[#24345c]">{initials}</AvatarFallback></Avatar><div className="flex-1"><h2 className="text-xl font-bold text-[#18233f]">{student.fullName}</h2><p className="mt-1 text-sm text-slate-500">{student.programme}</p><div className="mt-3 flex flex-wrap gap-2">{student.skills?.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div></div>
            <div className="mt-7 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2"><span className="flex gap-3 text-sm text-slate-600"><Mail className="size-4 text-slate-400" /> {student.email}</span><span className="flex gap-3 text-sm text-slate-600"><Phone className="size-4 text-slate-400" /> {student.phone || "Not supplied"}</span><span className="flex gap-3 text-sm text-slate-600"><GraduationCap className="size-4 text-slate-400" /> {student.programme}</span><span className="flex gap-3 text-sm text-slate-600"><CalendarDays className="size-4 text-slate-400" /> Submitted {application.submittedAt}</span></div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="font-bold text-[#18233f]">Cover letter</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{application.coverLetter || "No cover letter was supplied."}</p></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="font-bold text-[#18233f]">Submitted documents</h2>{documents.map((document) => <div key={document.id} className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-4"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#d91b62]"><FileText className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{document.originalName}</p><p className="text-xs text-slate-400">{Math.max(1, Math.round(document.size / 1024))} KB · Protected document</p></div><Button variant="outline" size="sm" asChild><a href={`/api/documents/download?ownerId=${student.id}&documentId=${document.id}&applicationId=${application.id}`}><Download className="size-4" /> Download</a></Button></div>)}{documents.length === 0 && <p className="mt-4 text-sm text-slate-500">No application-specific document was attached.</p>}</section>
        </div>
        <ApplicationStatusForm applicationId={application.id} currentStatus={application.currentStatus} />
      </div>
    </div>
  );
}
