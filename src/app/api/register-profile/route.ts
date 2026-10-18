import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      idToken?: string;
      fullName?: string;
      requestedRole?: "student" | "employer";
      studentId?: string;
      programme?: string;
      department?: string;
    };

    const fullName = payload.fullName?.trim() ?? "";
    const studentId = payload.studentId?.trim() ?? "";
    const programme = payload.programme?.trim() ?? "";
    const department = payload.department?.trim() ?? "";
    if (!payload.idToken || fullName.length < 2 || !payload.requestedRole) {
      return NextResponse.json({ error: "Required registration details are missing." }, { status: 400 });
    }
    if (payload.requestedRole === "student" && (!studentId || !programme)) {
      return NextResponse.json({ error: "Student ID and programme are required." }, { status: 400 });
    }
    if (payload.requestedRole === "employer" && !department) {
      return NextResponse.json({ error: "An APU department is required." }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(payload.idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Please register again." }, { status: 401 });
    }
    const userRef = getAdminDb().collection("users").doc(decoded.uid);
    if ((await userRef.get()).exists) {
      return NextResponse.json({ error: "A portal profile already exists for this account." }, { status: 409 });
    }

    const profileRole = payload.requestedRole;
    const trustedClaim = payload.requestedRole === "student" ? "student" : "pending_employer";

    const batch = getAdminDb().batch();
    batch.create(userRef, {
      email: decoded.email ?? "",
      fullName,
      role: profileRole,
      requestedRole: payload.requestedRole,
      studentId: payload.requestedRole === "student" ? studentId : null,
      programme: payload.requestedRole === "student" ? programme : null,
      department: payload.requestedRole === "employer" ? department : null,
      phone: "",
      bio: "",
      skills: [],
      availability: "",
      availableFrom: "",
      approved: payload.requestedRole === "student",
      accountActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(getAdminDb().collection("auditLogs").doc(), {
      actorId: decoded.uid,
      action: "user.registered",
      entityType: "user",
      entityId: decoded.uid,
      metadata: { requestedRole: payload.requestedRole },
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    await getAdminAuth().setCustomUserClaims(decoded.uid, { role: trustedClaim });

    return NextResponse.json({
      ok: true,
      pendingEmployerApproval: payload.requestedRole === "employer",
    });
  } catch {
    return NextResponse.json({ error: "Unable to create the portal profile." }, { status: 401 });
  }
}
