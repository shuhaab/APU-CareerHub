export type UserRole = "student" | "employer" | "admin";

export type JobStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "rejected"
  | "closed"
  | "archived";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  requestedRole?: "student" | "employer";
  studentId?: string;
  programme?: string;
  department?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  availability?: string;
  availableFrom?: string;
  avatarUrl?: string;
  approved?: boolean;
  canManageAdmins?: boolean;
  mustChangePassword?: boolean;
  accountActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  employerId: string;
  employerName: string;
  category: string;
  location: string;
  employmentType: "Part-time" | "Temporary" | "Project-based";
  workMode: "On campus" | "Hybrid";
  compensation: string;
  hoursPerWeek: string;
  openings: number;
  deadline: string;
  postedAt: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  status: JobStatus;
  applicants: number;
  featured?: boolean;
}

export interface VacancyEditorData {
  id: string;
  title: string;
  employerId: string;
  category: string;
  location: string;
  employmentType: Job["employmentType"];
  workMode: Job["workMode"];
  compensation: string;
  hoursPerWeek: string;
  openings: number;
  deadline: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string;
  status: JobStatus;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  department: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  programme: string;
  employerId?: string;
  studentEmail?: string;
  studentPhone?: string;
  coverLetter?: string;
  documentId?: string;
  submittedAt: string;
  currentStatus: ApplicationStatus;
  matchScore?: number;
}

export interface StoredDocument {
  id: string;
  ownerId: string;
  applicationId: string;
  originalName: string;
  contentType: string;
  size: number;
  storagePath: string;
  createdAt: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  kind: "application" | "vacancy" | "employer";
  attention: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  status: ApplicationStatus;
  label: string;
  message: string;
  changedAt: string;
  completed: boolean;
}
