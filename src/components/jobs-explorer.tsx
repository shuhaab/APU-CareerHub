"use client";

import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import type { Job } from "@/types";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function JobsExplorer({ jobs, initialQuery = "" }: { jobs: Job[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !normalized || [job.title, job.department, job.category, job.skills.join(" ")]
        .some((value) => value.toLowerCase().includes(normalized));
      const matchesCategory = category === "all" || job.category === category;
      const matchesType = type === "all" || job.employmentType === type;
      return matchesQuery && matchesCategory && matchesType;
    });
  }, [jobs, query, category, type]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setType("all");
  };

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(35,52,92,0.06)] sm:p-5">
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, department, or skill" className="h-11 pl-10" aria-label="Search jobs" />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
            <SelectTrigger className="h-11 w-full"><Filter className="size-4 text-slate-400" /><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...new Set(jobs.map((job) => job.category))].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(value) => setType(value ?? "all")}>
            <SelectTrigger className="h-11 w-full"><SlidersHorizontal className="size-4 text-slate-400" /><SelectValue placeholder="Employment type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All work types</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Temporary">Temporary</SelectItem>
              <SelectItem value="Project-based">Project-based</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11" onClick={clearFilters}><X className="size-4" /> Clear</Button>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-slate-500"><strong className="font-semibold text-[#18233f]">{filteredJobs.length}</strong> opportunities found</p>
        <p className="hidden text-xs text-slate-400 sm:block">Showing published on-campus roles</p>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Search className="size-5" /></span>
          <h2 className="mt-4 font-bold text-[#18233f]">No matching opportunities</h2>
          <p className="mt-2 text-sm text-slate-500">Try a broader search or clear the current filters.</p>
          <Button variant="outline" className="mt-5" onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}
    </div>
  );
}
