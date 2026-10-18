import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) return NextResponse.json({ error: "An ID token is required." }, { status: 400 });

    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    const signedInRecently = Date.now() / 1000 - decoded.auth_time < 5 * 60;
    if (!signedInRecently) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const profileSnapshot = await getAdminDb().collection("users").doc(decoded.uid).get();
    if (!profileSnapshot.exists) {
      return NextResponse.json({ error: "Your portal profile is missing. Contact an administrator." }, { status: 403 });
    }
    const profile = profileSnapshot.data()!;
    if (profile.accountActive !== true) {
      return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });
    }
    if (decoded.role === "pending_employer" || (profile.role === "employer" && profile.approved !== true)) {
      return NextResponse.json({ error: "Employer access is awaiting administrator approval." }, { status: 403 });
    }
    if (!["student", "employer", "admin"].includes(String(decoded.role)) || decoded.role !== profile.role) {
      return NextResponse.json({ error: "Your account role is not configured correctly." }, { status: 403 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_SECONDS * 1000,
    });

    (await cookies()).set("apu_session", sessionCookie, {
      maxAge: SESSION_DURATION_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    await getAdminDb().collection("auditLogs").add({
      actorId: decoded.uid,
      action: "authentication.signed_in",
      entityType: "user",
      entityId: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      role: decoded.role,
      mustChangePassword: profile.mustChangePassword === true,
    });
  } catch {
    return NextResponse.json({ error: "Unable to create a secure session." }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const currentCookie = cookieStore.get("apu_session")?.value;
  if (currentCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(currentCookie);
      await getAdminDb().collection("auditLogs").add({
        actorId: decoded.uid,
        action: "authentication.signed_out",
        entityType: "user",
        entityId: decoded.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch {
      // An expired or invalid cookie is still safe to clear.
    }
  }
  cookieStore.set("apu_session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return NextResponse.json({ ok: true });
}
