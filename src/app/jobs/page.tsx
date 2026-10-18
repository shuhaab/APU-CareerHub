import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { JobsExplorer } from "@/components/jobs-explorer";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedJobs } from "@/lib/data/firestore";

export const metadata: Metadata = { title: "Campus opportunities" };
export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const jobs = await getPublishedJobs();
  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
            <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-[#d91b62]"><BriefcaseBusiness className="size-5" /></span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#18233f] sm:text-5xl">Find your place on campus.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">Explore verified part-time, temporary, and project-based opportunities from departments across APU.</p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <JobsExplorer jobs={jobs} initialQuery={q} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
