import sharp from "sharp";
import { readBody, sameOrigin, validId } from "@/lib/http/input";
import { enforceRateLimit, RateLimitError } from "@/lib/http/rate-limit";
import { recordFileCleanupFailure } from "@/lib/files/audit";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireRole, type SessionUser } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

const maximumAvatarSize = 3 * 1024 * 1024;

async function authenticatedStudent(): Promise<SessionUser | NextResponse> {
  try {
    return await requireRole(["student"]);
  } catch {
    return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });
  }
}

function isErrorResponse(value: SessionUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  const user = await authenticatedStudent();
  if (isErrorResponse(user)) return user;

  try {
    await enforceRateLimit("avatar-upload", user.uid, 6);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) throw new TypeError();
    const form = await (await readBody(request, maximumAvatarSize + 65536)).formData();
    if ([...form.keys()].some((key) => key !== "file") || form.getAll("file").length !== 1) throw new TypeError();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a profile picture to upload." }, { status: 400 });
    }
    if (file.size > maximumAvatarSize) {
      return NextResponse.json({ error: "The profile picture must be 3 MB or smaller." }, { status: 400 });
    }

    let bytes: Buffer;
    try {
      const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000, failOn: "warning" });
      const { format, pages } = await input.metadata();
      if (!format || !["jpeg", "png", "webp"].includes(format) || file.type !== `image/${format}` || (pages ?? 1) > 1) throw new Error();
      bytes = await input.autoOrient().resize(512, 512, { fit: "inside", withoutEnlargement: true }).webp().toBuffer();
    } catch {
      return NextResponse.json({ error: "Upload a valid JPG, PNG, or WebP image." }, { status: 400 });
    }
    const contentType = "image/webp";
    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const profileSnapshot = await userRef.get();
    if (!profileSnapshot.exists || profileSnapshot.data()?.role !== "student") {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const requestId = crypto.randomUUID();
    const storagePath = `profile-pictures/${user.uid}/${requestId}.webp`;
    const storageFile = getAdminStorage().bucket().file(storagePath);
    await storageFile.save(bytes, {
      resumable: false,
      contentType: contentType,
      metadata: {
        cacheControl: "private, no-store",
        metadata: { ownerId: user.uid, purpose: "student-profile-picture" },
      },
    });

    const avatarUrl = `/api/profile/avatar?userId=${encodeURIComponent(user.uid)}`;
    let previousPath = "";
    try {
      previousPath = await db.runTransaction(async (batch) => {
        const current = await batch.get(userRef);
        if (current.get("accountActive") !== true || current.get("role") !== "student") throw new Error("Student account unavailable.");
        batch.update(userRef, {
          avatarUrl,
          avatarStoragePath: storagePath,
          avatarContentType: contentType,
          avatarUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        batch.create(db.collection("auditLogs").doc(), {
          actorId: user.uid,
          action: "user.profile_picture_updated",
          entityType: "user",
          entityId: user.uid,
          createdAt: FieldValue.serverTimestamp(),
        });

        return String(current.get("avatarStoragePath") ?? "");
      });
    } catch (error) {
      await storageFile.delete({ ignoreNotFound: true }).catch(() => recordFileCleanupFailure(requestId, storagePath));
      throw error;
    }

    if (previousPath.startsWith(`profile-pictures/${user.uid}/`) && previousPath !== storagePath) {
      await getAdminStorage().bucket().file(previousPath).delete({ ignoreNotFound: true }).catch(() => recordFileCleanupFailure(requestId, previousPath));
    }

    return NextResponse.json({ ok: true, avatarUrl });
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": "60" } });
    if (error instanceof RangeError || error instanceof TypeError) return NextResponse.json({ error: "Invalid profile picture upload." }, { status: error instanceof RangeError ? 413 : 400 });
    return NextResponse.json({ error: "The profile picture could not be uploaded. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  let viewer: SessionUser;
  try {
    viewer = await requireRole(["student", "employer", "admin"]);
  } catch {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") ?? "";
    const applicationId = url.searchParams.get("applicationId") ?? "";
    if (!validId(userId) || (applicationId && !validId(applicationId, 257))) return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });

    await enforceRateLimit("avatar-download", viewer.uid, 120);
    let allowed = viewer.role === "admin" || (viewer.role === "student" && viewer.uid === userId);
    if (viewer.role === "employer" && applicationId) {
      const application = await getAdminDb().collection("applications").doc(applicationId).get();
      allowed = application.exists
        && application.data()?.employerId === viewer.uid
        && application.data()?.studentId === userId;
    }
    if (!allowed) return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });

    const profileSnapshot = await getAdminDb().collection("users").doc(userId).get();
    const storagePath = String(profileSnapshot.data()?.avatarStoragePath ?? "");
    const contentType = String(profileSnapshot.data()?.avatarContentType ?? "image/jpeg");
    if (!profileSnapshot.exists || !storagePath.startsWith(`profile-pictures/${userId}/`)) {
      return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
    const [bytes] = await getAdminStorage().bucket().file(storagePath).download();
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json({ error: "The profile picture could not be loaded." }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  const user = await authenticatedStudent();
  if (isErrorResponse(user)) return user;

  try {
    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const storagePath = await db.runTransaction(async (batch) => {
      const profile = await batch.get(userRef);
      const path = String(profile.get("avatarStoragePath") ?? "");
      if (!path.startsWith(`profile-pictures/${user.uid}/`)) return "";
      batch.update(userRef, {
        avatarUrl: FieldValue.delete(),
        avatarStoragePath: FieldValue.delete(),
        avatarContentType: FieldValue.delete(),
        avatarUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: user.uid,
        action: "user.profile_picture_removed",
        entityType: "user",
        entityId: user.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      return path;
    });

    if (storagePath.startsWith(`profile-pictures/${user.uid}/`)) {
      await getAdminStorage().bucket().file(storagePath).delete({ ignoreNotFound: true }).catch(() => recordFileCleanupFailure(crypto.randomUUID(), storagePath));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The profile picture could not be removed. Please try again." }, { status: 500 });
  }
}
