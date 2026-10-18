import { AdminApplicationsExplorer } from "@/components/admin-applications-explorer";
import { DashboardHeading } from "@/components/app-shell";
import { getAllApplications } from "@/lib/data/firestore";

export default async function AdminApplicationsPage() {
  const applications = await getAllApplications();
  return (
    <div className="space-y-7">
      <DashboardHeading title="Application oversight" description="Monitor applications across the portal and intervene only when administrative correction is required." />
      <AdminApplicationsExplorer applications={applications} />
    </div>
  );
}
