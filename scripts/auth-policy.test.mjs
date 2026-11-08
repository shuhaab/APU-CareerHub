import assert from "node:assert/strict";
import { test } from "node:test";
import { accessState, hasVerifiedSecondFactor, recentSignIn, validPassword } from "../src/lib/auth/policy.ts";

test("MFA sign-in, verified email and account state gate privileged sessions", () => {
  const token = { role: "admin", email_verified: true, firebase: {} };
  const profile = { role: "admin", accountActive: true };
  assert.equal(accessState(token, profile), "mfa");
  assert.equal(accessState({ ...token, firebase: { sign_in_second_factor: "totp" } }, profile), "admin");
  assert.equal(accessState({ ...token, email_verified: false }, profile), null);
  assert.equal(accessState(token, { ...profile, accountActive: false }), null);
  assert.equal(accessState(token, { ...profile, mustChangePassword: true, onboardingExpiresAt: 1 }), null);
  assert.equal(recentSignIn({ auth_time: Math.floor(Date.now() / 1000) - 301 }), false);
});

test("approval cannot promote an earlier employer credential", () => {
  const token = { role: "employer", email_verified: true, iat: 123 };
  const profile = { role: "employer", accountActive: true, approved: false };
  assert.equal(accessState(token, profile), "pending");
  const approved = { ...profile, approved: true, approvedAt: { seconds: 123 } };
  assert.equal(accessState(token, approved), null);
  assert.equal(accessState({ ...token, iat: 124 }, approved), "employer");
});


test("the signed-in factor must predate the authentication and still be enrolled", () => {
  const token = { auth_time: 123, firebase: { sign_in_second_factor: "totp", second_factor_identifier: "factor" } };
  const factor = { uid: "factor", factorId: "totp", enrollmentTime: new Date(123000).toISOString() };
  assert.equal(hasVerifiedSecondFactor(token, [factor]), false);
  assert.equal(hasVerifiedSecondFactor({ ...token, auth_time: 124 }, [factor]), true);
  assert.equal(hasVerifiedSecondFactor({ ...token, auth_time: 124 }, []), false);
});


test("password policy follows Firebase symbol and length rules", () => {
  assert.equal(validPassword("CareerHub123!"), true);
  assert.equal(validPassword("CareerHub123 "), false);
  assert.equal(validPassword("short123!"), false);
});
