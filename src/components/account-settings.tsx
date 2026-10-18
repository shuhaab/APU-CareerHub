import { Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { updateAccountSettingsAction } from "@/app/actions/profile";
import { DashboardHeading } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordSettings } from "@/components/password-settings";
import type { UserProfile } from "@/types";

const roleLabels = {
  student: "Student",
  employer: "Employer",
  admin: "Administrator",
};

export function AccountSettings({ profile }: { profile: UserProfile }) {
  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AP";
  const formKey = JSON.stringify([profile.fullName, profile.phone]);

  return (
    <div className="space-y-7">
      <DashboardHeading
        title="Account settings"
        description="Manage the basic information associated with your APU CareerHub account."
      />

      {profile.mustChangePassword && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-bold">Password change required</p><p className="mt-1 text-sm leading-6 text-amber-900/75">This account was created with a temporary password. Replace it below before using administrator actions.</p></div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
          <Avatar className="mx-auto size-20">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={`${profile.fullName}'s profile picture`} />}
            <AvatarFallback className="bg-[#eef1f7] text-xl font-bold text-[#24345c]">{initials}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 font-bold text-[#18233f]">{profile.fullName}</h2>
          <p className="mt-1 text-sm text-slate-400">{roleLabels[profile.role]}</p>
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-left">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Secured by Firebase</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800/70">Your sign-in credentials are managed securely through Firebase Authentication.</p>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <form
            key={formKey}
            action={updateAccountSettingsAction}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8"
          >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#d91b62]"><UserRound className="size-5" /></span>
            <div>
              <h2 className="font-bold text-[#18233f]">Account information</h2>
              <p className="text-sm text-slate-400">Changes are saved to your account immediately.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="account-name">Full name</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input id="account-name" name="fullName" required defaultValue={profile.fullName} className="h-10 pl-9" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input id="account-email" type="email" value={profile.email} readOnly className="h-10 bg-slate-50 pl-9" />
              </div>
              <p className="text-xs text-slate-400">Your login email cannot be changed here.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-phone">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input id="account-phone" name="phone" defaultValue={profile.phone} placeholder="Add a contact number" className="h-10 pl-9" />
              </div>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="account-role">Account role</Label>
              <Input id="account-role" value={roleLabels[profile.role]} readOnly className="h-10 bg-slate-50" />
              <p className="text-xs text-slate-400">Role changes require administrator approval.</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit" className="h-10 bg-[#24345c] px-4 text-white hover:bg-[#18233f]"><Save className="size-4" /> Save changes</Button>
          </div>
          </form>
          <PasswordSettings required={profile.mustChangePassword} />
        </div>
      </div>
    </div>
  );
}
