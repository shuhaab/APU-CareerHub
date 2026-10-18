"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Eye, FilePenLine, LoaderCircle, LockKeyhole, MoreHorizontal, Send } from "lucide-react";
import { toast } from "sonner";
import { closeVacancyAction, submitVacancyForApprovalAction } from "@/app/actions/vacancies";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { JobStatus } from "@/types";

export function EmployerVacancyActions({ jobId, title, status }: { jobId: string; title: string; status: JobStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(action: "submit" | "close") {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("jobId", jobId);
      const result = action === "submit" ? await submitVacancyForApprovalAction(formData) : await closeVacancyAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "The vacancy could not be updated.");
        return;
      }
      toast.success(action === "submit" ? "Vacancy submitted for administrator approval." : "Vacancy closed successfully.");
      router.refresh();
    } catch {
      toast.error("The vacancy could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${title}`} disabled={busy} />}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem render={<Link href={`/employer/vacancies/${jobId}`} />}><Eye /> View vacancy</DropdownMenuItem>
        {(status === "draft" || status === "rejected") && <DropdownMenuItem render={<Link href={`/employer/vacancies/${jobId}/edit`} />}><FilePenLine /> Edit details</DropdownMenuItem>}
        {(status === "draft" || status === "rejected") && <DropdownMenuItem onClick={() => updateStatus("submit")}><Send /> Submit for approval</DropdownMenuItem>}
        {(status === "published" || status === "closed") && <DropdownMenuItem render={<Link href="/employer/applications" />}><ClipboardList /> View applications</DropdownMenuItem>}
        {status === "published" && <DropdownMenuItem variant="destructive" onClick={() => updateStatus("close")}><LockKeyhole /> Close vacancy</DropdownMenuItem>}
        {status === "pending_approval" && <DropdownMenuItem disabled><LoaderCircle /> Awaiting administrator approval</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
