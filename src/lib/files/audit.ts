import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export function recordFileCleanupFailure(requestId: string, storagePath: string) {
  return getAdminDb().collection("fileCleanup").doc(requestId).set({
    storagePath, createdAt: FieldValue.serverTimestamp(),
  }).catch(() => console.error(JSON.stringify({ event: "file.cleanup_record_failed", requestId })));
}
