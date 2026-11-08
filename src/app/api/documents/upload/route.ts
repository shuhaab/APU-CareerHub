import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireRole, type SessionUser } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

import { readBody, sameOrigin, validId } from "@/lib/http/input";
import { enforceRateLimit, RateLimitError } from "@/lib/http/rate-limit";
import { validDocument } from "@/lib/files/validate";
import { recordFileCleanupFailure } from "@/lib/files/audit";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  let user: SessionUser;
  try {
    user = await requireRole(["student"]);
  } catch {
    return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });
  }

  try {
    await enforceRateLimit("document-upload", user.uid, 6);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) throw new TypeError();
    const form = await (await readBody(request, 5 * 1024 * 1024 + 65536)).formData();
    if ([...form.keys()].some((key) => key !== "file" && key !== "applicationId") || form.getAll("file").length !== 1 || form.getAll("applicationId").length > 1) throw new TypeError();
    const file = form.get("file");
    const applicationId = form.get("applicationId") ?? "profile";
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024 || file.name.length > 180 || /[\x00-\x1f\x7f/\\]/.test(file.name)) return NextResponse.json({ error: "The document type or size is not allowed." }, { status: 400 });
    if (!validId(applicationId, 257)) return NextResponse.json({ error: "Invalid document destination." }, { status: 400 });
    if (applicationId !== "profile") {
      const application = await getAdminDb().collection("applications").doc(applicationId).get();
      if (!application.exists || application.data()?.studentId !== user.uid) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!(await validDocument(bytes, file.type, file.name))) return NextResponse.json({ error: "Upload a valid PDF, DOC, or DOCX document." }, { status: 400 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const id = crypto.randomUUID();
    const path = `application-documents/${user.uid}/${applicationId}/${id}-${safeName}`;
    const storageFile = getAdminStorage().bucket().file(path);
    await storageFile.save(bytes, {
      resumable: false,
      contentType: file.type,
      metadata: { metadata: { ownerId: user.uid, applicationId } },
    });
    const db = getAdminDb();
    try {
      await db.runTransaction(async (batch) => {
        const application = db.collection("applications").doc(applicationId);
        if (applicationId !== "profile" && (await batch.get(application)).get("studentId") !== user.uid) throw new Error("Application not found.");
        batch.create(db.collection("users").doc(user.uid).collection("documents").doc(id), {
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
          batch.update(application, {
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
      });
    } catch (error) {
      await storageFile.delete({ ignoreNotFound: true }).catch(() => recordFileCleanupFailure(id, path));
      throw error;
    }
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": "60" } });
    if (error instanceof RangeError || error instanceof TypeError) return NextResponse.json({ error: "Invalid document upload." }, { status: error instanceof RangeError ? 413 : 400 });
    return NextResponse.json({ error: "The document could not be uploaded." }, { status: 500 });
  }
}
