"use client";

import { useActionState, useState } from "react";
import { AlertCircle, LoaderCircle, Save, Send } from "lucide-react";
import { createVacancyFormAction, updateVacancyFormAction } from "@/app/actions/vacancies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/app/actions/applications";
import type { VacancyEditorData } from "@/types";

const initialState: ActionResult = { ok: false };

export function VacancyForm({ vacancy }: { vacancy?: VacancyEditorData }) {
  const action = vacancy ? updateVacancyFormAction : createVacancyFormAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [submittingIntent, setSubmittingIntent] = useState<"draft" | "submit" | null>(null);

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
      {vacancy && <input type="hidden" name="jobId" value={vacancy.id} />}
      {state.error && (
        <div role="alert" aria-live="polite" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div><p className="text-sm font-bold">Vacancy could not be saved</p><p className="mt-1 text-sm leading-6 text-rose-800/80">{state.error}</p></div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="job-title">Job title</Label><Input id="job-title" name="title" required minLength={5} defaultValue={vacancy?.title} placeholder="e.g. Library Services Assistant" /></div>
        <div className="grid gap-2"><Label htmlFor="job-category">Category</Label><Select id="job-category" name="category" required defaultValue={vacancy?.category || undefined}><SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{["Student Services", "Technology", "Marketing", "Research", "Events", "Education", "Other"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid gap-2"><Label htmlFor="job-employment-type">Employment type</Label><Select id="job-employment-type" name="employmentType" required defaultValue={vacancy?.employmentType || undefined}><SelectTrigger className="w-full"><SelectValue placeholder="Select work type" /></SelectTrigger><SelectContent><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Temporary">Temporary</SelectItem><SelectItem value="Project-based">Project-based</SelectItem></SelectContent></Select></div>
        <div className="grid gap-2"><Label htmlFor="job-location">Location</Label><Input id="job-location" name="location" required defaultValue={vacancy?.location} placeholder="APU Campus, Level 3" /></div>
        <div className="grid gap-2"><Label htmlFor="job-work-mode">Work arrangement</Label><Select id="job-work-mode" name="workMode" required defaultValue={vacancy?.workMode || undefined}><SelectTrigger className="w-full"><SelectValue placeholder="Choose arrangement" /></SelectTrigger><SelectContent><SelectItem value="On campus">On campus</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem></SelectContent></Select></div>
        <div className="grid gap-2"><Label htmlFor="job-compensation">Compensation</Label><Input id="job-compensation" name="compensation" required defaultValue={vacancy?.compensation} placeholder="RM 12/hour" /></div>
        <div className="grid gap-2"><Label htmlFor="job-hours">Expected weekly hours</Label><Input id="job-hours" name="hoursPerWeek" required defaultValue={vacancy?.hoursPerWeek} placeholder="12–16 hours" /></div>
        <div className="grid gap-2"><Label htmlFor="job-deadline">Application deadline</Label><Input id="job-deadline" name="deadline" type="date" required defaultValue={vacancy?.deadline} /></div>
        <div className="grid gap-2"><Label htmlFor="job-openings">Number of openings</Label><Input id="job-openings" name="openings" type="number" min={1} max={100} required defaultValue={vacancy?.openings ?? 1} /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="job-description">Opportunity description</Label><Textarea id="job-description" name="description" required minLength={80} rows={5} defaultValue={vacancy?.description} placeholder="Describe the role, its purpose, and the experience a student will gain…" /><p className="text-xs text-slate-400">Minimum 80 characters when submitting for approval.</p></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="job-responsibilities">Responsibilities</Label><Textarea id="job-responsibilities" name="responsibilities" required rows={5} defaultValue={vacancy?.responsibilities} placeholder="Enter one responsibility per line" /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="job-requirements">Requirements</Label><Textarea id="job-requirements" name="requirements" required rows={5} defaultValue={vacancy?.requirements} placeholder="Enter one requirement per line" /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="job-skills">Useful skills</Label><Input id="job-skills" name="skills" defaultValue={vacancy?.skills} placeholder="Customer service, Communication, Organisation" /><p className="text-xs text-slate-400">Separate skills with commas.</p></div>
      </div>

      <div className="mt-8 flex flex-col justify-end gap-3 border-t border-slate-200 pt-6 sm:flex-row">
        <Button type="submit" name="intent" value="draft" formNoValidate variant="outline" disabled={pending} onClick={() => setSubmittingIntent("draft")}>
          {pending && submittingIntent === "draft" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {pending && submittingIntent === "draft" ? "Saving draft…" : "Save draft"}
        </Button>
        <Button type="submit" name="intent" value="submit" disabled={pending} onClick={() => setSubmittingIntent("submit")} className="bg-[#d91b62] text-white hover:bg-[#bb164f]">
          {pending && submittingIntent === "submit" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending && submittingIntent === "submit" ? "Submitting…" : vacancy ? "Save and submit" : "Submit for approval"}
        </Button>
      </div>
    </form>
  );
}
