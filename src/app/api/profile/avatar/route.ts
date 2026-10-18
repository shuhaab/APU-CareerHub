import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireRole, type SessionUser } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

const maximumAvatarSize = 3 * 1024 * 1024;

type SupportedImage = {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

function detectImage(bytes: Uint8Array): SupportedImage | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) {
    return { contentType: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

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
  const user = await authenticatedStudent();
  if (isErrorResponse(user)) return user;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a profile picture to upload." }, { status: 400 });
    }
    if (file.size > maximumAvatarSize) {
      return NextResponse.json({ error: "The profile picture must be 3 MB or smaller." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = detectImage(bytes);
    if (!image || file.type !== image.contentType) {
      return NextResponse.json({ error: "Upload a valid JPG, PNG, or WebP image." }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const profileSnapshot = await userRef.get();
    if (!profileSnapshot.exists || profileSnapshot.data()?.role !== "student") {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const previousPath = String(profileSnapshot.data()?.avatarStoragePath ?? "");
    const storagePath = `profile-pictures/${user.uid}/${crypto.randomUUID()}.${image.extension}`;
    const storageFile = getAdminStorage().bucket().file(storagePath);
    await storageFile.save(Buffer.from(bytes), {
      resumable: false,
      contentType: image.contentType,
      metadata: {
        cacheControl: "private, max-age=300",
        metadata: { ownerId: user.uid, purpose: "student-profile-picture" },
      },
    });

    const avatarUrl = `/api/profile/avatar?userId=${encodeURIComponent(user.uid)}`;
    const batch = db.batch();
    batch.update(userRef, {
      avatarUrl,
      avatarStoragePath: storagePath,
      avatarContentType: image.contentType,
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

    try {
      await batch.commit();
    } catch (error) {
      await storageFile.delete().catch(() => undefined);
      throw error;
    }

    if (previousPath.startsWith(`profile-pictures/${user.uid}/`) && previousPath !== storagePath) {
      await getAdminStorage().bucket().file(previousPath).delete().catch(() => undefined);
    }

    return NextResponse.json({ ok: true, avatarUrl });
  } catch {
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
    if (!userId) return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });

    let allowed = viewer.role === "admin" || (viewer.role === "student" && viewer.uid === userId);
    if (viewer.role === "employer" && applicationId) {
      const application = await getAdminDb().collection("applications").doc(applicationId).get();
      allowed = application.exists
        && application.data()?.employerId === viewer.uid
        && application.data()?.studentId === userId;
    }
    if (!allowed) return NextResponse.json({ error: "Profile picture access denied." }, { status: 403 });

    const profileSnapshot = await getAdminDb().collection("users").doc(userId).get();
    const storagePath = String(profileSnapshot.data()?.avatarStoragePath ?? "");
    const contentType = String(profileSnapshot.data()?.avatarContentType ?? "image/jpeg");
    if (!profileSnapshot.exists || !storagePath.startsWith(`profile-pictures/${userId}/`)) {
      return NextResponse.json({ error: "Profile picture not found." }, { status: 404 });
    }

    const [bytes] = await getAdminStorage().bucket().file(storagePath).download();
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "The profile picture could not be loaded." }, { status: 404 });
  }
}

export async function DELETE() {
  const user = await authenticatedStudent();
  if (isErrorResponse(user)) return user;

  try {
    const db = getAdminDb();
    const userRef = db.collection("users").doc(user.uid);
    const profileSnapshot = await userRef.get();
    if (!profileSnapshot.exists) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

    const storagePath = String(profileSnapshot.data()?.avatarStoragePath ?? "");
    const batch = db.batch();
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
    await batch.commit();

    if (storagePath.startsWith(`profile-pictures/${user.uid}/`)) {
      await getAdminStorage().bucket().file(storagePath).delete().catch(() => undefined);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The profile picture could not be removed. Please try again." }, { status: 500 });
  }
}
