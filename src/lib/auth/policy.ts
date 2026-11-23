import type { DecodedIdToken, MultiFactorInfo } from "firebase-admin/auth";

export const recentSignIn = (token: DecodedIdToken) => {
  const age = Math.floor(Date.now() / 1000) - token.auth_time;
  return age >= 0 && age < 300;
};

// Match Firebase Authentication's definition of a symbol.
const passwordSymbols = String.raw`^$*.[]{}()?"!@#%&/\,><':;|_~`;

export const validPassword = (password: unknown): password is string =>
  typeof password === "string" && password.length >= 12 && password.length <= 128 &&
  /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && [...password].some((character) => passwordSymbols.includes(character));

export function accessState(
  token: DecodedIdToken,
  profile: Record<string, unknown> | undefined,
): "pending" | "student" | "employer" | "password" | "mfa" | "admin" | null {
  if (!profile || profile.accountActive !== true || token.email_verified !== true) return null;
  if (profile.role === "employer" && profile.approved !== true &&
      (token.role === undefined || token.role === "pending_employer" || token.role === "employer")) return "pending";
  if (token.role !== profile.role) return null;
  if (profile.role === "employer") {
    const approvedAt = profile.approvedAt as { seconds?: number } | undefined;
    return approvedAt?.seconds !== undefined && token.iat <= approvedAt.seconds ? null : "employer";
  }
  if (profile.role === "student") return "student";
  if (profile.role !== "admin") return null;
  if (profile.mustChangePassword === true) {
    const deadline = profile.onboardingExpiresAt;
    if (typeof deadline === "number" && deadline <= Date.now()) return null;
    return "password";
  }
  return token.firebase?.sign_in_second_factor ? "admin" : "mfa";
}


export function hasVerifiedSecondFactor(token: DecodedIdToken, factors: readonly MultiFactorInfo[]) {
  return factors.some((factor) => {
    const enrollment = factor.enrollmentTime ? Date.parse(factor.enrollmentTime) : NaN;
    return factor.uid === token.firebase?.second_factor_identifier
      && factor.factorId === token.firebase.sign_in_second_factor
      && token.auth_time > Math.floor(enrollment / 1000);
  });
}
