"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DocumentUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function selectFile(file?: File) {
    if (!file) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) return toast.error("Upload a PDF, DOC, or DOCX file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("The file must be smaller than 5 MB.");
    setSelected(file);
  }

  async function uploadFile() {
    if (!selected) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", selected);
      form.set("applicationId", "profile");
      const response = await fetch("/api/documents/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      toast.success("Document uploaded securely.");
      setSelected(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={(event) => selectFile(event.target.files?.[0])} />
      {!selected ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center transition hover:border-[#d91b62] hover:bg-rose-50/40"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#d91b62] shadow-sm"><UploadCloud className="size-6" /></span>
          <span className="mt-4 font-semibold text-[#18233f]">Drop a document here, or browse</span>
          <span className="mt-2 text-xs text-slate-400">PDF, DOC, or DOCX · Maximum 5 MB</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-white text-emerald-600"><FileText className="size-5" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-emerald-950">{selected.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" /> Ready to upload · {(selected.size / 1024 / 1024).toFixed(2)} MB</p></div>
          <Button type="button" size="icon" variant="ghost" onClick={() => setSelected(null)} aria-label="Remove selected document"><Trash2 className="size-4" /></Button>
        </div>
      )}
      {selected && <Button type="button" disabled={uploading} className="mt-4 bg-[#24345c] text-white" onClick={uploadFile}><UploadCloud className="size-4" /> {uploading ? "Uploading…" : "Upload securely"}</Button>}
    </div>
  );
}
