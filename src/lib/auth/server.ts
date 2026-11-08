import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { appOrigin } from "@/lib/http/input";
import { accessState, hasVerifiedSecondFactor } from "@/lib/auth/policy";
import type { UserProfile, UserRole } from "@/types";

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
  profile: UserProfile;
}

export const getSessionAccount = cache(async (): Promise<(SessionUser & { state: NonNullable<ReturnType<typeof accessState>> }) | null> => {
  const jar = await cookies();
  const portalCookie = jar.get("apu_session")?.value;
  const sessionCookie = portalCookie || jar.get("apu_onboarding")?.value;
  if (!sessionCookie) return null;

  try {
    const auth = getAdminAuth();
    const claims = await auth.verifySessionCookie(sessionCookie, true);

    const profileSnapshot = await getAdminDb().collection("users").doc(claims.uid).get();
    if (!profileSnapshot.exists) return null;
    const data = profileSnapshot.data()!;
    let state = accessState(claims, data);
    if (state === "admin" && !hasVerifiedSecondFactor(claims, (await auth.getUser(claims.uid)).multiFactor?.enrolledFactors ?? [])) state = "mfa";
    if (!state) return null;
    const restricted = state === "pending" || state === "password" || state === "mfa";
    if (Boolean(portalCookie) === restricted || restricted !== (claims.exp - claims.iat <= 15 * 60)) return null;
    const role: UserRole = state === "pending" ? "employer" : state === "password" || state === "mfa" ? "admin" : state;
    if (state === "admin" && (claims.exp - claims.iat > 8 * 60 * 60 || Date.now() / 1000 - claims.iat >= 8 * 60 * 60)) return null;
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
    return { uid: claims.uid, email: claims.email, role, profile, state };
  } catch {
    return null;
  }
});

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const account = await getSessionAccount();
  return account?.state === account?.role ? account : null;
});

export async function requireRole(roles: UserRole[], options?: { allowPasswordChangeRequired?: boolean }): Promise<SessionUser> {
  const user = await getSessionAccount();
  if (!user || !roles.includes(user.role) ||
      (user.state !== user.role && !(user.state === "password" && options?.allowPasswordChangeRequired))) {
    throw new Error("Unauthorized request.");
  }
  return user;
}

export async function requireActionRole(roles: UserRole[], options?: { allowPasswordChangeRequired?: boolean }) {
  const origin = appOrigin();
  if (!origin || (await headers()).get("origin") !== origin) throw new Error("Request origin denied.");
  return requireRole(roles, options);
}

export async function enforcePageRole(role: UserRole): Promise<SessionUser> {
  const user = await getSessionAccount();
  if (!user) redirect("/login");
  if (user.state !== user.role) redirect("/onboarding");
  if (user.role !== role) redirect(`/${user.role}`);
  return user;
}
