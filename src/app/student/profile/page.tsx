import { Save, UserRound } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { enforcePageRole } from "@/lib/auth/server";
import { updateProfileAction } from "@/app/actions/profile";
import { ProfilePictureUploader } from "@/components/profile-picture-uploader";

export default async function StudentProfilePage() {
  const { profile } = await enforcePageRole("student");
  const initials = profile.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const completionFields = [profile.fullName, profile.studentId, profile.programme, profile.phone, profile.bio, profile.skills?.length, profile.availability, profile.availableFrom];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const formKey = JSON.stringify([
    profile.fullName,
    profile.studentId,
    profile.phone,
    profile.programme,
    profile.bio,
    profile.skills,
    profile.availability,
    profile.availableFrom,
  ]);
  return (
    <div className="space-y-7">
      <DashboardHeading title="Student profile" description="Keep your academic details, skills, and availability ready for future applications." />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <ProfilePictureUploader avatarUrl={profile.avatarUrl} fullName={profile.fullName} initials={initials} />
          <h2 className="mt-4 font-bold text-[#18233f]">{profile.fullName}</h2><p className="mt-1 text-sm text-slate-400">{profile.studentId}</p>
          <div className="mt-6 text-left"><div className="flex justify-between text-xs"><span className="font-medium text-slate-500">Profile completion</span><span className="font-bold text-[#d91b62]">{completion}%</span></div><Progress value={completion} className="mt-2 h-2" /></div>
        </aside>
        <form key={formKey} action={updateProfileAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)] sm:p-8">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#d91b62]"><UserRound className="size-5" /></span><div><h2 className="font-bold text-[#18233f]">Personal and academic details</h2><p className="text-sm text-slate-400">Visible only to authorized employers after you apply.</p></div></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" name="fullName" required defaultValue={profile.fullName} /></div>
            <div className="grid gap-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" type="email" value={profile.email} readOnly className="bg-slate-50" /></div>
            <div className="grid gap-2"><Label htmlFor="profile-id">Student ID</Label><Input id="profile-id" name="studentId" required defaultValue={profile.studentId} /></div>
            <div className="grid gap-2"><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" name="phone" defaultValue={profile.phone} /></div>
            <div className="grid gap-2 sm:col-span-2"><Label htmlFor="profile-programme">Programme</Label><Input id="profile-programme" name="programme" required defaultValue={profile.programme} /></div>
            <div className="grid gap-2 sm:col-span-2"><Label htmlFor="profile-bio">Short introduction</Label><Textarea id="profile-bio" name="bio" rows={4} defaultValue={profile.bio} /></div>
            <div className="grid gap-2 sm:col-span-2"><Label htmlFor="profile-skills">Skills</Label><Input id="profile-skills" name="skills" defaultValue={profile.skills?.join(", ")} /><p className="text-xs text-slate-400">Separate each skill with a comma.</p></div>
            <div className="grid gap-2"><Label htmlFor="profile-availability">Weekly availability</Label><Input id="profile-availability" name="availability" defaultValue={profile.availability} /></div>
            <div className="grid gap-2"><Label htmlFor="profile-start">Available from</Label><Input id="profile-start" name="availableFrom" type="date" defaultValue={profile.availableFrom} /></div>
          </div>
          <div className="mt-8 flex justify-end"><Button type="submit" className="bg-[#24345c] text-white"><Save className="size-4" /> Save profile</Button></div>
        </form>
      </div>
    </div>
  );
}
