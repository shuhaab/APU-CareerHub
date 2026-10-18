"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { applicationStatusLabels } from "@/lib/application-status";
import type { Application, ApplicationStatus } from "@/types";

const statusOrder: ApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
  "withdrawn",
];

export function AdminApplicationsExplorer({ applications }: { applications: Application[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(
    () => [...new Set(applications.map((application) => application.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [applications],
  );
  const statuses = useMemo(
    () => statusOrder.filter((applicationStatus) => applications.some((application) => application.currentStatus === applicationStatus)),
    [applications],
  );
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesQuery = !normalizedQuery || [
        application.studentName,
        application.studentNumber,
        application.jobTitle,
        application.department,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesDepartment = department === "all" || application.department === department;
      const matchesStatus = status === "all" || application.currentStatus === status;
      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }, [applications, department, query, status]);

  return (
    <>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search applications"
            className="pl-9"
            placeholder="Search student, vacancy, or department"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={department} onValueChange={(value) => setDepartment(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter applications by department"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="w-full" aria-label="Filter applications by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((item) => <SelectItem key={item} value={item}>{applicationStatusLabels[item]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Vacancy</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredApplications.map((item) => (
              <TableRow key={item.id}>
                <TableCell><div className="flex items-center gap-3"><Avatar className="size-8"><AvatarFallback className="bg-[#eef1f7] text-[10px] font-bold text-[#24345c]">{item.studentName.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar><div><p className="text-sm font-semibold text-[#18233f]">{item.studentName}</p><p className="text-xs text-slate-400">{item.studentNumber}</p></div></div></TableCell>
                <TableCell className="max-w-56 truncate font-medium">{item.jobTitle}</TableCell>
                <TableCell className="text-slate-500">{item.department}</TableCell>
                <TableCell><StatusBadge status={item.currentStatus} /></TableCell>
                <TableCell className="text-slate-500">{item.submittedAt}</TableCell>
              </TableRow>
            ))}
            {filteredApplications.length === 0 && (
              <TableRow><TableCell colSpan={5} className="h-28 text-center text-slate-500">No applications match the selected filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
