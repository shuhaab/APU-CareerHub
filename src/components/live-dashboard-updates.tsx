"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type DocumentReference,
  type Query,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseClientConfigured } from "@/lib/firebase/client";
import type { UserRole } from "@/types";

export function LiveDashboardUpdates({ role }: { role: UserRole }) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseClientConfigured) return;

    let listeners: Unsubscribe[] = [];
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshDashboard = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        router.refresh();
        setLastUpdated(new Intl.DateTimeFormat("en-MY", { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date()));
      }, 500);
    };

    const watchQuery = (reference: Query<DocumentData>) => {
      let initialized = false;
      listeners.push(onSnapshot(reference, () => {
        if (initialized) refreshDashboard();
        initialized = true;
      }, () => undefined));
    };

    const watchDocument = (reference: DocumentReference<DocumentData>) => {
      let initialized = false;
      listeners.push(onSnapshot(reference, () => {
        if (initialized) refreshDashboard();
        initialized = true;
      }, () => undefined));
    };

    const db = getFirebaseDb();
    const unsubscribeAuth = onAuthStateChanged(getFirebaseAuth(), (user) => {
      listeners.forEach((unsubscribe) => unsubscribe());
      listeners = [];
      if (role === "student") {
        watchQuery(query(collection(db, "jobs"), where("status", "==", "published")));
      }
      if (!user) return;

      watchDocument(doc(db, "users", user.uid));

      if (role === "admin") {
        watchQuery(query(collection(db, "users")));
        watchQuery(query(collection(db, "jobs")));
        watchQuery(query(collection(db, "applications")));
      } else if (role === "employer") {
        watchQuery(query(collection(db, "jobs"), where("employerId", "==", user.uid)));
        watchQuery(query(collection(db, "applications"), where("employerId", "==", user.uid)));
      } else {
        watchQuery(query(collection(db, "applications"), where("studentId", "==", user.uid)));
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshDashboard();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubscribeAuth();
      listeners.forEach((unsubscribe) => unsubscribe());
      clearTimeout(refreshTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [role, router]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400" aria-live="polite">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-medium text-emerald-700">Live data</span>
      {lastUpdated && <span>· Updated {lastUpdated}</span>}
    </div>
  );
}
