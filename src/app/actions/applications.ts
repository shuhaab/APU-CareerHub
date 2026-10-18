"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/auth/server";
import { applicationStatusLabels, reviewerApplicationTransitions } from "@/lib/application-status";
import type { ApplicationStatus } from "@/types";

export type ActionResult = { ok: boolean; error?: string; id?: string };

export async function submitApplicationAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["student"]);
    const jobId = String(formData.get("jobId") ?? "").trim();
    const documentId = String(formData.get("documentId") ?? "").trim();
    const coverLetter = String(formData.get("coverLetter") ?? "").trim();
    if (!jobId || coverLetter.length < 80) return { ok: false, error: "Complete the cover letter before submitting." };
    if (!documentId) return { ok: false, error: "Choose the CV or supporting document to submit." };
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(documentId)) return { ok: false, error: "The selected document is invalid." };

    const db = getAdminDb();
    const jobRef = db.collection("jobs").doc(jobId);
    const jobSnapshot = await jobRef.get();
    if (!jobSnapshot.exists) return { ok: false, error: "This vacancy no longer exists." };
    const job = jobSnapshot.data()!;
    if (job.status !== "published") return { ok: false, error: "This vacancy is not accepting applications." };

    const deadline = job.applicationDeadline instanceof Timestamp
      ? job.applicationDeadline.toDate()
      : new Date(job.applicationDeadline);
    if (Number.isFinite(deadline.getTime()) && deadline.getTime() < Date.now()) {
      return { ok: false, error: "The application deadline has passed." };
    }

    const applicationId = `${jobId}_${user.uid}`;
    const applicationRef = db.collection("applications").doc(applicationId);
    if ((await applicationRef.get()).exists) return { ok: false, error: "You have already applied for this vacancy." };

    const [profileSnapshot, documentSnapshot] = await Promise.all([
      db.collection("users").doc(user.uid).get(),
      db.collection("users").doc(user.uid).collection("documents").doc(documentId).get(),
    ]);
    const document = documentSnapshot.data();
    if (!documentSnapshot.exists || document?.ownerId !== user.uid || !String(document?.storagePath ?? "").startsWith(`application-documents/${user.uid}/`)) {
      return { ok: false, error: "The selected document is no longer available. Choose another document." };
    }
    const profile = profileSnapshot.data();
    const batch = db.batch();
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
    await batch.commit();
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
    const user = await requireRole(["employer", "admin"]);
    const applicationId = String(formData.get("applicationId") ?? "");
    const newStatus = String(formData.get("status") ?? "") as ApplicationStatus;
    const studentMessage = String(formData.get("studentMessage") ?? "").trim();
    const internalNote = String(formData.get("internalNote") ?? "").trim();
    const db = getAdminDb();
    const ref = db.collection("applications").doc(applicationId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return { ok: false, error: "Application not found." };
    const application = snapshot.data()!;
    if (user.role === "employer" && application.employerId !== user.uid) return { ok: false, error: "You cannot manage this application." };
    const currentStatus = application.currentStatus as ApplicationStatus;
    const allowedStatuses = reviewerApplicationTransitions[currentStatus] ?? [];
    if (newStatus === currentStatus) return { ok: false, error: "Choose a new application status before saving." };
    if (!allowedStatuses.includes(newStatus)) {
      if (!allowedStatuses.length) return { ok: false, error: `This application is already ${applicationStatusLabels[currentStatus].toLowerCase()} and cannot be moved to another status.` };
      return { ok: false, error: `From ${applicationStatusLabels[currentStatus]}, choose ${allowedStatuses.map((status) => applicationStatusLabels[status]).join(" or ")}.` };
    }

    const batch = db.batch();
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
    await batch.commit();
    revalidatePath("/student", "layout");
    revalidatePath("/employer", "layout");
    revalidatePath("/admin", "layout");
    return { ok: true, id: applicationId };
  } catch {
    return { ok: false, error: "The application status could not be updated." };
  }
}

export async function updateApplicationStatusFormAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  return updateApplicationStatusAction(formData);
}
