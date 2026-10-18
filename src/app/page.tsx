import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { JobCard } from "@/components/job-card";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublishedJobs } from "@/lib/data/firestore";
import { getSessionUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Explore campus roles",
    description: "Search verified opportunities from APU departments and approved campus employers.",
  },
  {
    number: "02",
    icon: FileCheck2,
    title: "Apply with confidence",
    description: "Submit your application and supporting documents through one secure process.",
  },
  {
    number: "03",
    icon: BadgeCheck,
    title: "Follow every update",
    description: "Track reviews, shortlisting, interviews, and final decisions from your dashboard.",
  },
];

export default async function Home() {
  const [jobs, user] = await Promise.all([getPublishedJobs(6), getSessionUser()]);
  const dashboardHref = user ? `/${user.role}` : null;
  const featuredJobs = [...jobs.filter((job) => job.featured), ...jobs.filter((job) => !job.featured)].slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader sessionUser={user} />

      <main>
        <section className="hero-glow surface-grid relative overflow-hidden border-b border-slate-200/70">
          <div className="absolute -left-28 top-20 size-80 rounded-full bg-[#d91b62]/8 blur-3xl" />
          <div className="absolute -right-32 bottom-10 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-12 px-5 py-18 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-28">
            <div className="min-w-0">
              <Badge variant="outline" className="rounded-full border-rose-200 bg-white/80 px-3 py-1.5 text-[#b81450] shadow-sm">
                <Sparkles className="size-3.5" /> Built for the APU community
              </Badge>
              <h1 className="mt-7 max-w-3xl text-balance text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-[#18233f] sm:text-6xl lg:text-[4.6rem]">
                Your next opportunity is <span className="text-gradient">already on campus.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-slate-600">
                Discover meaningful on-campus work, build practical experience, and manage every application in one trusted APU portal.
              </p>

              <form action="/jobs" className="glass-panel mt-8 flex min-w-0 max-w-2xl flex-col gap-3 rounded-2xl border border-white p-2.5 shadow-[0_20px_60px_rgba(35,52,92,0.14)] sm:flex-row">
                <label htmlFor="home-job-search" className="sr-only">Search job title or department</label>
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <Input id="home-job-search" name="q" placeholder="Job title, department, or skill" className="h-12 border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0" />
                </div>
                <Button type="submit" size="lg" className="h-12 bg-[#d91b62] px-7 font-semibold text-white shadow-md shadow-rose-200 hover:bg-[#bb164f]">
                  Search opportunities <ArrowRight className="size-4" />
                </Button>
              </form>

              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
                <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> Verified campus roles</span>
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-600" /> Private applications</span>
                <span className="flex items-center gap-2"><Clock3 className="size-4 text-emerald-600" /> Live status tracking</span>
              </div>
            </div>

            <div className="relative mx-auto min-w-0 w-full max-w-xl lg:mx-0 lg:ml-auto">
              <div className="absolute -left-10 top-14 hidden rounded-2xl border border-white bg-white/90 p-4 shadow-xl backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><BadgeCheck className="size-5" /></span>
                  <div><p className="text-xs text-slate-400">Application update</p><p className="text-sm font-bold text-[#18233f]">You were shortlisted</p></div>
                </div>
              </div>
              <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/90 bg-[#1d294a] p-3 shadow-[0_35px_100px_rgba(27,39,73,0.28)]">
                <div className="min-w-0 rounded-[1.45rem] bg-[#f7f8fb] p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d91b62]">Student overview</p>
                      <h2 className="mt-1 text-xl font-bold text-[#18233f]">Your career overview</h2>
                    </div>
                    <span className="grid size-10 place-items-center rounded-full bg-[#24345c] text-xs font-bold text-white">AR</span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[{ value: "3", label: "Applications" }, { value: "1", label: "Shortlisted" }, { value: "6", label: "Saved jobs" }].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                        <p className="text-2xl font-bold text-[#18233f]">{item.value}</p><p className="mt-1 text-[11px] text-slate-400">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-[#d91b62]"><BriefcaseBusiness className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                          <div className="min-w-0"><p className="truncate font-bold text-[#18233f]">Library Services Assistant</p><p className="mt-1 text-xs text-slate-400">APU Library</p></div>
                          <Badge className="border-violet-200 bg-violet-50 text-violet-700" variant="outline">Shortlisted</Badge>
                        </div>
                        <div className="mt-5 flex items-center gap-1.5">
                          {[true, true, true, false, false].map((active, index) => (
                            <div key={index} className={`h-1.5 flex-1 rounded-full ${active ? "bg-[#d91b62]" : "bg-slate-100"}`} />
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">Next step: interview scheduling</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {jobs.slice(1, 3).map((job) => (
                      <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[#24345c]"><Building2 className="size-4" /></span><span className="text-[10px] font-semibold text-slate-400">{job.employmentType}</span></div>
                        <p className="mt-4 line-clamp-1 text-sm font-bold text-[#18233f]">{job.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><MapPin className="size-3" /> {job.workMode}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-7 -right-4 hidden w-48 rounded-2xl border border-white bg-white/92 p-4 shadow-xl backdrop-blur sm:block">
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><UsersRound className="size-4" /></span><div><p className="text-lg font-bold text-[#18233f]">1,240+</p><p className="text-[11px] text-slate-400">student profiles</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-100 px-5 py-7 sm:grid-cols-4 sm:px-8 lg:px-10">
            {[
              [String(jobs.length), "Open campus roles"], ["APU", "Verified departments"], ["Live", "Application visibility"], ["One", "Trusted portal"],
            ].map(([value, label]) => (
              <div key={label} className="px-4 py-3 text-center"><p className="text-2xl font-bold text-[#18233f]">{value}</p><p className="mt-1 text-xs font-medium text-slate-400">{label}</p></div>
            ))}
          </div>
        </section>

        <section className="bg-[#f7f8fb] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d91b62]">Fresh opportunities</p>
                <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-[#18233f] sm:text-4xl">Find work that fits around your studies.</h2>
              </div>
              <Button variant="outline" asChild className="w-fit bg-white"><Link href="/jobs">View all jobs <ArrowRight className="size-4" /></Link></Button>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => <JobCard key={job.id} job={job} />)}
              {featuredJobs.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No published opportunities are available yet.</p>}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d91b62]">Simple by design</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[#18233f] sm:text-4xl">From discovery to decision, all in one place.</h2>
              <p className="mt-4 text-base leading-7 text-slate-500">A clear process gives every student confidence about what happens next.</p>
            </div>
            <div className="relative mt-12 grid gap-5 md:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-11 hidden h-px bg-slate-200 md:block" />
              {steps.map((step) => (
                <div key={step.number} className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_12px_40px_rgba(35,52,92,0.05)]">
                  <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[#24345c] text-white shadow-lg shadow-slate-300"><step.icon className="size-6" /></span>
                  <span className="mt-5 block text-[11px] font-bold tracking-[0.2em] text-[#d91b62]">STEP {step.number}</span>
                  <h3 className="mt-2 text-lg font-bold text-[#18233f]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="for-employers" className="bg-[#1d294a] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
            <div>
              <Badge className="rounded-full border-white/15 bg-white/8 text-white" variant="outline"><Building2 className="size-3.5" /> For APU employers</Badge>
              <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Find capable students without losing time to scattered forms.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65">Create structured vacancies, review complete applications, and move candidates through a transparent process.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {["One applicant pipeline", "Secure document review", "Consistent status updates", "Department-level ownership"].map((item) => (
                  <span key={item} className="flex items-center gap-3 text-sm font-medium text-white/80"><CheckCircle2 className="size-5 text-[#ff6da4]" />{item}</span>
                ))}
              </div>
              <Button asChild size="lg" className="mt-9 bg-white text-[#1d294a] hover:bg-slate-100"><Link href={dashboardHref ?? "/register"}>{dashboardHref ? "Go to dashboard" : "Request employer access"} <ArrowRight className="size-4" /></Link></Button>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl">
              <div className="rounded-2xl bg-white p-5 text-slate-900 sm:p-7">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-[#d91b62]">RECRUITMENT OVERVIEW</p><p className="mt-1 text-xl font-bold text-[#18233f]">Library Services Assistant</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Published</span></div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[['18','Applicants'],['6','Shortlisted'],['3','Interviews']].map(([value,label]) => <div key={label} className="rounded-xl bg-[#f6f7fa] p-3 text-center"><p className="text-xl font-bold text-[#18233f]">{value}</p><p className="mt-1 text-[10px] text-slate-400">{label}</p></div>)}
                </div>
                <div className="mt-5 space-y-3">
                  {[["Student applicant", "Shortlisted"], ["Student applicant", "Interview"], ["Student applicant", "In review"]].map(([name,status], index) => <div key={`${name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="grid size-9 place-items-center rounded-full bg-[#eef1f7] text-xs font-bold text-[#24345c]">S{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-slate-400">{status}</p></div></div>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#f8edf3] px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="absolute -left-10 -top-20 size-56 rounded-full bg-[#d91b62]/10" />
              <div className="absolute -bottom-28 -right-8 size-64 rounded-full bg-cyan-400/10" />
              <div className="relative">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[#d91b62] shadow-sm"><GraduationCap className="size-7" /></span>
                <h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight text-[#18233f] sm:text-4xl">Build experience before you leave campus.</h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">Create your profile once, then use it to discover and manage verified opportunities across APU.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" className="bg-[#d91b62] text-white hover:bg-[#bb164f]"><Link href={dashboardHref ?? "/register"}>{dashboardHref ? "Go to dashboard" : "Create student account"} <ArrowRight className="size-4" /></Link></Button>
                  <Button asChild size="lg" variant="outline" className="bg-white"><Link href="/jobs">Browse open roles</Link></Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter sessionUser={user} />
    </div>
  );
}
