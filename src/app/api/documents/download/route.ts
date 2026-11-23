import { FieldValue } from "firebase-admin/firestore";
import { validId } from "@/lib/http/input";
import { enforceRateLimit, RateLimitError } from "@/lib/http/rate-limit";
import { NextResponse } from "next/server";
import { requireRole, type SessionUser } from "@/lib/auth/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  let user: SessionUser;
  try {
    user = await requireRole(["student", "employer", "admin"]);
  } catch {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get("ownerId") ?? "";
    const documentId = url.searchParams.get("documentId") ?? "";
    const applicationId = url.searchParams.get("applicationId") ?? "";
    if (!validId(ownerId) || !validId(documentId) || (applicationId && !validId(applicationId, 257))) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    await enforceRateLimit("document-download", user.uid, 30);
    let allowed = user.role === "admin" || (user.role === "student" && user.uid === ownerId);
    if (user.role === "employer" && applicationId) {
      const application = await getAdminDb().collection("applications").doc(applicationId).get();
      allowed = application.exists
        && application.data()?.employerId === user.uid
        && application.data()?.studentId === ownerId
        && application.data()?.documentId === documentId;
    }
    if (!allowed) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const metadataSnapshot = await getAdminDb().collection("users").doc(ownerId).collection("documents").doc(documentId).get();
    if (!metadataSnapshot.exists) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const metadata = metadataSnapshot.data()!;
    if (metadata.pendingDeletion || metadata.ownerId !== ownerId || !String(metadata.storagePath ?? "").startsWith(`application-documents/${ownerId}/`)) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    const [bytes] = await getAdminStorage().bucket().file(metadata.storagePath).download();
    await getAdminDb().collection("auditLogs").add({
      actorId: user.uid, action: "document.downloaded", entityType: "document", entityId: documentId,
      metadata: { requestId: crypto.randomUUID(), result: "allowed" }, createdAt: FieldValue.serverTimestamp(),
    });
    const originalName = String(metadata.originalName ?? "document").replace(/[\r\n]/g, "_");
    const fallbackName = originalName.replace(/[^\x20-\x7e]/g, "_").replaceAll('"', "_");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": metadata.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json({ error: "The document could not be downloaded." }, { status: 500 });
  }
}
