import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { VacancyForm } from "@/components/vacancy-form";
import { enforcePageRole } from "@/lib/auth/server";
import { getVacancyEditorData } from "@/lib/data/firestore";

export default async function EditVacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await enforcePageRole("employer");
  const job = await getVacancyEditorData(id);
  if (!job || job.employerId !== user.uid || !["draft", "rejected"].includes(job.status)) notFound();

  return (
    <div className="space-y-7">
      <Button variant="ghost" asChild className="-ml-3 text-slate-500"><Link href={`/employer/vacancies/${job.id}`}><ArrowLeft className="size-4" /> Back to vacancy</Link></Button>
      <DashboardHeading title="Edit vacancy" description="Update this draft, then keep it private or submit it for administrator approval." />
      <VacancyForm vacancy={job} />
    </div>
  );
}
