"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save, UserRound } from "lucide-react";
import { updateApplicationStatusFormAction, type ActionResult } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applicationStatusLabels, reviewerApplicationTransitions } from "@/lib/application-status";
import type { ApplicationStatus } from "@/types";

const initialState: ActionResult = { ok: false };

export function ApplicationStatusForm({ applicationId, currentStatus }: { applicationId: string; currentStatus: ApplicationStatus }) {
  const [state, formAction, pending] = useActionState(updateApplicationStatusFormAction, initialState);
  const allowedStatuses = reviewerApplicationTransitions[currentStatus];

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eef1f7] text-[#24345c]"><UserRound className="size-5" /></span><div><h2 className="font-bold text-[#18233f]">Review decision</h2><p className="text-xs text-slate-400">Visible updates notify the student.</p></div></div>

      {state.error && (
        <div role="alert" aria-live="polite" className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{state.error}</span></div>
      )}
      {state.ok && (
        <div role="status" aria-live="polite" className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>The application status was updated successfully.</span></div>
      )}

      {allowedStatuses.length ? (
        <form action={formAction}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <div className="mt-6 grid gap-2">
            <Label htmlFor="next-application-status">Next application status</Label>
            <Select key={currentStatus} id="next-application-status" name="status" required>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose the next status" /></SelectTrigger>
              <SelectContent>{allowedStatuses.map((status) => <SelectItem key={status} value={status}>{applicationStatusLabels[status]}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs leading-5 text-slate-400">Current status: {applicationStatusLabels[currentStatus]}. Statuses move through the review process one step at a time.</p>
          </div>
          <div className="mt-5 grid gap-2"><Label htmlFor="student-message">Message to student</Label><Textarea id="student-message" name="studentMessage" rows={4} placeholder="Add a clear update for the student…" /></div>
          <div className="mt-5 grid gap-2"><Label htmlFor="internal-note">Private review note</Label><Textarea id="internal-note" name="internalNote" rows={4} placeholder="Visible only to authorized reviewers…" /></div>
          <Button type="submit" disabled={pending} className="mt-6 w-full bg-[#24345c] text-white">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            {pending ? "Saving decision…" : "Save decision"}
          </Button>
        </form>
      ) : (
        <div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-700">Review completed</p><p className="mt-1 text-xs leading-5 text-slate-500">{applicationStatusLabels[currentStatus]} is a final status and cannot be changed.</p></div>
      )}
      <p className="mt-3 text-center text-xs leading-5 text-slate-400">Every change creates an immutable status-history entry.</p>
    </aside>
  );
}
