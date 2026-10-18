import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[.9fr_1.1fr]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <BrandMark />
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
        <p className="text-center text-xs text-slate-400">By continuing, you agree to the portal’s acceptable-use and privacy requirements.</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-[#1d294a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-20 size-96 rounded-full bg-[#d91b62]/22 blur-2xl" />
        <div className="absolute -bottom-40 -left-20 size-[30rem] rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="surface-grid absolute inset-0 opacity-[0.08]" />
        <div className="relative ml-auto"><Link href="/jobs" className="text-sm font-medium text-white/70 hover:text-white">Browse jobs without signing in →</Link></div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff6da4]">APU CareerHub</p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight xl:text-5xl">One place to turn campus time into career experience.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">A transparent employment experience for APU students, departments, and administrators.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {["Verified on-campus vacancies", "Secure document management", "Clear application timelines", "Role-based access control"].map((item) => (
              <span key={item} className="flex items-center gap-3 text-sm font-medium text-white/80"><CheckCircle2 className="size-5 text-[#ff6da4]" />{item}</span>
            ))}
          </div>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur">
          <p className="text-sm leading-6 text-white/75">“The portal helps students see where they stand and helps departments review every candidate consistently.”</p>
          <p className="mt-4 text-xs font-semibold text-white/45">Student Services · Secure employment portal</p>
        </div>
      </aside>
    </main>
  );
}
