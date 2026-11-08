"use server";

import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/applications";
import { hasVerifiedSecondFactor, recentSignIn, validPassword } from "@/lib/auth/policy";
import { requireActionRole } from "@/lib/auth/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

function text(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  if (value === null) return "";
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid profile field.");
  return value.trim();
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireActionRole(["student", "employer", "admin"]);
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
  const user = await requireActionRole(["student", "employer", "admin"]);
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
    const user = await requireActionRole(["student", "employer", "admin"], { allowPasswordChangeRequired: true });
    const token = formData.get("reauthToken");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");
    if (!validPassword(newPassword)) return { ok: false, error: "Your new password must be 12–128 characters and include uppercase, lowercase, a number, and a symbol." };
    if (newPassword !== confirmPassword) return { ok: false, error: "The new password confirmation does not match." };
    if (typeof token !== "string" || token.length > 12000) return { ok: false, error: "Sign in again before changing your password." };
    const auth = getAdminAuth();
    const identity = await auth.verifyIdToken(token, true);
    if (identity.uid !== user.uid || !recentSignIn(identity) || identity.email_verified !== true ||
        (user.role === "admin" && !user.profile.mustChangePassword && !hasVerifiedSecondFactor(identity, (await auth.getUser(user.uid)).multiFactor?.enrolledFactors ?? []))) {
      return { ok: false, error: "Sign in again before changing your password." };
    }
    await auth.updateUser(user.uid, { password: newPassword });
    await auth.revokeRefreshTokens(user.uid);
    const jar = await cookies();
    jar.delete("apu_session");
    jar.delete("apu_onboarding");
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
