import { Building2, Save } from "lucide-react";
import { updateProfileAction } from "@/app/actions/profile";
import { DashboardHeading } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enforcePageRole } from "@/lib/auth/server";

export default async function EmployerProfilePage() {
  const { profile } = await enforcePageRole("employer");
  const formKey = JSON.stringify([profile.fullName, profile.phone, profile.department, profile.bio]);
  return (
    <div className="space-y-7">
      <DashboardHeading title="Department profile" description="Maintain the information shown to students across your vacancies." />
      <form key={formKey} action={updateProfileAction} className="max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-muted text-foreground"><Building2 className="size-6" /></span>
          <div>
            <div className="flex items-center gap-2"><h2 className="font-bold text-foreground">{profile.department}</h2><Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">Approved employer</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">Database-backed employer profile</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="contact-name">Contact person</Label><Input id="contact-name" name="fullName" required defaultValue={profile.fullName} /></div>
          <div className="grid gap-2"><Label htmlFor="contact-email">Contact email</Label><Input id="contact-email" type="email" value={profile.email} readOnly className="bg-muted" /></div>
          <div className="grid gap-2"><Label htmlFor="contact-phone">Contact phone</Label><Input id="contact-phone" name="phone" defaultValue={profile.phone ?? ""} /></div>
          <div className="grid gap-2"><Label htmlFor="department-name">Department</Label><Input id="department-name" readOnly value={profile.department ?? ""} /><p className="text-xs text-muted-foreground">Contact support to correct your approved department.</p></div>
          <div className="grid gap-2 sm:col-span-2"><Label htmlFor="department-about">About the department</Label><Textarea id="department-about" name="bio" rows={5} defaultValue={profile.bio ?? ""} /></div>
        </div>
        <div className="mt-7 flex justify-end"><Button type="submit" className="bg-primary text-primary-foreground"><Save className="size-4" /> Save department profile</Button></div>
      </form>
    </div>
  );
}
