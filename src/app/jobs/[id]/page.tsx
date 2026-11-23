import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, MapPin, Share2, WalletCards } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPublicJobById } from "@/lib/data/firestore";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobById(id);
  return { title: job?.title ?? "Job opportunity", description: job?.description };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto min-w-0 max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
            <Button variant="ghost" asChild className="-ml-3 text-muted-foreground"><Link href="/jobs"><ArrowLeft className="size-4" /> Back to opportunities</Link></Button>
            <div className="mt-7 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
              <div className="min-w-0 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-rose-200 bg-rose-50 text-primary" variant="outline">{job.category}</Badge>
                  <Badge variant="secondary">{job.employmentType}</Badge>
                </div>
                <h1 className="font-public mt-5 break-words text-balance text-3xl font-semibold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl">{job.title}</h1>
                <p className="mt-4 break-words text-lg font-medium text-muted-foreground [overflow-wrap:anywhere]">{job.department}</p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-2 break-words [overflow-wrap:anywhere]"><MapPin className="size-4 shrink-0" />{job.location}</span>
                  <span className="flex min-w-0 items-center gap-2 break-words [overflow-wrap:anywhere]"><WalletCards className="size-4 shrink-0" />{job.compensation}</span>
                  <span className="flex min-w-0 items-center gap-2 break-words [overflow-wrap:anywhere]"><Clock3 className="size-4 shrink-0" />{job.hoursPerWeek}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="lg" aria-label="Share opportunity"><Share2 className="size-4" /> Share</Button>
                <Button asChild size="lg" className="bg-primary px-7 text-white hover:bg-primary-hover"><Link href={`/jobs/${job.id}/apply`}>Apply now <ArrowRight className="size-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid min-w-0 max-w-6xl grid-cols-1 gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_12px_40px_rgba(35,52,92,0.05)] sm:p-8">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">About this opportunity</h2>
              <p className="mt-4 break-words leading-7 text-muted-foreground [overflow-wrap:anywhere]">{job.description}</p>
            </div>
            <Separator className="my-8" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">What you will do</h2>
              <ul className="mt-5 grid gap-3">
                {job.responsibilities.map((item) => <li key={item} className="flex min-w-0 gap-3 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />{item}</li>)}
              </ul>
            </div>
            <Separator className="my-8" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">What we are looking for</h2>
              <ul className="mt-5 grid gap-3">
                {job.requirements.map((item) => <li key={item} className="flex min-w-0 gap-3 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />{item}</li>)}
              </ul>
            </div>
            <Separator className="my-8" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">Useful skills</h2>
              <div className="mt-4 flex min-w-0 flex-wrap gap-2">{job.skills.map((skill) => <Badge key={skill} variant="secondary" className="h-auto max-w-full break-words whitespace-normal rounded-full px-3 py-1.5 [overflow-wrap:anywhere]">{skill}</Badge>)}</div>
            </div>
          </article>

          <aside className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_12px_40px_rgba(35,52,92,0.05)]">
              <h2 className="font-bold text-foreground">Application details</h2>
              <dl className="mt-5 grid gap-5 text-sm">
                <div className="flex gap-3"><CalendarDays className="size-5 text-primary" /><div><dt className="font-medium text-muted-foreground">Deadline</dt><dd className="mt-1 font-semibold text-foreground">{job.deadline}</dd></div></div>
                <div className="flex gap-3"><BriefcaseBusiness className="size-5 text-primary" /><div><dt className="font-medium text-muted-foreground">Work arrangement</dt><dd className="mt-1 font-semibold text-foreground">{job.workMode}</dd></div></div>
                <div className="flex gap-3"><Clock3 className="size-5 text-primary" /><div><dt className="font-medium text-muted-foreground">Expected hours</dt><dd className="mt-1 font-semibold text-foreground">{job.hoursPerWeek}</dd></div></div>
              </dl>
              <Button asChild className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary-hover"><Link href={`/jobs/${job.id}/apply`}>Start application</Link></Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">You can review everything before submitting.</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
              <h2 className="text-sm font-bold text-sky-900">Need help applying?</h2>
              <p className="mt-2 text-sm leading-6 text-sky-800/70">Contact Student Services if you need accessibility support or help preparing your documents.</p>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
