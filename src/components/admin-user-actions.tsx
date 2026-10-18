"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { approveEmployerAction, setUserActiveAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function ApproveEmployerButton({ employerId }: { employerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function approveEmployer() {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("employerId", employerId);
      const result = await approveEmployerAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Employer access could not be approved.");
        return;
      }
      toast.success("Employer access approved successfully.");
      router.refresh();
    } catch {
      toast.error("Employer access could not be approved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" onClick={approveEmployer} disabled={busy} className="bg-[#24345c] text-white">
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
      {busy ? "Approving…" : "Approve employer"}
    </Button>
  );
}

export function SetUserActiveButton({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateAccountStatus() {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("active", String(active));
      const result = await setUserActiveAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "The account status could not be updated.");
        return;
      }
      toast.success(active ? "Account activated successfully." : "Account deactivated successfully.");
      router.refresh();
    } catch {
      toast.error("The account status could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={updateAccountStatus} disabled={busy}>
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : active ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
      {busy ? "Updating…" : active ? "Activate" : "Deactivate"}
    </Button>
  );
}
