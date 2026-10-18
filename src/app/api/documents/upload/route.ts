import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireRole, type SessionUser } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: Request) {
  let user: SessionUser;
  try {
    user = await requireRole(["student"]);
  } catch {
    return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const applicationId = String(form.get("applicationId") ?? "profile");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "The document type or size is not allowed." }, { status: 400 });
    if (!/^[a-zA-Z0-9_-]{1,256}$/.test(applicationId)) return NextResponse.json({ error: "Invalid document destination." }, { status: 400 });
    if (applicationId !== "profile") {
      const application = await getAdminDb().collection("applications").doc(applicationId).get();
      if (!application.exists || application.data()?.studentId !== user.uid) return NextResponse.json({ error: "Invalid application document path." }, { status: 403 });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const id = crypto.randomUUID();
    const path = `application-documents/${user.uid}/${applicationId}/${id}-${safeName}`;
    const storageFile = getAdminStorage().bucket().file(path);
    await storageFile.save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      contentType: file.type,
      metadata: { metadata: { ownerId: user.uid, applicationId } },
    });
    const db = getAdminDb();
    const batch = db.batch();
    batch.set(db.collection("users").doc(user.uid).collection("documents").doc(id), {
      ownerId: user.uid,
      applicationId,
      originalName: file.name,
      storagePath: path,
      mimeType: file.type,
      contentType: file.type,
      fileSize: file.size,
      size: file.size,
      uploadedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    if (applicationId !== "profile") {
      batch.update(db.collection("applications").doc(applicationId), {
        documentIds: FieldValue.arrayUnion({ ownerId: user.uid, documentId: id }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    batch.create(db.collection("auditLogs").doc(), {
      actorId: user.uid,
      action: "document.uploaded",
      entityType: "document",
      entityId: id,
      createdAt: FieldValue.serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch (error) {
      await storageFile.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ ok: true, id, path });
  } catch {
    return NextResponse.json({ error: "The document could not be uploaded." }, { status: 500 });
  }
}
