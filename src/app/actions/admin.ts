"use server";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { validPassword } from "@/lib/auth/policy";
import { validId } from "@/lib/http/input";
import { deadlineMillis } from "@/lib/vacancies/deadline";
import { requireActionRole } from "@/lib/auth/server";
import { canAdminArchiveVacancy, canAdminCloseVacancy } from "@/lib/vacancies/admin-status";
import type { ActionResult } from "@/app/actions/applications";
import { revalidatePath } from "next/cache";

class AdminActionError extends Error {}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  return String(error.code);
}

async function requireAdminManager() {
  const admin = await requireActionRole(["admin"]);
  const snapshot = await getAdminDb().collection("users").doc(admin.uid).get();
  const profile = snapshot.data();
  if (!snapshot.exists || profile?.role !== "admin" || profile.accountActive !== true || profile.canManageAdmins !== true) {
    throw new AdminActionError("Only a primary administrator can create or manage administrator accounts.");
  }
  return admin;
}

export async function createAdministratorAction(formData: FormData): Promise<ActionResult> {
  let createdUserId: string | undefined;

  try {
    const admin = await requireAdminManager();
    const fullName = String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " ");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const department = String(formData.get("department") ?? "").trim().replace(/\s+/g, " ");
    const temporaryPassword = String(formData.get("temporaryPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const confirmed = String(formData.get("confirmed")) === "true";

    if (fullName.length < 2 || fullName.length > 80) return { ok: false, error: "Enter an administrator name between 2 and 80 characters." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email address." };
    if (department.length < 2 || department.length > 100) return { ok: false, error: "Enter a department between 2 and 100 characters." };
    if (!validPassword(temporaryPassword)) {
      return { ok: false, error: "The temporary password must be 12–128 characters and include uppercase, lowercase, a number, and a symbol." };
    }
    if (temporaryPassword !== confirmPassword) return { ok: false, error: "The temporary password confirmation does not match." };
    if (!confirmed) return { ok: false, error: "Confirm that this person is authorized to receive administrator access." };

    const auth = getAdminAuth();
    try {
      await auth.getUserByEmail(email);
      return { ok: false, error: "An account already exists with this email address." };
    } catch (error) {
      if (errorCode(error) !== "auth/user-not-found") throw error;
    }

    const createdUser = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });
    createdUserId = createdUser.uid;
    await auth.setCustomUserClaims(createdUser.uid, { role: "admin" });

    const db = getAdminDb();
    const userRef = db.collection("users").doc(createdUser.uid);
    const auditRef = db.collection("auditLogs").doc();
    const batch = db.batch();
    batch.create(userRef, {
      email,
      fullName,
      role: "admin",
      requestedRole: null,
      studentId: null,
      programme: null,
      department,
      phone: "",
      bio: "",
      skills: [],
      availability: "",
      availableFrom: "",
      approved: true,
      accountActive: true,
      canManageAdmins: false,
      mustChangePassword: true,
      onboardingExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      createdByAdmin: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(auditRef, {
      actorId: admin.uid,
      action: "admin.created",
      entityType: "user",
      entityId: createdUser.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    createdUserId = undefined;

    revalidatePath("/admin", "layout");
    return { ok: true, id: createdUser.uid };
  } catch (error) {
    if (createdUserId) {
      await getAdminAuth().deleteUser(createdUserId).catch(() => undefined);
    }
    if (error instanceof AdminActionError) return { ok: false, error: error.message };
    return { ok: false, error: "The administrator account could not be created." };
  }
}

export async function approveEmployerAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireActionRole(["admin"]);
    const employerId = String(formData.get("employerId") ?? "");
    if (!validId(employerId)) return { ok: false, error: "Employer request not found." };
    const db = getAdminDb();
    const ref = db.collection("users").doc(employerId);
    const account = (await ref.get()).data();
    if (account?.requestedRole !== "employer" || account.role !== "employer" || account.accountActive !== true) {
      return { ok: false, error: "Employer request not found." };
    }
    const auth = getAdminAuth();
    const identity = await auth.getUser(employerId);
    if (!identity.emailVerified || identity.disabled) return { ok: false, error: "The employer must verify their email and have an active account." };
    if (identity.customClaims?.role !== "employer") await auth.setCustomUserClaims(employerId, { ...identity.customClaims, role: "employer" });
    await db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (current?.requestedRole !== "employer" || current.role !== "employer" || current.accountActive !== true) throw new AdminActionError("Employer request not found.");
      if (current.approved === true) return;
      tx.update(ref, { approved: true, approvedBy: admin.uid, approvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      tx.create(db.collection("auditLogs").doc(), { actorId: admin.uid, action: "employer.approved", entityType: "user", entityId: employerId, createdAt: FieldValue.serverTimestamp() });
    });
    revalidatePath("/admin", "layout");
    return { ok: true, id: employerId };
  } catch {
    return { ok: false, error: "Employer access could not be approved." };
  }
}

export async function approveVacancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireActionRole(["admin"]);
    const jobId = String(formData.get("jobId") ?? "");
    if (!validId(jobId)) return { ok: false, error: "Vacancy not found." };
    const db = getAdminDb();
    const ref = db.collection("jobs").doc(jobId);
    const result = await db.runTransaction(async (batch): Promise<ActionResult> => {
      const snapshot = await batch.get(ref);
      if (!snapshot.exists || snapshot.data()?.status !== "pending_approval") return { ok: false, error: "Pending vacancy not found." };
      if (!(deadlineMillis(snapshot.data()?.applicationDeadline) > Date.now())) return { ok: false, error: "The deadline has passed. Reject the vacancy with a request to correct it." };
      batch.update(ref, { status: "published", publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      batch.create(db.collection("auditLogs").doc(), { actorId: admin.uid, action: "vacancy.published", entityType: "job", entityId: jobId, createdAt: FieldValue.serverTimestamp() });
      return { ok: true, id: jobId };
    });
    if (!result.ok) return result;
    revalidatePath("/admin", "layout");
    revalidatePath("/employer", "layout");
    revalidatePath("/student", "layout");
    revalidatePath("/jobs", "layout");
    revalidatePath("/");
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be approved." };
  }
}

export async function rejectVacancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireActionRole(["admin"]);
    const jobId = String(formData.get("jobId") ?? "").trim();
    if (!validId(jobId)) return { ok: false, error: "Vacancy ID is required." };
    const reason = formData.get("reason");
    if (typeof reason !== "string" || !reason.trim() || reason.length > 1000) return { ok: false, error: "Enter a rejection reason up to 1,000 characters." };
    const db = getAdminDb();
    const ref = db.collection("jobs").doc(jobId);
    const result = await db.runTransaction(async (batch): Promise<ActionResult> => {
      const snapshot = await batch.get(ref);
      if (!snapshot.exists || snapshot.data()?.status !== "pending_approval") return { ok: false, error: "Pending vacancy not found." };
      batch.update(ref, {
        status: "rejected",
        rejectionReason: reason.trim(),
        rejectedBy: admin.uid,
        rejectedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: admin.uid,
        action: "vacancy.rejected",
        entityType: "job",
        entityId: jobId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, id: jobId };
    });
    if (!result.ok) return result;
    revalidatePath("/admin", "layout");
    revalidatePath("/employer", "layout");
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be rejected." };
  }
}

function revalidateVacancyViews(jobId: string) {
  revalidatePath(`/admin/vacancies/${jobId}`);
  revalidatePath("/admin/vacancies");
  revalidatePath("/admin", "layout");
  revalidatePath("/employer", "layout");
  revalidatePath("/student", "layout");
  revalidatePath("/jobs", "layout");
  revalidatePath("/");
}

export async function closeVacancyAsAdminAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireActionRole(["admin"]);
    const jobId = String(formData.get("jobId") ?? "").trim();
    if (!validId(jobId)) return { ok: false, error: "Vacancy ID is required." };

    const db = getAdminDb();
    const ref = db.collection("jobs").doc(jobId);
    const result = await db.runTransaction(async (batch): Promise<ActionResult> => {
      const snapshot = await batch.get(ref);
      if (!snapshot.exists) return { ok: false, error: "Vacancy not found." };
      if (!canAdminCloseVacancy(snapshot.data()?.status)) return { ok: false, error: "Only a published vacancy can be closed." };

      batch.update(ref, {
        status: "closed",
        closedBy: admin.uid,
        closedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: admin.uid,
        action: "vacancy.closed",
        entityType: "job",
        entityId: jobId,
        metadata: { previousStatus: "published", source: "administrator" },
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, id: jobId };
    });
    if (!result.ok) return result;
    revalidateVacancyViews(jobId);
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be closed." };
  }
}

export async function archiveVacancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireActionRole(["admin"]);
    const jobId = String(formData.get("jobId") ?? "").trim();
    if (!validId(jobId)) return { ok: false, error: "Vacancy ID is required." };

    const db = getAdminDb();
    const ref = db.collection("jobs").doc(jobId);
    const result = await db.runTransaction(async (batch): Promise<ActionResult> => {
      const snapshot = await batch.get(ref);
      if (!snapshot.exists) return { ok: false, error: "Vacancy not found." };
      const previousStatus = String(snapshot.data()?.status ?? "draft");
      if (!canAdminArchiveVacancy(previousStatus)) {
        return previousStatus === "pending_approval"
          ? { ok: false, error: "Approve or reject the pending vacancy before archiving it." }
          : { ok: false, error: "This vacancy has already been archived." };
      }

      batch.update(ref, {
        status: "archived",
        archivedBy: admin.uid,
        archivedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: admin.uid,
        action: "vacancy.archived",
        entityType: "job",
        entityId: jobId,
        metadata: { previousStatus },
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, id: jobId };
    });
    if (!result.ok) return result;
    revalidateVacancyViews(jobId);
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be archived." };
  }
}

export async function setUserActiveAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireActionRole(["admin"]);
    const userId = String(formData.get("userId") ?? "");
    const desired = formData.get("active");
    if (desired !== "true" && desired !== "false") return { ok: false, error: "Invalid account status." };
    const active = desired === "true";
    if (!validId(userId) || userId === admin.uid) return { ok: false, error: "You cannot change your own account status." };
    const db = getAdminDb();
    const ref = db.collection("users").doc(userId);
    const targetSnapshot = await ref.get();
    if (!targetSnapshot.exists) return { ok: false, error: "User not found." };
    const target = targetSnapshot.data()!;

    if (target.role === "admin") {
      await requireAdminManager();
    }

    const auditRef = db.collection("auditLogs").doc();
    const sync = await db.runTransaction(async (transaction) => {
      const freshTarget = await transaction.get(ref);
      if (!freshTarget.exists) throw new AdminActionError("User not found.");
      if (freshTarget.get("role") === "admin" && admin.profile.canManageAdmins !== true) throw new AdminActionError("Only a primary administrator can manage this account.");
      const pending = freshTarget.get("accountStatusRequested");
      if (pending === active) return true;
      if (pending !== undefined) throw new AdminActionError("Finish the pending account change before making another.");
      if (freshTarget.get("accountActive") === active) return false;
      if (freshTarget.data()?.role === "admin" && !active) {
        const admins = await transaction.get(db.collection("users").where("role", "==", "admin"));
        const activeAdmins = admins.docs.filter((document) => document.data().accountActive !== false);
        if (activeAdmins.length <= 1) throw new AdminActionError("The final active administrator cannot be deactivated.");
      }
      transaction.update(ref, { accountActive: false, accountStatusRequested: active, updatedAt: FieldValue.serverTimestamp() });
      transaction.create(auditRef, {
        actorId: admin.uid,
        action: active ? "user.activated" : "user.deactivated",
        entityType: "user",
        entityId: userId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (!sync) return { ok: true, id: userId };

    await getAdminAuth().updateUser(userId, { disabled: !active });
    if (!active) await getAdminAuth().revokeRefreshTokens(userId);
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.get("accountStatusRequested") === active) {
        tx.update(ref, { accountActive: active, accountStatusRequested: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
      }
    });
    revalidatePath("/admin", "layout");
    return { ok: true, id: userId };
  } catch (error) {
    if (error instanceof AdminActionError) return { ok: false, error: error.message };
    console.error(JSON.stringify({ event: "account.synchronization_incomplete", requestId: crypto.randomUUID() }));
    return { ok: false, error: "The account change could not be completed. Refresh and retry the pending change." };
  }
}
