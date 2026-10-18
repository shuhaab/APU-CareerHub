import { ShieldCheck } from "lucide-react";
import { DashboardHeading } from "@/components/app-shell";
import { DocumentManager } from "@/components/document-manager";
import { DocumentUploader } from "@/components/document-uploader";
import { enforcePageRole } from "@/lib/auth/server";
import { getStudentDocuments } from "@/lib/data/firestore";

export default async function DocumentsPage() {
  const user = await enforcePageRole("student");
  const documents = await getStudentDocuments(user.uid);
  return (
    <div className="space-y-7">
      <DashboardHeading title="My documents" description="Manage the CV and supporting documents used in your applications." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
          <div><h2 className="font-bold text-[#18233f]">Upload a new document</h2><p className="mt-1 text-sm text-slate-500">Files are stored privately and shared only with authorized reviewers.</p></div>
          <div className="mt-6"><DocumentUploader /></div>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-[#18233f]">Saved documents</h2>
            <DocumentManager documents={documents} ownerId={user.uid} />
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-white text-emerald-600"><ShieldCheck className="size-5" /></span>
          <h2 className="mt-5 font-bold text-emerald-950">Private by default</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900/65">Direct Cloud Storage access is fully closed. The portal server checks ownership and application relationships before handling every upload or download.</p>
          <ul className="mt-5 grid gap-3 text-sm text-emerald-900/75"><li>• Maximum file size: 5 MB</li><li>• Supported: PDF, DOC, DOCX</li><li>• Rename or delete unused documents</li><li>• Submitted documents are retained with their applications</li></ul>
        </aside>
      </div>
    </div>
  );
}
