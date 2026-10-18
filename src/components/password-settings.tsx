"use client";

import { useRef, useState, type FormEvent } from "react";
import { signOut } from "firebase/auth";
import { KeyRound, LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function PasswordSettings({ required = false }: { required?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await changePasswordAction(new FormData(event.currentTarget));
      if (!result.ok) {
        toast.error(result.error ?? "Your password could not be changed.");
        return;
      }

      formRef.current?.reset();
      await fetch("/api/session", { method: "DELETE" });
      await signOut(getFirebaseAuth()).catch(() => undefined);
      toast.success("Password changed successfully. Sign in again with your new password.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Your password could not be changed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={changePassword} className={`rounded-2xl border bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8 ${required ? "border-amber-300 ring-4 ring-amber-100" : "border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${required ? "bg-amber-100 text-amber-800" : "bg-[#eef1f7] text-[#24345c]"}`}><KeyRound className="size-5" /></span>
        <div>
          <h2 className="font-bold text-[#18233f]">{required ? "Replace your temporary password" : "Change password"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{required ? "You must choose a private password before using administrator actions." : "Confirm your current password before setting a new one."}</p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-new-password">Confirm new password</Label>
          <Input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-10" />
        </div>
        <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Use 12 or more characters with uppercase, lowercase, a number, and a symbol.</p>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-xs text-slate-400"><LogOut className="size-4" /> You will be signed out after the password changes.</p>
        <Button type="submit" disabled={busy} className="h-10 bg-[#24345c] px-4 text-white hover:bg-[#18233f]">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {busy ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
