import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readJson, sameOrigin, validId } from "@/lib/http/input";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

async function authenticatedStudent() {
  try {
    return await requireRole(["student"]);
  } catch {
    return null;
  }
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.(pdf|doc|docx)$/);
  return match?.[1] ?? "";
}

function normalizedDocumentName(value: unknown, currentName: string) {
  const requestedName = typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/g, " ") : "";
  if (!requestedName || requestedName.length > 180 || /[\u0000-\u001f\u007f/\\]/.test(requestedName)) return null;

  const currentExtension = extensionOf(currentName);
  if (!currentExtension) return null;
  const requestedExtension = extensionOf(requestedName);
  const name = requestedExtension ? requestedName : `${requestedName}.${currentExtension}`;
  if (extensionOf(name) !== currentExtension || name.length > 180) return null;
  if (!name.slice(0, -(currentExtension.length + 1)).trim()) return null;
  return name;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  const user = await authenticatedStudent();
  if (!user) return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });

  try {
    const { id } = await params;
    if (!validId(id)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    let body;
    try { body = await readJson(request, 2048, ["name"]); }
    catch (error) { return NextResponse.json({ error: "Invalid document name." }, { status: error instanceof RangeError ? 413 : 400 }); }
    const db = getAdminDb();
    const documentRef = db.collection("users").doc(user.uid).collection("documents").doc(id);
    const result = await db.runTransaction(async (batch) => {
      const snapshot = await batch.get(documentRef);
      if (!snapshot.exists || snapshot.data()?.ownerId !== user.uid || snapshot.get("pendingDeletion")) {
        return NextResponse.json({ error: "Document not found." }, { status: 404 });
      }

      const currentName = String(snapshot.data()?.originalName ?? "");
      const nextName = normalizedDocumentName(body?.name, currentName);
      if (!nextName) {
        return NextResponse.json({ error: "Enter a document name up to 180 characters and keep the original file extension." }, { status: 400 });
      }
      if (nextName === currentName) return NextResponse.json({ ok: true, name: nextName });

      batch.update(documentRef, { originalName: nextName, updatedAt: FieldValue.serverTimestamp() });
      batch.create(db.collection("auditLogs").doc(), {
        actorId: user.uid,
        action: "document.renamed",
        entityType: "document",
        entityId: id,
        createdAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, name: nextName });
    });
    revalidatePath("/student", "layout");
    revalidatePath("/employer", "layout");
    return result;
  } catch {
    return NextResponse.json({ error: "The document could not be renamed." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin denied." }, { status: 403 });
  const user = await authenticatedStudent();
  if (!user) return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });

  try {
    const { id } = await params;
    if (!validId(id)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const db = getAdminDb();
    const documentRef = db.collection("users").doc(user.uid).collection("documents").doc(id);
    const storagePath = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(documentRef);
      if (!snapshot.exists) return null;
      const data = snapshot.data()!;
      const path = String(data.storagePath ?? "");
      if (data.ownerId !== user.uid || !path.startsWith(`application-documents/${user.uid}/`)) return false;
      if (!data.pendingDeletion) {
        const applications = await tx.get(db.collection("applications").where("studentId", "==", user.uid));
        if (applications.docs.some((application) => {
          const { documentId, documentIds } = application.data();
          return documentId === id || (Array.isArray(documentIds) && documentIds.some((entry) => entry === id || entry?.documentId === id));
        })) return false;
        tx.update(documentRef, { pendingDeletion: true, updatedAt: FieldValue.serverTimestamp() });
      }
      return path;
    });
    if (storagePath === false) return NextResponse.json({ error: "An attached or invalid document cannot be deleted." }, { status: 409 });
    if (storagePath === null) return NextResponse.json({ ok: true });

    await getAdminStorage().bucket().file(storagePath).delete({ ignoreNotFound: true });
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(documentRef);
      if (!snapshot.exists || snapshot.get("pendingDeletion") !== true || snapshot.get("storagePath") !== storagePath) return;
      tx.delete(documentRef);
      tx.create(db.collection("auditLogs").doc(), {
        actorId: user.uid, action: "document.deleted", entityType: "document", entityId: id,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    revalidatePath("/student", "layout");
    return NextResponse.json({ ok: true });
  } catch {
    console.error(JSON.stringify({ event: "document.deletion_incomplete", requestId: crypto.randomUUID() }));
    return NextResponse.json({ error: "The document could not be deleted. Please try again." }, { status: 500 });
  }
}
