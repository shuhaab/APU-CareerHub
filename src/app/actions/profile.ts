"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/applications";
import { requireRole } from "@/lib/auth/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireRole(["student", "employer", "admin"]);
  const fullName = text(formData, "fullName", 120);
  if (fullName.length < 2) throw new Error("A valid full name is required.");

  const updates: Record<string, unknown> = {
    fullName,
    phone: text(formData, "phone", 40),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (user.role === "student") {
    const studentId = text(formData, "studentId", 40);
    const programme = text(formData, "programme", 180);
    if (!studentId || !programme) throw new Error("Student ID and programme are required.");
    updates.studentId = studentId;
    updates.programme = programme;
    updates.bio = text(formData, "bio", 1000);
    updates.skills = text(formData, "skills", 500).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
    updates.availability = text(formData, "availability", 120);
    updates.availableFrom = text(formData, "availableFrom", 20);
  }

  if (user.role === "employer") {
    const department = text(formData, "department", 180);
    if (!department) throw new Error("Department is required.");
    updates.department = department;
    updates.bio = text(formData, "bio", 1500);
  }

  const db = getAdminDb();
  const batch = db.batch();
  batch.update(db.collection("users").doc(user.uid), updates);
  batch.create(db.collection("auditLogs").doc(), {
    actorId: user.uid,
    action: "user.profile_updated",
    entityType: "user",
    entityId: user.uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  revalidatePath(`/${user.role}`, "layout");
}

export async function updateAccountSettingsAction(formData: FormData): Promise<void> {
  const user = await requireRole(["student", "employer", "admin"]);
  const fullName = text(formData, "fullName", 120);
  if (fullName.length < 2) throw new Error("A valid full name is required.");

  const db = getAdminDb();
  const batch = db.batch();
  batch.update(db.collection("users").doc(user.uid), {
    fullName,
    phone: text(formData, "phone", 40),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.create(db.collection("auditLogs").doc(), {
    actorId: user.uid,
    action: "user.account_settings_updated",
    entityType: "user",
    entityId: user.uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  revalidatePath(`/${user.role}`, "layout");
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["student", "employer", "admin"], { allowPasswordChangeRequired: true });
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword) return { ok: false, error: "Enter your current password." };
    if (newPassword.length < 12 || newPassword.length > 128 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return { ok: false, error: "Your new password must be 12–128 characters and include uppercase, lowercase, a number, and a symbol." };
    }
    if (newPassword !== confirmPassword) return { ok: false, error: "The new password confirmation does not match." };
    if (newPassword === currentPassword) return { ok: false, error: "Choose a new password that differs from your current password." };

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey || !user.email) return { ok: false, error: "Firebase password verification is not configured." };
    const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: currentPassword, returnSecureToken: false }),
      cache: "no-store",
    });
    if (!verification.ok) return { ok: false, error: "The current password is incorrect." };

    await getAdminAuth().updateUser(user.uid, { password: newPassword });
    const db = getAdminDb();
    const batch = db.batch();
    batch.update(db.collection("users").doc(user.uid), {
      mustChangePassword: false,
      passwordChangedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(db.collection("auditLogs").doc(), {
      actorId: user.uid,
      action: "user.password_changed",
      entityType: "user",
      entityId: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    revalidatePath(`/${user.role}`, "layout");
    return { ok: true, id: user.uid };
  } catch {
    return { ok: false, error: "Your password could not be changed. Please try again." };
  }
}
