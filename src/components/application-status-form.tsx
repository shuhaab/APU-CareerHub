"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, Save, UserRound } from "lucide-react";
import { updateApplicationStatusAction, type ActionResult } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applicationStatusLabels, reviewerApplicationTransitions } from "@/lib/application-status";
import type { ApplicationStatus } from "@/types";

const initialState: ActionResult = { ok: false };

export function ApplicationStatusForm({ applicationId, currentStatus, version }: { applicationId: string; version: string; currentStatus: ApplicationStatus }) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const [draftVersion, setDraftVersion] = useState<string>();
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const allowedStatuses = reviewerApplicationTransitions[currentStatus];

  return (
    <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground"><UserRound className="size-5" /></span><div><h2 className="font-bold text-foreground">Review decision</h2><p className="text-xs text-muted-foreground">Visible updates notify the student.</p></div></div>

      {state.error && (
        <div role="alert" aria-live="polite" className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{state.error}</span></div>
      )}
      {state.ok && (
        <div role="status" aria-live="polite" className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>The application status was updated successfully.</span></div>
      )}

      {allowedStatuses.length ? (
        <form onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          const data = new FormData(event.currentTarget);
          data.set("version", draftVersion ?? version);
          try {
            const result = await updateApplicationStatusAction(data);
            setState(result);
            if (result.ok) { setMessage(""); setNote(""); setDraftVersion(undefined); router.refresh(); }
          } catch {
            setState({ ok: false, error: "The decision could not be saved. Try again." });
          } finally {
            setPending(false);
          }
        }} onChange={() => setDraftVersion((previous) => previous ?? version)}>
          {state.conflict && <Button type="button" variant="outline" className="mt-3" onClick={() => {
            router.refresh();
            setDraftVersion(undefined);
            setState(initialState);
          }}>Load latest status</Button>}
          <input type="hidden" name="applicationId" value={applicationId} />
          <div className="mt-6 grid gap-2">
            <Label htmlFor="next-application-status">Next application status</Label>
            <Select key={currentStatus} id="next-application-status" name="status" required>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose the next status" /></SelectTrigger>
              <SelectContent>{allowedStatuses.map((status) => <SelectItem key={status} value={status}>{applicationStatusLabels[status]}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">Current status: {applicationStatusLabels[currentStatus]}. Statuses move through the review process one step at a time.</p>
          </div>
          <div className="mt-5 grid gap-2"><Label htmlFor="student-message">Message to student</Label><Textarea id="student-message" name="studentMessage" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={4} placeholder="Add a clear update for the student…" /></div>
          <div className="mt-5 grid gap-2"><Label htmlFor="internal-note">Private review note</Label><Textarea id="internal-note" name="internalNote" value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={4} placeholder="Visible only to authorized reviewers…" /></div>
          <Button type="submit" disabled={pending || state.conflict} className="mt-6 w-full bg-primary text-primary-foreground">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            {pending ? "Saving decision…" : "Save decision"}
          </Button>
        </form>
      ) : (
        <div className="mt-6 rounded-xl bg-muted p-4"><p className="text-sm font-semibold text-foreground">Review completed</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{applicationStatusLabels[currentStatus]} is a final status and cannot be changed.</p></div>
      )}
      <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Every change creates an immutable status-history entry.</p>
    </aside>
  );
}
