"use server";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { isApplicationParticipant } from "@/lib/application-thread";
import { enforceRateLimit, RateLimitError } from "@/lib/http/rate-limit";
import { validId } from "@/lib/http/input";
import { isVacancyOpen } from "@/lib/vacancies/deadline";
import { requireActionRole } from "@/lib/auth/server";
import { applicationStatusLabels, reviewerApplicationTransitions } from "@/lib/application-status";
import type { ApplicationStatus } from "@/types";

export type ActionResult = { ok: boolean; error?: string; id?: string; conflict?: boolean };

export async function submitApplicationAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireActionRole(["student"]);
    const jobId = formData.get("jobId");
    const documentId = formData.get("documentId");
    const rawLetter = formData.get("coverLetter");
    const coverLetter = typeof rawLetter === "string" ? rawLetter.trim() : "";
    if (!validId(jobId) || coverLetter.length < 80 || coverLetter.length > 10000) return { ok: false, error: "Enter a cover letter between 80 and 10,000 characters." };
    if (!validId(documentId)) return { ok: false, error: "Choose a valid supporting document." };

    const db = getAdminDb();
    const jobRef = db.collection("jobs").doc(jobId);
    const applicationId = `${jobId}_${user.uid}`;
    const applicationRef = db.collection("applications").doc(applicationId);
    const profileRef = db.collection("users").doc(user.uid);
    const documentRef = profileRef.collection("documents").doc(documentId);
    const result = await db.runTransaction(async (batch): Promise<ActionResult> => {
      const [existing, vacancy, owner, selected] = await batch.getAll(applicationRef, jobRef, profileRef, documentRef);
      if (existing.exists) return { ok: false, id: applicationId, error: "You have already applied for this vacancy." };
      const job = vacancy.data();
      if (!job || !isVacancyOpen(job.status, job.applicationDeadline)) return { ok: false, error: "This vacancy is not accepting applications." };
      const document = selected.data();
      if (!document || document.pendingDeletion || document.ownerId !== user.uid || !String(document.storagePath ?? "").startsWith(`application-documents/${user.uid}/`)) {
        return { ok: false, error: "The selected document is no longer available. Choose another document." };
      }
      const profile = owner.data();
      if (profile?.accountActive !== true || profile.role !== "student") return { ok: false, error: "Student access is required." };
      batch.create(applicationRef, {
        jobId,
        jobTitle: job.title,
        department: job.department,
        employerId: job.employerId,
        studentId: user.uid,
        studentName: profile?.fullName ?? user.email ?? "Student",
        studentNumber: profile?.studentId ?? "",
        programme: profile?.programme ?? "",
        studentEmail: profile?.email ?? user.email ?? "",
        studentPhone: profile?.phone ?? "",
        coverLetter,
        documentId,
        currentStatus: "submitted",
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.create(applicationRef.collection("statusHistory").doc(), {
        previousStatus: null,
        newStatus: "submitted",
        changedBy: user.uid,
        studentMessage: "Your application was successfully received.",
        internalNote: null,
        changedAt: FieldValue.serverTimestamp(),
      });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: user.uid,
        action: "application.submitted",
        entityType: "application",
        entityId: applicationId,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.update(jobRef, { applicants: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
      return { ok: true, id: applicationId };
    });
    if (!result.ok) return result;
    revalidatePath("/student", "layout");
    revalidatePath("/employer", "layout");
    revalidatePath("/admin", "layout");
    return { ok: true, id: applicationId };
  } catch {
    return { ok: false, error: "The application could not be submitted." };
  }
}

export async function updateApplicationStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireActionRole(["employer", "admin"]);
    const applicationId = formData.get("applicationId");
    const expectedVersion = formData.get("version");
    const newStatus = formData.get("status") as ApplicationStatus;
    const rawMessage = formData.get("studentMessage");
    const rawNote = formData.get("internalNote");
    if (!validId(applicationId, 257) || typeof expectedVersion !== "string" || !/^\d+:\d+$/.test(expectedVersion)
      || typeof rawMessage !== "string" || rawMessage.length > 2000 || typeof rawNote !== "string" || rawNote.length > 4000) {
      return { ok: false, error: "Invalid review details." };
    }
    const studentMessage = rawMessage.trim();
    const internalNote = rawNote.trim();
    const db = getAdminDb();
    const ref = db.collection("applications").doc(applicationId);
    const result = await db.runTransaction(async (batch): Promise<ActionResult> => {
      const snapshot = await batch.get(ref);
      if (!snapshot.exists) return { ok: false, error: "Application not found." };
      const application = snapshot.data()!;
      if (user.role === "employer" && application.employerId !== user.uid) return { ok: false, error: "Application not found." };
      if (`${snapshot.updateTime?.seconds}:${snapshot.updateTime?.nanoseconds}` !== expectedVersion) {
        return { ok: false, conflict: true, error: "This application changed. Review the latest status before saving again." };
      }
      const currentStatus = application.currentStatus as ApplicationStatus;
      const allowedStatuses = reviewerApplicationTransitions[currentStatus] ?? [];
      if (newStatus === currentStatus) return { ok: false, error: "Choose a new application status before saving." };
      if (typeof newStatus !== "string" || !allowedStatuses.includes(newStatus)) {
        if (!allowedStatuses.length) return { ok: false, error: `This application is already ${(applicationStatusLabels[currentStatus] ?? "closed").toLowerCase()} and cannot be moved to another status.` };
        return { ok: false, error: `From ${applicationStatusLabels[currentStatus]}, choose ${allowedStatuses.map((status) => applicationStatusLabels[status]).join(" or ")}.` };
      }

      batch.update(ref, { currentStatus: newStatus, updatedAt: FieldValue.serverTimestamp() });
      batch.create(ref.collection("statusHistory").doc(), {
        previousStatus: application.currentStatus,
        newStatus,
        changedBy: user.uid,
        studentMessage: studentMessage || null,
        internalNote: internalNote || null,
        changedAt: FieldValue.serverTimestamp(),
      });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: user.uid,
        action: "application.status_changed",
        entityType: "application",
        entityId: applicationId,
        metadata: { previousStatus: application.currentStatus, newStatus },
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, id: applicationId };
    });
    if (!result.ok) return result;
    revalidatePath("/student", "layout");
    revalidatePath("/employer", "layout");
    revalidatePath("/admin", "layout");
    return { ok: true, id: applicationId };
  } catch {
    return { ok: false, error: "The application status could not be updated." };
  }
}


export async function sendApplicationMessageAction(applicationId: string, text: string, requestId: string): Promise<ActionResult> {
  try {
    const user = await requireActionRole(["student", "employer"]);
    if (!validId(applicationId, 257) || !validId(requestId, 64) || typeof text !== "string" || text.length > 2000 || !text.trim()) {
      return { ok: false, error: "Enter a message between 1 and 2,000 characters." };
    }
    const message = text.trim();
    const db = getAdminDb();
    const parent = db.collection("applications").doc(applicationId);
    const messageId = createHash("sha256").update(JSON.stringify([user.uid, requestId])).digest("hex");
    const ref = parent.collection("messages").doc(messageId);
    const application = (await parent.get()).data();
    if (!application || !isApplicationParticipant(user, application)) return { ok: false, error: "Application not found." };
    const replay = (await ref.get()).data();
    if (replay) return replay.text === message ? { ok: true } : { ok: false, error: "That request has already been used." };

    await enforceRateLimit("message", user.uid, 10);
    const result = await db.runTransaction(async (tx): Promise<ActionResult> => {
      const [current, existing, account] = await tx.getAll(parent, ref, db.collection("users").doc(user.uid));
      const application = current.data();
      const profile = account.data();
      if (!application || !isApplicationParticipant(user, application) || profile?.accountActive !== true ||
          profile.role !== user.role || (user.role === "employer" && profile.approved !== true)) return { ok: false, error: "Application not found." };
      if (existing.exists) return existing.get("text") === message ? { ok: true } : { ok: false, error: "That request has already been used." };
      tx.create(ref, {
        senderId: user.uid,
        senderRole: user.role,
        recipientId: user.role === "student" ? application.employerId : application.studentId,
        text: message,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true };
    });
    if (result.ok) {
      revalidatePath(`/student/applications/${applicationId}`);
      revalidatePath(`/employer/applications/${applicationId}`);
    }
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof RateLimitError ? error.message : "The message could not be sent. Try again." };
  }
}
