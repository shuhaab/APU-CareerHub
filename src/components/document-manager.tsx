"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FilePenLine, FileText, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoredDocument } from "@/types";

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentManager({ documents, ownerId }: { documents: StoredDocument[]; ownerId: string }) {
  const router = useRouter();
  const [renameTarget, setRenameTarget] = useState<StoredDocument | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<{ id: string; action: "rename" | "delete" } | null>(null);

  function openRename(document: StoredDocument) {
    setRenameTarget(document);
    setName(document.originalName);
  }

  function closeRename() {
    if (busy?.action === "rename") return;
    setRenameTarget(null);
    setName("");
  }

  async function renameDocument() {
    if (!renameTarget) return;
    setBusy({ id: renameTarget.id, action: "rename" });
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(renameTarget.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Rename failed.");
      toast.success("Document renamed.");
      setRenameTarget(null);
      setName("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be renamed.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteDocument(document: StoredDocument) {
    if (!window.confirm(`Delete “${document.originalName}”? This cannot be undone.`)) return;
    setBusy({ id: document.id, action: "delete" });
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(document.id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Delete failed.");
      toast.success("Document deleted securely.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be deleted.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mt-4 grid gap-3">
        {documents.map((document) => {
          const deleting = busy?.id === document.id && busy.action === "delete";
          return (
            <div key={document.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-[#d91b62]"><FileText className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="break-all text-sm font-semibold text-[#18233f]">{document.originalName}</p><Badge variant="secondary">{document.applicationId === "profile" ? "Profile document" : "Application document"}</Badge></div>
                <p className="mt-1 text-xs text-slate-400">{fileSize(document.size)} · Uploaded {document.createdAt}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <Button variant="ghost" size="icon" aria-label={`Download ${document.originalName}`} title="Download document" asChild>
                  <a href={`/api/documents/download?ownerId=${encodeURIComponent(ownerId)}&documentId=${encodeURIComponent(document.id)}`}><Download className="size-4" /></a>
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Rename ${document.originalName}`} title="Rename document" onClick={() => openRename(document)} disabled={busy !== null}>
                  <FilePenLine className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${document.originalName}`} title="Delete document" onClick={() => deleteDocument(document)} disabled={busy !== null} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            </div>
          );
        })}
        {documents.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No documents have been uploaded yet.</p>}
      </div>

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && closeRename()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>Change the displayed file name. The original file type and protected storage location will not change.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="document-name">Document name</Label>
            <Input id="document-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={180} autoFocus onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void renameDocument(); } }} />
            <p className="text-xs text-slate-400">Keep the existing PDF, DOC, or DOCX extension.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRename} disabled={busy?.action === "rename"}>Cancel</Button>
            <Button type="button" onClick={renameDocument} disabled={busy?.action === "rename" || !name.trim()} className="bg-[#24345c] text-white hover:bg-[#18233f]">
              {busy?.action === "rename" ? <LoaderCircle className="size-4 animate-spin" /> : <FilePenLine className="size-4" />}
              {busy?.action === "rename" ? "Renaming…" : "Save name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
