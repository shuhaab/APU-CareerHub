import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fb] p-5"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(35,52,92,0.08)] sm:p-12"><div className="flex justify-center"><BrandMark /></div><span className="mx-auto mt-10 grid size-16 place-items-center rounded-2xl bg-rose-50 text-[#d91b62]"><SearchX className="size-7" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#d91b62]">404 · Not found</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-[#18233f]">This page is not available.</h1><p className="mt-3 text-sm leading-6 text-slate-500">The opportunity may have closed, or the address may be incorrect.</p><Button asChild className="mt-7 bg-[#24345c] text-white"><Link href="/jobs"><ArrowLeft className="size-4" /> Browse open jobs</Link></Button></div></main>;
}
