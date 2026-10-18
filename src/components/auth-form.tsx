"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ArrowRight, Building2, GraduationCap, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "employer">("student");
  const configured = isFirebaseClientConfigured;

  function readableAuthError(error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code.includes("email-already-in-use")) return "An account already exists for this email address.";
    if (code.includes("invalid-credential")) return "The email address or password is incorrect.";
    if (code.includes("weak-password")) return "Use a stronger password with at least 8 characters.";
    if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
    if (code.includes("network-request-failed")) return "The authentication service could not be reached.";
    return error instanceof Error ? error.message : "Unable to continue.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return toast.error("Firebase authentication has not been configured.");

    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserLocalPersistence);
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
        const response = await fetch("/api/register-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            fullName: String(form.get("fullName") ?? ""),
            requestedRole: role,
            studentId: String(form.get("studentId") ?? ""),
            programme: String(form.get("programme") ?? ""),
            department: String(form.get("department") ?? ""),
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          await deleteUser(credential.user).catch(() => undefined);
          throw new Error(result.error ?? "Registration failed.");
        }
        if (result.pendingEmployerApproval) {
          await signOut(auth);
          toast.success("Account created. Employer access is awaiting administrator approval.");
          router.push("/login");
          return;
        }
      }

      const credential = mode === "login"
        ? await signInWithEmailAndPassword(auth, email, password)
        : { user: auth.currentUser! };
      const idToken = await credential.user.getIdToken(true);
      const token = await credential.user.getIdTokenResult();
      const sessionResponse = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const sessionResult = await sessionResponse.json();
      if (!sessionResponse.ok) {
        await signOut(auth);
        throw new Error(sessionResult.error ?? "A secure session could not be created.");
      }
      const trustedRole = sessionResult.role ?? token.claims.role;
      router.push(sessionResult.mustChangePassword
        ? `/${trustedRole}/account?passwordChange=required`
        : trustedRole === "admin" ? "/admin" : trustedRole === "employer" ? "/employer" : "/student");
      router.refresh();
    } catch (error) {
      toast.error(readableAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d91b62]">{mode === "login" ? "Welcome back" : "Join CareerHub"}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#18233f]">{mode === "login" ? "Sign in to your portal" : "Create your account"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {mode === "login" ? "Use your registered email to continue." : "Use a valid email address to create your secured portal account."}
        </p>
      </div>

      {!configured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Configuration required:</strong> Add the Firebase web and Admin SDK credentials before using authentication.
        </div>
      )}

      {mode === "register" && (
        <div className="mt-6">
          <Label className="mb-3 block">I am registering as</Label>
          <RadioGroup value={role} onValueChange={(value) => setRole((value ?? "student") as "student" | "employer")} className="grid grid-cols-2 gap-3">
            <Label htmlFor="student-role" className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${role === "student" ? "border-[#d91b62] bg-rose-50" : "border-slate-200 bg-white"}`}>
              <RadioGroupItem value="student" id="student-role" /><GraduationCap className="size-5 text-[#d91b62]" /><span className="font-semibold">Student</span>
            </Label>
            <Label htmlFor="employer-role" className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${role === "employer" ? "border-[#24345c] bg-slate-50" : "border-slate-200 bg-white"}`}>
              <RadioGroupItem value="employer" id="employer-role" /><Building2 className="size-5 text-[#24345c]" /><span className="font-semibold">Employer</span>
            </Label>
          </RadioGroup>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        {mode === "register" && (
          <div className="grid gap-2"><Label htmlFor="fullName">Full name</Label><div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="fullName" name="fullName" required className="h-11 pl-10" placeholder="Your full name" /></div></div>
        )}
        <div className="grid gap-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="email" name="email" type="email" required className="h-11 pl-10" placeholder="student1@example.com" /></div></div>
        <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{mode === "login" && <button type="button" className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-[#d91b62] hover:underline md:min-h-0" onClick={async () => { const email = (document.getElementById("email") as HTMLInputElement | null)?.value.trim(); if (!email) return toast.error("Enter your email address first."); if (!configured) return toast.error("Firebase authentication has not been configured."); try { await sendPasswordResetEmail(getFirebaseAuth(), email); toast.success("Password reset email sent."); } catch (error) { toast.error(readableAuthError(error)); } }}>Forgot password?</button>}</div><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="password" name="password" type="password" minLength={8} required className="h-11 pl-10" placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} /></div></div>
        {mode === "register" && role === "student" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="studentId">Student ID</Label><Input id="studentId" name="studentId" required placeholder="TP076241" /></div>
            <div className="grid gap-2"><Label htmlFor="programme">Programme</Label><Input id="programme" name="programme" required placeholder="Software Engineering" /></div>
          </div>
        )}
        {mode === "register" && role === "employer" && (
          <div className="grid gap-2"><Label htmlFor="department">APU department</Label><Input id="department" name="department" required placeholder="Student Services" /><p className="text-xs text-slate-400">Employer access requires administrator approval.</p></div>
        )}
        <Button type="submit" disabled={loading || !configured} className="mt-2 h-11 bg-[#d91b62] text-white hover:bg-[#bb164f]">
          {loading ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create account"}<ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? "New to CareerHub?" : "Already have an account?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-[#d91b62] hover:underline">{mode === "login" ? "Create an account" : "Sign in"}</Link>
      </p>

      <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck className="size-4 text-emerald-600" /> Protected with Firebase Authentication</div>
    </div>
  );
}
