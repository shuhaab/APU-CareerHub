"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { approveVacancyAction, rejectVacancyAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminVacancyReviewActions({ jobId, title }: { jobId: string; title: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  async function reviewVacancy(nextDecision: "approve" | "reject") {
    setDecision(nextDecision);
    try {
      const formData = new FormData();
      formData.set("jobId", jobId);
      const result = nextDecision === "approve"
        ? await approveVacancyAction(formData)
        : await rejectVacancyAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "The vacancy decision could not be saved.");
        return;
      }
      toast.success(nextDecision === "approve" ? `“${title}” is now published.` : `“${title}” has been rejected.`);
      router.refresh();
    } catch {
      toast.error("The vacancy decision could not be saved. Please try again.");
    } finally {
      setDecision(null);
    }
  }

  return (
    <div className="flex gap-1">
      <Button type="button" size="icon" variant="ghost" aria-label={`View ${title}`} title="View vacancy" asChild>
        <Link href={`/admin/vacancies/${jobId}`}><Eye className="size-4" /></Link>
      </Button>
      <Button type="button" size="icon" variant="outline" className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" aria-label={`Approve ${title}`} title="Approve and publish vacancy" disabled={decision !== null} onClick={() => reviewVacancy("approve")}>
        {decision === "approve" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
      </Button>
      <Button type="button" size="icon" variant="outline" className="text-rose-700 hover:bg-rose-50 hover:text-rose-800" aria-label={`Reject ${title}`} title="Reject vacancy" disabled={decision !== null} onClick={() => reviewVacancy("reject")}>
        {decision === "reject" ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />}
      </Button>
    </div>
  );
}
