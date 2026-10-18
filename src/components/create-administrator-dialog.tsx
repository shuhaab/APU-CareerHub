"use client";

import { useRef, useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAdministratorAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateAdministratorDialog() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function closeDialog() {
    if (busy) return;
    setOpen(false);
    setConfirmed(false);
    formRef.current?.reset();
  }

  async function createAdministrator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      toast.error("Confirm that this person is authorized to receive administrator access.");
      return;
    }

    setBusy(true);
    const formData = new FormData(event.currentTarget);
    formData.set("confirmed", "true");

    try {
      const result = await createAdministratorAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "The administrator account could not be created.");
        return;
      }

      setOpen(false);
      setConfirmed(false);
      formRef.current?.reset();
      router.refresh();
      toast.success("Administrator created. Share the temporary password securely; it must be changed after sign-in.");
    } catch {
      toast.error("The administrator account could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="bg-[#24345c] text-white hover:bg-[#18233f]">
        <UserPlus className="size-4" />
        Create administrator
      </Button>
      <Dialog open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : closeDialog()}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-lg">
          <form ref={formRef} onSubmit={createAdministrator}>
            <DialogHeader className="border-b border-slate-100 p-6 pr-12">
              <span className="grid size-10 place-items-center rounded-xl bg-[#eef1f7] text-[#24345c]">
                <ShieldCheck className="size-5" />
              </span>
              <DialogTitle className="text-xl font-bold text-[#18233f]">Create administrator</DialogTitle>
              <DialogDescription className="leading-6">
                This creates a real Firebase account with portal-wide access. The new administrator must replace the temporary password after signing in.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 p-6">
              <div className="grid gap-2">
                <Label htmlFor="admin-full-name">Full name</Label>
                <Input id="admin-full-name" name="fullName" autoComplete="name" minLength={2} maxLength={80} required placeholder="e.g. Alex Tan" className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Email address</Label>
                <Input id="admin-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="name@apu.edu.my" className="h-10" />
                <p className="text-xs leading-5 text-slate-500">Use an inbox the administrator can access so they can receive the password-setup email.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-department">Department</Label>
                <Input id="admin-department" name="department" minLength={2} maxLength={100} required placeholder="e.g. Career Services" className="h-10" />
              </div>
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="admin-temporary-password"><KeyRound className="size-4 text-[#24345c]" /> Temporary password</Label>
                  <Input id="admin-temporary-password" name="temporaryPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-10 bg-white" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-confirm-password">Confirm password</Label>
                  <Input id="admin-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-10 bg-white" />
                </div>
                <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Use 12 or more characters with uppercase, lowercase, a number, and a symbol. The password is sent only to Firebase Authentication and is never saved in the profile or audit log.</p>
              </div>

              <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 leading-6 text-amber-950">
                <Checkbox checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} disabled={busy} className="mt-1" />
                <span className="text-sm font-normal">
                  I confirm that this person is authorized to access all administrator features and sensitive portal records.
                </span>
              </Label>
            </div>

            <DialogFooter className="m-0 rounded-none px-6 py-4">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy || !confirmed} className="bg-[#d91b62] text-white hover:bg-[#b91451]">
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                {busy ? "Creating…" : "Create administrator"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
