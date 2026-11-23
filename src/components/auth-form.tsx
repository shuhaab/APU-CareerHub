"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  sendEmailVerification,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type User,
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
import { validPassword } from "@/lib/auth/policy";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "employer">("student");
  const [resolver, setResolver] = useState<MultiFactorResolver>();
  const [phoneVerificationId, setPhoneVerificationId] = useState<string>();
  const [verification, setVerification] = useState<User>();
  const [errorMessage, setErrorMessage] = useState("");
  const configured = isFirebaseClientConfigured;

  function readableAuthError(error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code.includes("email-already-in-use")) return "An account already exists for this email address.";
    if (["invalid-credential", "wrong-password", "user-not-found", "user-disabled", "invalid-email"].some((value) => code.includes(value))) return "The email address or password is incorrect.";
    if (code.includes("weak-password")) return "Use 12–128 characters with uppercase, lowercase, a number, and a symbol.";
    if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
    if (code.includes("network-request-failed")) return "The authentication service could not be reached.";
    return error instanceof Error ? error.message : "Unable to continue.";
  }

  async function exchangeSession(user: User) {
    const response = await fetch("/api/session", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: await user.getIdToken(true) }),
    });
    const result = await response.json();
    if (!response.ok) {
      if (result.verifyEmail) setVerification(user);
      throw new Error(result.error ?? "A secure session could not be created.");
    }
    const target = ["admin", "employer", "student"].includes(result.state) ? `/${result.state}` : "/onboarding";
    router.push(target);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    setLoading(true);
    setErrorMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserLocalPersistence);
      if (resolver) {
        const hint = resolver.hints.find((factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID);
        if (!hint && !phoneVerificationId) throw new Error("This account needs operator help to recover its authenticator.");
        const code = String(form.get("otp"));
        const assertion = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1" && phoneVerificationId
          ? PhoneMultiFactorGenerator.assertion(PhoneAuthProvider.credential(phoneVerificationId, code))
          : TotpMultiFactorGenerator.assertionForSignIn(hint!.uid, code);
        const { user } = await resolver.resolveSignIn(assertion);
        setResolver(undefined);
        setPhoneVerificationId(undefined);
        await exchangeSession(user);
      } else if (mode === "register") {
        if (!validPassword(password)) throw new Error("Use 12–128 characters with uppercase, lowercase, a number, and a symbol.");
        let user;
        try {
          ({ user } = await createUserWithEmailAndPassword(auth, email, password));
        } catch (error) {
          if (!(error && typeof error === "object" && "code" in error && error.code === "auth/email-already-in-use")) throw error;
          ({ user } = await signInWithEmailAndPassword(auth, email, password));
        }
        const response = await fetch("/api/register-profile", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: await user.getIdToken(), requestedRole: role,
            fullName: String(form.get("fullName") ?? ""),
            studentId: String(form.get("studentId") ?? ""),
            programme: String(form.get("programme") ?? ""),
            department: String(form.get("department") ?? ""),
          }),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Registration failed.");
        if (user.emailVerified) await exchangeSession(user);
        else {
          setVerification(user);
          await sendEmailVerification(user);
          toast.success("Check your email for a verification link.");
        }
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await exchangeSession(user);
      }
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "auth/multi-factor-auth-required") {
        try {
          const nextResolver = getMultiFactorResolver(getFirebaseAuth(), error as MultiFactorError);
          const phone = nextResolver.hints.find((factor) => factor.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
          if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1" && phone) {
            // The local Auth emulator supports SMS MFA instead of TOTP; it sends no real SMS.
            const verifier = { type: "recaptcha", verify: async () => "emulator", _reset() {} };
            setPhoneVerificationId(await new PhoneAuthProvider(getFirebaseAuth()).verifyPhoneNumber({ multiFactorHint: phone, session: nextResolver.session }, verifier));
          }
          setResolver(nextResolver);
        } catch (mfaError) { setErrorMessage(readableAuthError(mfaError)); }
      } else setErrorMessage(readableAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  if (resolver) return <form className="grid gap-4" onSubmit={handleSubmit}>
    <h1 className="text-2xl font-semibold">Verify your sign-in</h1>
    <Label htmlFor="login-code">{phoneVerificationId ? "Local SMS code" : "Authenticator code"}</Label>
    {phoneVerificationId && <p className="text-sm">Use the SMS code printed in the Terminal running your Firebase emulators.</p>}
    <Input id="login-code" name="otp" pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" required />
    {errorMessage && <p role="alert" className="text-destructive">{errorMessage}</p>}
    <Button type="submit" disabled={loading}>{loading ? "Verifying…" : "Verify and sign in"}</Button>
    <Button type="button" variant="outline" onClick={() => { setResolver(undefined); setPhoneVerificationId(undefined); setErrorMessage(""); }}>Back to sign-in</Button>
  </form>;

  if (verification) return <div className="grid gap-4">
    <h1 className="text-2xl font-semibold">Verify your email</h1>
    <p>Open the verification link in your inbox. Then continue to your account.</p>
    {errorMessage && <p role="alert" className="text-destructive">{errorMessage}</p>}
    <Button disabled={loading} onClick={async () => {
      setLoading(true); setErrorMessage("");
      try { await verification.reload(); await exchangeSession(verification); }
      catch (error) { setErrorMessage(readableAuthError(error)); }
      finally { setLoading(false); }
    }}>Continue after verification</Button>
    <Button disabled={loading} variant="outline" onClick={async () => {
      setLoading(true);
      try { await sendEmailVerification(verification); toast.success("Check your email for a verification link."); }
      catch { setErrorMessage("A verification email could not be sent. Try again later."); }
      finally { setLoading(false); }
    }}>Resend verification email</Button>
    <Button type="button" variant="ghost" onClick={async () => { await signOut(getFirebaseAuth()); setVerification(undefined); setErrorMessage(""); }}>Use another account</Button>
  </div>;

  return (
    <div className="w-full">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{mode === "login" ? "Welcome back" : "Join CareerHub"}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">{mode === "login" ? "Sign in to your portal" : "Create your account"}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
            <Label htmlFor="student-role" className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${role === "student" ? "border-primary bg-rose-50" : "border-border bg-card"}`}>
              <RadioGroupItem value="student" id="student-role" /><GraduationCap className="size-5 text-primary" /><span className="font-semibold">Student</span>
            </Label>
            <Label htmlFor="employer-role" className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${role === "employer" ? "border-input bg-muted" : "border-border bg-card"}`}>
              <RadioGroupItem value="employer" id="employer-role" /><Building2 className="size-5 text-foreground" /><span className="font-semibold">Employer</span>
            </Label>
          </RadioGroup>
        </div>
      )}

      {errorMessage && <p role="alert" className="mt-4 text-sm text-destructive">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        {mode === "register" && (
          <div className="grid gap-2"><Label htmlFor="fullName">Full name</Label><div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="fullName" name="fullName" required className="h-11 pl-10" placeholder="Your full name" /></div></div>
        )}
        <div className="grid gap-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" name="email" type="email" required className="h-11 pl-10" placeholder="student1@example.com" /></div></div>
        <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{mode === "login" && <button type="button" className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline md:min-h-0" onClick={async () => { const email = (document.getElementById("email") as HTMLInputElement | null)?.value.trim(); if (!email) return toast.error("Enter your email address first."); if (!configured) return toast.error("Firebase authentication has not been configured."); try { await sendPasswordResetEmail(getFirebaseAuth(), email); } catch { /* Do not disclose account existence. */ } toast.success("If the address has an account, you will receive a password reset email."); }}>Forgot password?</button>}</div><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" name="password" type="password" minLength={mode === "register" ? 12 : undefined} maxLength={128} required className="h-11 pl-10" placeholder={mode === "register" ? "At least 12 characters" : "Your password"} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div></div>
        {mode === "register" && role === "student" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="studentId">Student ID</Label><Input id="studentId" name="studentId" required placeholder="TP076241" /></div>
            <div className="grid gap-2"><Label htmlFor="programme">Programme</Label><Input id="programme" name="programme" required placeholder="Software Engineering" /></div>
          </div>
        )}
        {mode === "register" && role === "employer" && (
          <div className="grid gap-2"><Label htmlFor="department">APU department</Label><Input id="department" name="department" required placeholder="Student Services" /><p className="text-xs text-muted-foreground">Employer access requires administrator approval.</p></div>
        )}
        <Button type="submit" disabled={loading || !configured} className="mt-2 h-11 bg-primary text-primary-foreground hover:bg-primary-hover">
          {loading ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create account"}<ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to CareerHub?" : "Already have an account?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-primary hover:underline">{mode === "login" ? "Create an account" : "Sign in"}</Link>
      </p>

      <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-600" /> Protected with Firebase Authentication</div>
    </div>
  );
}
