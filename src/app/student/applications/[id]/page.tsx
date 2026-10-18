import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Check, Download, FileText, MapPin } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { enforcePageRole } from "@/lib/auth/server";
import { getApplicationById, getApplicationHistory, getJobById, getStudentDocuments } from "@/lib/data/firestore";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await enforcePageRole("student");
  const application = await getApplicationById(id);
  if (!application || application.studentId !== user.uid) notFound();
  const [job, applicationTimeline, documents] = await Promise.all([getJobById(application.jobId), getApplicationHistory(id), getStudentDocuments(user.uid)]);
  const submittedDocuments = documents.filter((document) => document.applicationId === id || document.id === application.documentId);

  return (
    <div className="space-y-7">
      <Button variant="ghost" asChild className="-ml-3 text-slate-500"><Link href="/student/applications"><ArrowLeft className="size-4" /> All applications</Link></Button>
      <DashboardHeading title={application.jobTitle} description={`${application.department} · Submitted ${application.submittedAt}`} actions={<StatusBadge status={application.currentStatus} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
          <h2 className="text-lg font-bold text-[#18233f]">Application progress</h2>
          <p className="mt-1 text-sm text-slate-500">Updates are recorded automatically as your application moves forward.</p>
          <ol className="mt-8">
            {applicationTimeline.map((item, index) => (
              <li key={item.id} className="relative grid grid-cols-[40px_1fr] gap-4 pb-8 last:pb-0">
                {index < applicationTimeline.length - 1 && <span className={`absolute left-[19px] top-10 h-[calc(100%-32px)] w-px ${item.completed ? "bg-[#d91b62]" : "bg-slate-200"}`} />}
                <span className={`relative z-10 grid size-10 place-items-center rounded-full border-2 ${item.completed ? "border-[#d91b62] bg-[#d91b62] text-white" : "border-slate-200 bg-white text-slate-300"}`}>{item.completed ? <Check className="size-4" /> : index + 1}</span>
                <div className="pt-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className={`font-semibold ${item.completed ? "text-[#18233f]" : "text-slate-400"}`}>{item.label}</h3><time className="text-xs text-slate-400">{item.changedAt}</time></div><p className={`mt-2 text-sm leading-6 ${item.completed ? "text-slate-500" : "text-slate-400"}`}>{item.message}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-[#18233f]">Application summary</h2>
            <dl className="mt-5 grid gap-5 text-sm">
              <div className="flex gap-3"><BriefcaseBusiness className="size-5 text-[#d91b62]" /><div><dt className="text-slate-400">Work type</dt><dd className="mt-1 font-semibold text-slate-700">{job?.employmentType}</dd></div></div>
              <div className="flex gap-3"><MapPin className="size-5 text-[#d91b62]" /><div><dt className="text-slate-400">Location</dt><dd className="mt-1 font-semibold text-slate-700">{job?.location}</dd></div></div>
            </dl>
            {job && <Button variant="outline" className="mt-6 w-full" asChild><Link href={`/jobs/${job.id}`}>View original vacancy</Link></Button>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-[#18233f]">Submitted documents</h2>
            {submittedDocuments.map((document) => <div key={document.id} className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="grid size-9 place-items-center rounded-lg bg-white text-rose-600"><FileText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{document.originalName}</p><p className="text-xs text-slate-400">{Math.max(1, Math.round(document.size / 1024))} KB</p></div><Button size="icon" variant="ghost" aria-label={`Download ${document.originalName}`} asChild><a href={`/api/documents/download?ownerId=${user.uid}&documentId=${document.id}`}><Download className="size-4" /></a></Button></div>)}
            {submittedDocuments.length === 0 && <p className="mt-4 text-sm text-slate-500">No application-specific document was attached.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
