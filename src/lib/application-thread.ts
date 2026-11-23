import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import type { SessionUser } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { validId } from "@/lib/http/input";

export function isApplicationParticipant(user: SessionUser, application: { studentId?: unknown; employerId?: unknown }) {
  return (user.role === "student" && application.studentId === user.uid)
    || (user.role === "employer" && application.employerId === user.uid);
}

export async function getApplicationThread(user: SessionUser, applicationId: string, cursor: unknown) {
  const parent = getAdminDb().collection("applications").doc(applicationId);
  const application = (await parent.get()).data();
  if (!application || !isApplicationParticipant(user, application)) return null;

  const messages = parent.collection("messages");
  let query = messages.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");
  if (validId(cursor, 64)) {
    const start = await messages.doc(cursor).get();
    if (start.exists) query = query.startAfter(start);
  }
  const { docs } = await query.limit(26).get();
  return {
    older: docs.length > 25 ? docs[24].id : undefined,
    messages: docs.slice(0, 25).reverse().map((doc) => ({
      id: doc.id,
      text: String(doc.get("text") ?? ""),
      senderRole: doc.get("senderRole") === "student" ? "Student" : "Employer",
      createdAt: doc.get("createdAt").toDate().toISOString() as string,
    })),
  };
}
