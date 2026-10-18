"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

export function LogoutButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
      if (isFirebaseClientConfigured) await signOut(getFirebaseAuth());
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={cn(
        compact
          ? "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 disabled:opacity-50"
          : "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/62 hover:bg-white/7 hover:text-white disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-[18px]" /> {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
