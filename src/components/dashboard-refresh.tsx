"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DashboardRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => document.removeEventListener("visibilitychange", refreshOnReturn);
  }, [router]);

  return <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    {pending ? "Refreshing…" : "Refresh dashboard"}
  </Button>;
}
