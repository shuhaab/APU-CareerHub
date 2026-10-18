import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

async function authenticatedStudent() {
  try {
    return await requireRole(["student"]);
  } catch {
    return null;
  }
}

function validDocumentId(id: string) {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
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
  const user = await authenticatedStudent();
  if (!user) return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });

  try {
    const { id } = await params;
    if (!validDocumentId(id)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const body = await request.json().catch(() => null) as { name?: unknown } | null;
    const db = getAdminDb();
    const documentRef = db.collection("users").doc(user.uid).collection("documents").doc(id);
    const snapshot = await documentRef.get();
    if (!snapshot.exists || snapshot.data()?.ownerId !== user.uid) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const currentName = String(snapshot.data()?.originalName ?? "");
    const nextName = normalizedDocumentName(body?.name, currentName);
    if (!nextName) {
      return NextResponse.json({ error: "Enter a document name up to 180 characters and keep the original file extension." }, { status: 400 });
    }
    if (nextName === currentName) return NextResponse.json({ ok: true, name: nextName });

    const batch = db.batch();
    batch.update(documentRef, { originalName: nextName, updatedAt: FieldValue.serverTimestamp() });
    batch.create(db.collection("auditLogs").doc(), {
      actorId: user.uid,
      action: "document.renamed",
      entityType: "document",
      entityId: id,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    revalidatePath("/student", "layout");
    revalidatePath("/employer", "layout");
    return NextResponse.json({ ok: true, name: nextName });
  } catch {
    return NextResponse.json({ error: "The document could not be renamed." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedStudent();
  if (!user) return NextResponse.json({ error: "Student authentication is required." }, { status: 401 });

  try {
    const { id } = await params;
    if (!validDocumentId(id)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    const db = getAdminDb();
    const documentRef = db.collection("users").doc(user.uid).collection("documents").doc(id);
    const [snapshot, applications] = await Promise.all([
      documentRef.get(),
      db.collection("applications").where("studentId", "==", user.uid).get(),
    ]);
    if (!snapshot.exists || snapshot.data()?.ownerId !== user.uid) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const attachedApplication = applications.docs.find((application) => {
      const data = application.data();
      if (data.documentId === id) return true;
      return Array.isArray(data.documentIds)
        && data.documentIds.some((entry: unknown) => typeof entry === "object" && entry !== null && "documentId" in entry && entry.documentId === id);
    });
    if (attachedApplication) {
      return NextResponse.json({ error: "This document is attached to an application and must be retained as part of its submitted record." }, { status: 409 });
    }

    const storagePath = String(snapshot.data()?.storagePath ?? "");
    if (!storagePath.startsWith(`application-documents/${user.uid}/`)) {
      return NextResponse.json({ error: "The document storage path is invalid." }, { status: 409 });
    }

    await getAdminStorage().bucket().file(storagePath).delete({ ignoreNotFound: true });
    const batch = db.batch();
    batch.delete(documentRef);
    batch.create(db.collection("auditLogs").doc(), {
      actorId: user.uid,
      action: "document.deleted",
      entityType: "document",
      entityId: id,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    revalidatePath("/student", "layout");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The document could not be deleted. Please try again." }, { status: 500 });
  }
}
