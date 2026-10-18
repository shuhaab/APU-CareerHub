import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DashboardHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { VacancyForm } from "@/components/vacancy-form";

export default function NewVacancyPage() {
  return (
    <div className="space-y-7">
      <Button variant="ghost" asChild className="-ml-3 text-slate-500"><Link href="/employer/vacancies"><ArrowLeft className="size-4" /> Back to vacancies</Link></Button>
      <DashboardHeading title="Create a vacancy" description="Provide clear information so students can understand the work and submit complete applications." />
      <VacancyForm />
    </div>
  );
}
