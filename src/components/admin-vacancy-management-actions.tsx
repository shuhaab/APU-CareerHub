"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Eye, LoaderCircle, LockKeyhole, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { archiveVacancyAction, closeVacancyAsAdminAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { canAdminArchiveVacancy, canAdminCloseVacancy } from "@/lib/vacancies/admin-status";
import type { JobStatus } from "@/types";

type VacancyAction = "close" | "archive";

export function AdminVacancyManagementActions({ jobId, title, status }: { jobId: string; title: string; status: JobStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<VacancyAction | null>(null);

  async function updateVacancy(action: VacancyAction) {
    const prompt = action === "close"
      ? `Close “${title}”? Students will no longer be able to discover or apply for this vacancy.`
      : `Archive “${title}”? The record will remain available to administrators but will be removed from active vacancy workflows.`;
    if (!window.confirm(prompt)) return;

    setBusy(action);
    try {
      const formData = new FormData();
      formData.set("jobId", jobId);
      const result = action === "close"
        ? await closeVacancyAsAdminAction(formData)
        : await archiveVacancyAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "The vacancy could not be updated.");
        return;
      }
      toast.success(action === "close" ? `“${title}” has been closed.` : `“${title}” has been archived.`);
      router.refresh();
    } catch {
      toast.error("The vacancy could not be updated. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Manage ${title}`} disabled={busy !== null} />}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/admin/vacancies/${jobId}`} />}>
          <Eye className="size-4" /> View vacancy
        </DropdownMenuItem>
        {canAdminCloseVacancy(status) && (
          <DropdownMenuItem variant="destructive" onClick={() => updateVacancy("close")}>
            <LockKeyhole className="size-4" /> Close vacancy
          </DropdownMenuItem>
        )}
        {canAdminArchiveVacancy(status) && (
          <DropdownMenuItem variant="destructive" onClick={() => updateVacancy("archive")}>
            <Archive className="size-4" /> Archive record
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
