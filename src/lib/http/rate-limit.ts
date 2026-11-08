import "server-only";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export class RateLimitError extends Error {}

export async function enforceRateLimit(scope: string, key: string, limit: number) {
  const db = getAdminDb();
  const bucket = Math.floor(Date.now() / 60_000);
  const id = createHash("sha256").update(JSON.stringify([scope, key, bucket])).digest("hex");
  const ref = db.collection("rateLimits").doc(id);
  await db.runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data()?.count ?? 0;
    if (current >= limit) throw new RateLimitError("Too many requests. Try again in a minute.");
    tx.set(ref, { count: current + 1, expiresAt: Timestamp.fromMillis((bucket + 2) * 60_000) });
  });
}

export function trustedClientAddress(request: Request) {
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const address = header ? request.headers.get(header) : null;
  if (address && isIP(address)) return address;
  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1") return "127.0.0.1";
  throw new Error("A trusted client address is required.");
}
