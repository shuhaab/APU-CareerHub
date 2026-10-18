import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Clock3, MapPin } from "lucide-react";
import { ApplicationForm } from "@/components/application-form";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { enforcePageRole } from "@/lib/auth/server";
import { getJobById, getStudentDocuments } from "@/lib/data/firestore";

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await enforcePageRole("student");
  const { id } = await params;
  const [documents, job] = await Promise.all([getStudentDocuments(user.uid), getJobById(id)]);
  if (!job || job.status !== "published") notFound();
  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
        <Button variant="ghost" asChild className="-ml-3 text-slate-500"><Link href={`/jobs/${job.id}`}><ArrowLeft className="size-4" /> Back to job details</Link></Button>
        <div className="mt-6 rounded-2xl bg-[#1d294a] p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff6da4]">Application</p><h1 className="mt-3 text-2xl font-bold sm:text-3xl">{job.title}</h1><p className="mt-2 text-white/60">{job.department}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60"><span className="flex items-center gap-2"><MapPin className="size-4" />{job.location}</span><span className="flex items-center gap-2"><Clock3 className="size-4" />Deadline {job.deadline}</span><span className="flex items-center gap-2"><BriefcaseBusiness className="size-4" />{job.employmentType}</span></div>
        </div>
        <div className="mt-7"><ApplicationForm job={job} documents={documents} /></div>
      </main>
    </div>
  );
}
