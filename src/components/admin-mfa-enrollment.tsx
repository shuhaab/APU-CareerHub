"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { multiFactor, signOut, TotpMultiFactorGenerator, type TotpSecret } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function AdminMfaEnrollment() {
  const router = useRouter();
  const [secret, setSecret] = useState<TotpSecret>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function enroll(code?: string) {
    setError("");
    setPending(true);
    try {
      const auth = getFirebaseAuth();
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) { router.replace("/login"); return; }
      if (!secret) { setSecret(await TotpMultiFactorGenerator.generateSecret(await multiFactor(user).getSession())); return; }
      if (!code) return;
      await multiFactor(user).enroll(TotpMultiFactorGenerator.assertionForEnrollment(secret, code), "CareerHub authenticator");
      await signOut(auth);
      await fetch("/api/session", { method: "DELETE" });
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Authenticator setup could not be completed. Check your code or sign in again to restart.");
    } finally {
      setPending(false);
    }
  }

  return <section className="grid gap-4 rounded-xl border bg-card p-5">
    <h2 className="font-semibold">Set up your authenticator</h2>
    <p className="text-sm">Administrator access requires a code from an authenticator app.</p>
    {secret ? <>
      <p className="text-sm">In your authenticator app, add a time-based account with the following setup key. Do not share the key.</p>
      <code className="break-all rounded bg-muted p-2">{secret.secretKey}</code>
      <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void enroll(String(new FormData(event.currentTarget).get("code"))); }}>
        <label htmlFor="setup-code">Authenticator code</label>
        <Input id="setup-code" name="code" pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" required />
        <Button type="submit" disabled={pending}>{pending ? "Verifying…" : "Verify and sign in again"}</Button>
      </form>
    </> : <Button disabled={pending} onClick={() => void enroll()}>{pending ? "Starting…" : "Generate setup key"}</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
