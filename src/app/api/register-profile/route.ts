import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { recentSignIn } from "@/lib/auth/policy";
import { readJson, sameOrigin } from "@/lib/http/input";
import { enforceRateLimit, RateLimitError, trustedClientAddress } from "@/lib/http/rate-limit";

const keys = ["idToken", "fullName", "requestedRole", "studentId", "programme", "department"];

function text(value: unknown, max: number) {
  if (typeof value !== "string" || value.length > max) throw new TypeError("Invalid registration field.");
  return value.trim();
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  let details;
  try {
    const body = await readJson(request, 16384, keys);
    const idToken = text(body.idToken, 12000);
    const fullName = text(body.fullName, 120);
    const role = body.requestedRole;
    const studentId = text(body.studentId ?? "", 40);
    const programme = text(body.programme ?? "", 180);
    const department = text(body.department ?? "", 180);
    if (!idToken || fullName.length < 2 || (role !== "student" && role !== "employer") ||
        (role === "student" && (!/^[A-Za-z0-9_-]+$/.test(studentId) || !programme || department)) ||
        (role === "employer" && (!department || studentId || programme))) throw new TypeError();
    details = { idToken, fullName, role, studentId, programme, department };
  } catch (error) {
    return NextResponse.json({ error: "Enter valid registration details for your role." }, { status: error instanceof RangeError ? 413 : 400 });
  }
  try {
    await enforceRateLimit("registration-address", trustedClientAddress(request), 10);
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(details.idToken, true);
    if (!recentSignIn(decoded) || !decoded.email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    await enforceRateLimit("registration-user", decoded.uid, 3);
    const db = getAdminDb();
    const user = db.collection("users").doc(decoded.uid);
    const { role } = details;
    const accepted = await db.runTransaction(async (tx) => {
      const existing = (await tx.get(user)).data();
      if (existing) return existing.role === role && existing.requestedRole === role && existing.accountActive === true;
      if (decoded.role !== undefined) return false;
      tx.create(user, {
        email: decoded.email, fullName: details.fullName, role, requestedRole: role,
        studentId: role === "student" ? details.studentId : null,
        programme: role === "student" ? details.programme : null,
        department: role === "employer" ? details.department : null,
        approved: role === "student", accountActive: true,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(db.collection("auditLogs").doc(), {
        actorId: decoded.uid, action: "user.registered", entityType: "user", entityId: decoded.uid,
        metadata: { requestedRole: role }, createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (!accepted) return NextResponse.json({ error: "This registration cannot be resumed." }, { status: 409 });
    // Only approval writes an employer claim, so a delayed registration retry cannot downgrade it.
    if (role === "student" && decoded.role !== "student") await auth.setCustomUserClaims(decoded.uid, { role });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json({ error: "Unable to finish registration. Try again with the same account." }, { status: 503 });
  }
}
