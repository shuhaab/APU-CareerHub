import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { accessState, hasVerifiedSecondFactor, recentSignIn } from "@/lib/auth/policy";
import { readJson, sameOrigin } from "@/lib/http/input";
import { enforceRateLimit, RateLimitError, trustedClientAddress } from "@/lib/http/rate-limit";

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" } as const;
const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  let idToken: unknown;
  try {
    ({ idToken } = await readJson(request, 16384, ["idToken"]));
    if (typeof idToken !== "string" || !idToken || idToken.length > 12000) throw new TypeError();
  } catch (error) {
    return NextResponse.json({ error: "A valid ID token is required." }, { status: error instanceof RangeError ? 413 : 400 });
  }
  try {
    await enforceRateLimit("session-address", trustedClientAddress(request), 20);
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    if (!recentSignIn(decoded)) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    await enforceRateLimit("session-user", decoded.uid, 5);

    const db = getAdminDb();
    const profile = (await db.collection("users").doc(decoded.uid).get()).data();
    let state = accessState(decoded, profile);
    if (state === "admin" && !hasVerifiedSecondFactor(decoded, (await auth.getUser(decoded.uid)).multiFactor?.enrolledFactors ?? [])) state = "mfa";
    if (!state) {
      const verifyEmail = profile?.accountActive === true && decoded.email_verified !== true;
      return NextResponse.json({ error: verifyEmail ? "Verify your email address to continue." : "This account cannot access the portal.", verifyEmail }, { status: 403, headers: noStore });
    }
    const maxAge = state === "admin" ? 8 * 60 * 60 : state === "pending" || state === "password" || state === "mfa" ? 15 * 60 : 5 * 24 * 60 * 60;
    const cookie = await auth.createSessionCookie(idToken, { expiresIn: maxAge * 1000 });
    await db.collection("auditLogs").add({
      actorId: decoded.uid, action: "authentication.signed_in", entityType: "user", entityId: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    const jar = await cookies();
    const restricted = state === "pending" || state === "password" || state === "mfa";
    jar.set(restricted ? "apu_session" : "apu_onboarding", "", { ...cookieOptions, maxAge: 0 });
    jar.set(restricted ? "apu_onboarding" : "apu_session", cookie, { ...cookieOptions, maxAge });
    return NextResponse.json({ ok: true, state }, { headers: noStore });
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { ...noStore, "Retry-After": "60" } });
    return NextResponse.json({ error: "Unable to create a secure session." }, { status: 401, headers: noStore });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  const cookieStore = await cookies();
  for (const name of ["apu_session", "apu_onboarding"]) cookieStore.set(name, "", { ...cookieOptions, maxAge: 0 });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
