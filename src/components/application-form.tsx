"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import type { Job, StoredDocument } from "@/types";
import { submitApplicationAction } from "@/app/actions/applications";
import { DocumentUploader } from "@/components/document-uploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export function ApplicationForm({ job, documents }: { job: Job; documents: StoredDocument[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(35,52,92,0.06)]">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-8" /></span>
        <h2 className="mt-5 text-2xl font-bold text-[#18233f]">Application submitted</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">Your application was securely saved and is now available to the authorized employer.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="bg-[#24345c] text-white"><Link href="/student/applications">View my applications <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline"><Link href="/student/jobs">Find another role</Link></Button></div>
      </div>
    );
  }

  return (
    <form onSubmit={async (event) => {
      event.preventDefault();
      setSubmitting(true);
      const result = await submitApplicationAction(new FormData(event.currentTarget));
      setSubmitting(false);
      if (!result.ok) return toast.error(result.error ?? "Application submission failed.");
      setSubmitted(true);
      toast.success("Application submitted successfully.");
    }} className="grid gap-6">
      <input type="hidden" name="jobId" value={job.id} />
      <input type="hidden" name="documentId" value={selectedDocumentId} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
        <div className="flex items-start gap-4"><span className="grid size-10 place-items-center rounded-xl bg-[#eef1f7] font-bold text-[#24345c]">1</span><div><h2 className="font-bold text-[#18233f]">Your statement</h2><p className="mt-1 text-sm text-slate-500">Explain why this opportunity is a good fit for you.</p></div></div>
        <div className="mt-6"><Label htmlFor="cover-letter">Cover letter</Label><Textarea id="cover-letter" name="coverLetter" required minLength={80} rows={8} className="mt-2" placeholder={`Tell ${job.department} about your interest, relevant skills, and availability…`} /><p className="mt-2 text-xs text-slate-400">Minimum 80 characters. Keep it focused and specific.</p></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
        <div className="flex items-start gap-4"><span className="grid size-10 place-items-center rounded-xl bg-[#eef1f7] font-bold text-[#24345c]">2</span><div><h2 className="font-bold text-[#18233f]">Supporting document</h2><p className="mt-1 text-sm text-slate-500">Select the CV you want the employer to review.</p></div></div>
        {documents.length > 0 ? (
          <RadioGroup value={selectedDocumentId} onValueChange={(value) => setSelectedDocumentId(value ?? "")} className="mt-6 gap-3" aria-label="Choose a supporting document">
            {documents.map((document) => {
              const selected = selectedDocumentId === document.id;
              return (
                <Label key={document.id} htmlFor={`application-document-${document.id}`} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
                  <RadioGroupItem id={`application-document-${document.id}`} value={document.id} className="mt-0.5" />
                  <FileText className={`mt-0.5 size-5 shrink-0 ${selected ? "text-emerald-700" : "text-slate-400"}`} />
                  <span className="min-w-0 flex-1"><span className={`block break-all text-sm font-semibold ${selected ? "text-emerald-950" : "text-[#18233f]"}`}>{document.originalName}</span><span className={`mt-1 block text-xs ${selected ? "text-emerald-700" : "text-slate-400"}`}>{Math.max(1, Math.round(document.size / 1024))} KB · Uploaded {document.createdAt}</span></span>
                  {selected && <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />}
                </Label>
              );
            })}
          </RadioGroup>
        ) : <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Upload a CV before submitting this application.</div>}
        {documents.length > 0 && !selectedDocumentId && <p role="status" className="mt-3 text-sm font-medium text-amber-700">Choose one document above to continue.</p>}
        <details className="mt-4" open={!documents.length}><summary className="cursor-pointer text-sm font-semibold text-[#d91b62]">{documents.length ? "Upload a different document" : "Upload CV"}</summary><div className="mt-4"><DocumentUploader /></div></details>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
        <div className="flex items-start gap-4"><span className="grid size-10 place-items-center rounded-xl bg-[#eef1f7] font-bold text-[#24345c]">3</span><div><h2 className="font-bold text-[#18233f]">Review and confirm</h2><p className="mt-1 text-sm text-slate-500">Confirm that the information supplied is accurate.</p></div></div>
        <Label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 leading-6"><Checkbox required className="mt-1" /><span className="text-sm font-normal text-slate-600">I confirm that this application is accurate and I authorize the relevant APU employer and administrators to review the submitted information and documents.</span></Label>
        <Button type="submit" disabled={submitting || !selectedDocumentId} size="lg" className="mt-6 w-full bg-[#d91b62] text-white hover:bg-[#bb164f]"><Send className="size-4" /> {submitting ? "Submitting…" : "Submit application securely"}</Button>
      </section>
    </form>
  );
}
