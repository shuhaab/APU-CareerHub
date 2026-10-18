import { DashboardHeading } from "@/components/app-shell";
import { JobsExplorer } from "@/components/jobs-explorer";
import { getPublishedJobs } from "@/lib/data/firestore";

export default async function StudentJobsPage() {
  const jobs = await getPublishedJobs();
  return <div className="space-y-7"><DashboardHeading title="Find campus jobs" description="Search approved opportunities and find work that fits your study schedule." /><JobsExplorer jobs={jobs} /></div>;
}
