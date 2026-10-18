import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile, UserRole } from "@/types";

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
  profile: UserProfile;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const sessionCookie = (await cookies()).get("apu_session")?.value;
  if (!sessionCookie) return null;

  try {
    const claims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const role = claims.role;
    if (role !== "student" && role !== "employer" && role !== "admin") return null;
    const profileSnapshot = await getAdminDb().collection("users").doc(claims.uid).get();
    if (!profileSnapshot.exists) return null;
    const data = profileSnapshot.data()!;
    if (data.accountActive !== true || data.role !== role) return null;
    if (role === "employer" && data.approved !== true) return null;
    const profile: UserProfile = {
      id: claims.uid,
      email: String(data.email ?? claims.email ?? ""),
      fullName: String(data.fullName ?? "Portal user"),
      role,
      requestedRole: data.requestedRole,
      studentId: data.studentId || undefined,
      programme: data.programme || undefined,
      department: data.department || undefined,
      phone: data.phone || undefined,
      bio: data.bio || undefined,
      skills: Array.isArray(data.skills) ? data.skills.map(String) : [],
      availability: data.availability || undefined,
      availableFrom: data.availableFrom || undefined,
      avatarUrl: data.avatarUrl || undefined,
      approved: Boolean(data.approved),
      canManageAdmins: data.canManageAdmins === true,
      mustChangePassword: data.mustChangePassword === true,
      accountActive: true,
    };
    return { uid: claims.uid, email: claims.email, role, profile };
  } catch {
    return null;
  }
});

export async function requireRole(roles: UserRole[], options?: { allowPasswordChangeRequired?: boolean }): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) throw new Error("Unauthorized request.");
  if (user.profile.mustChangePassword && !options?.allowPasswordChangeRequired) {
    throw new Error("A password change is required before continuing.");
  }
  return user;
}

export async function enforcePageRole(role: UserRole): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(`/${user.role}`);
  return user;
}
