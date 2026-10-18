import type { ApplicationStatus } from "@/types";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const reviewerApplicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: [],
  rejected: [],
  withdrawn: [],
};
