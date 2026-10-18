import "server-only";

import { cache } from "react";
import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Application, AuditLog, Job, PortalNotification, StatusHistoryItem, StoredDocument, UserProfile, UserRole, VacancyEditorData } from "@/types";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: unknown, includeTime = false): string {
  const date = toDate(value);
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
}

function timestampMs(value: unknown): number {
  return toDate(value)?.getTime() ?? 0;
}

function profileFromData(id: string, data: DocumentData): UserProfile {
  return {
    id,
    email: String(data.email ?? ""),
    fullName: String(data.fullName ?? "Portal user"),
    role: data.role,
    requestedRole: data.requestedRole,
    studentId: data.studentId || undefined,
    programme: data.programme || undefined,
    department: data.department || undefined,
    phone: data.phone || undefined,
    bio: data.bio || undefined,
    skills: Array.isArray(data.skills) ? data.skills.map(String) : [],
    availability: data.availability || undefined,
    availableFrom: data.availableFrom || undefined,
    avatarUrl: data.avatarUrl || undefined,
    approved: Boolean(data.approved),
    canManageAdmins: data.canManageAdmins === true,
    mustChangePassword: data.mustChangePassword === true,
    accountActive: data.accountActive !== false,
    createdAt: formatDate(data.createdAt),
    updatedAt: formatDate(data.updatedAt),
  };
}

type SnapshotLike = { id: string; data(): DocumentData | undefined };

const getUserSnapshot = cache((uid: string) => getAdminDb().collection("users").doc(uid).get());
const getAllUsersSnapshot = cache(() => getAdminDb().collection("users").orderBy("createdAt", "desc").get());
const getPublishedJobsSnapshot = cache(() => getAdminDb().collection("jobs").where("status", "==", "published").get());
const getJobSnapshot = cache((id: string) => getAdminDb().collection("jobs").doc(id).get());
const getEmployerJobsSnapshot = cache((employerId: string) => getAdminDb().collection("jobs").where("employerId", "==", employerId).get());
const getAllJobsSnapshot = cache(() => getAdminDb().collection("jobs").orderBy("createdAt", "desc").get());
const getStudentApplicationsSnapshot = cache((studentId: string) => getAdminDb().collection("applications").where("studentId", "==", studentId).get());
const getEmployerApplicationsSnapshot = cache((employerId: string) => getAdminDb().collection("applications").where("employerId", "==", employerId).get());
const getAllApplicationsSnapshot = cache(() => getAdminDb().collection("applications").orderBy("submittedAt", "desc").get());
const getApplicationSnapshot = cache((id: string) => getAdminDb().collection("applications").doc(id).get());

function jobFromSnapshot(snapshot: SnapshotLike): Job {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    title: String(data.title ?? "Untitled vacancy"),
    department: String(data.department ?? "APU Department"),
    employerId: String(data.employerId ?? ""),
    employerName: String(data.employerName ?? "APU Employer"),
    category: String(data.category ?? "Other"),
    location: String(data.location ?? "APU Campus"),
    employmentType: data.employmentType ?? "Part-time",
    workMode: data.workMode ?? "On campus",
    compensation: String(data.compensation ?? ""),
    hoursPerWeek: String(data.hoursPerWeek ?? ""),
    openings: Math.max(1, Number(data.openings ?? 1)),
    deadline: formatDate(data.applicationDeadline),
    postedAt: formatDate(data.publishedAt ?? data.createdAt),
    description: String(data.description ?? ""),
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.map(String) : [],
    requirements: Array.isArray(data.requirements) ? data.requirements.map(String) : [],
    skills: Array.isArray(data.skills) ? data.skills.map(String) : [],
    status: data.status ?? "draft",
    applicants: Number(data.applicants ?? 0),
    featured: Boolean(data.featured),
  };
}

function applicationFromSnapshot(snapshot: SnapshotLike): Application {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    jobId: String(data.jobId ?? ""),
    jobTitle: String(data.jobTitle ?? "Vacancy"),
    department: String(data.department ?? "APU Department"),
    employerId: data.employerId || undefined,
    studentId: String(data.studentId ?? ""),
    studentName: String(data.studentName ?? "Student"),
    studentNumber: String(data.studentNumber ?? ""),
    programme: String(data.programme ?? ""),
    studentEmail: data.studentEmail || undefined,
    studentPhone: data.studentPhone || undefined,
    coverLetter: data.coverLetter || undefined,
    documentId: data.documentId || undefined,
    submittedAt: formatDate(data.submittedAt),
    currentStatus: data.currentStatus ?? "submitted",
    matchScore: typeof data.matchScore === "number" ? data.matchScore : undefined,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getUserSnapshot(uid);
  return snapshot.exists ? profileFromData(snapshot.id, snapshot.data()!) : null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getAllUsersSnapshot();
  return snapshot.docs.map((doc) => profileFromData(doc.id, doc.data()));
}

export async function getPublishedJobs(limit = 50): Promise<Job[]> {
  const snapshot = await getPublishedJobsSnapshot();
  return snapshot.docs
    .sort((a, b) => timestampMs(a.data().applicationDeadline) - timestampMs(b.data().applicationDeadline))
    .slice(0, limit)
    .map(jobFromSnapshot);
}

export async function getJobById(id: string): Promise<Job | null> {
  const snapshot = await getJobSnapshot(id);
  return snapshot.exists ? jobFromSnapshot(snapshot) : null;
}

export async function getVacancyEditorData(id: string): Promise<VacancyEditorData | null> {
  const snapshot = await getJobSnapshot(id);
  if (!snapshot.exists) return null;
  const data = snapshot.data() ?? {};
  const deadline = toDate(data.applicationDeadline);
  return {
    id: snapshot.id,
    title: String(data.title ?? ""),
    employerId: String(data.employerId ?? ""),
    category: String(data.category ?? "Other"),
    location: String(data.location ?? ""),
    employmentType: data.employmentType ?? "Part-time",
    workMode: data.workMode ?? "On campus",
    compensation: String(data.compensation ?? ""),
    hoursPerWeek: String(data.hoursPerWeek ?? ""),
    openings: Math.max(1, Number(data.openings ?? 1)),
    deadline: deadline ? deadline.toISOString().slice(0, 10) : "",
    description: String(data.description ?? ""),
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.map(String).join("\n") : "",
    requirements: Array.isArray(data.requirements) ? data.requirements.map(String).join("\n") : "",
    skills: Array.isArray(data.skills) ? data.skills.map(String).join(", ") : "",
    status: data.status ?? "draft",
  };
}

export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  const snapshot = await getEmployerJobsSnapshot(employerId);
  return snapshot.docs
    .sort((a, b) => timestampMs(b.data().createdAt) - timestampMs(a.data().createdAt))
    .map(jobFromSnapshot);
}

export async function getAllJobs(): Promise<Job[]> {
  const snapshot = await getAllJobsSnapshot();
  return snapshot.docs.map(jobFromSnapshot);
}

export async function getStudentApplications(studentId: string): Promise<Application[]> {
  const snapshot = await getStudentApplicationsSnapshot(studentId);
  return snapshot.docs
    .sort((a, b) => timestampMs(b.data().submittedAt) - timestampMs(a.data().submittedAt))
    .map(applicationFromSnapshot);
}

export async function getEmployerApplications(employerId: string): Promise<Application[]> {
  const snapshot = await getEmployerApplicationsSnapshot(employerId);
  return snapshot.docs
    .sort((a, b) => timestampMs(b.data().submittedAt) - timestampMs(a.data().submittedAt))
    .map(applicationFromSnapshot);
}

export async function getAllApplications(): Promise<Application[]> {
  const snapshot = await getAllApplicationsSnapshot();
  return snapshot.docs.map(applicationFromSnapshot);
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const snapshot = await getApplicationSnapshot(id);
  return snapshot.exists ? applicationFromSnapshot(snapshot) : null;
}

export async function getApplicationHistory(applicationId: string): Promise<StatusHistoryItem[]> {
  const snapshot = await getAdminDb().collection("applications").doc(applicationId)
    .collection("statusHistory").orderBy("changedAt", "asc").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const status = data.newStatus ?? "submitted";
    const labels: Record<string, string> = {
      submitted: "Application submitted",
      under_review: "Under review",
      shortlisted: "Shortlisted",
      interview: "Interview",
      offered: "Offer received",
      rejected: "Application closed",
      withdrawn: "Application withdrawn",
    };
    return {
      id: doc.id,
      status,
      label: labels[status] ?? status,
      message: String(data.studentMessage ?? "Application status updated."),
      changedAt: formatDate(data.changedAt, true),
      completed: true,
    };
  });
}

export async function getStudentDocuments(studentId: string): Promise<StoredDocument[]> {
  const snapshot = await getAdminDb().collection("users").doc(studentId)
    .collection("documents").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ownerId: String(data.ownerId ?? studentId),
      applicationId: String(data.applicationId ?? "profile"),
      originalName: String(data.originalName ?? "Document"),
      contentType: String(data.contentType ?? data.mimeType ?? "application/octet-stream"),
      size: Number(data.size ?? data.fileSize ?? 0),
      storagePath: String(data.storagePath ?? ""),
      createdAt: formatDate(data.createdAt ?? data.uploadedAt),
    };
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const snapshot = await getAdminDb().collection("auditLogs").orderBy("createdAt", "desc").limit(100).get();
  const actorIds = [...new Set(snapshot.docs.map((doc) => String(doc.data().actorId ?? "")).filter(Boolean))];
  const actorProfiles = await Promise.all(actorIds.map(getUserProfile));
  const actorNames = new Map(actorProfiles.filter(Boolean).map((profile) => [profile!.id, profile!.fullName]));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      actorId: String(data.actorId ?? "system"),
      actorName: actorNames.get(String(data.actorId ?? "")) ?? "System",
      action: String(data.action ?? "system.activity"),
      entityType: String(data.entityType ?? "system"),
      entityId: String(data.entityId ?? ""),
      metadata: data.metadata,
      createdAt: formatDate(data.createdAt, true),
    };
  });
}

type NotificationDraft = PortalNotification & { sortAt: number };

export async function getPortalNotifications(userId: string, role: UserRole): Promise<PortalNotification[]> {
  const notifications: NotificationDraft[] = [];

  if (role === "student") {
    const applications = await getStudentApplicationsSnapshot(userId);
    const statusTitles: Record<string, string> = {
      submitted: "Application submitted",
      under_review: "Application under review",
      shortlisted: "You were shortlisted",
      interview: "Interview stage reached",
      offered: "Offer received",
      rejected: "Application was not selected",
      withdrawn: "Application withdrawn",
    };
    for (const document of applications.docs) {
      const data = document.data();
      const status = String(data.currentStatus ?? "submitted");
      const changedAt = data.updatedAt ?? data.submittedAt;
      notifications.push({
        id: `application-${document.id}`,
        title: statusTitles[status] ?? "Application updated",
        message: String(data.jobTitle ?? "Campus vacancy"),
        href: `/student/applications/${document.id}`,
        createdAt: formatDate(changedAt, true),
        kind: "application",
        attention: ["shortlisted", "interview", "offered", "rejected"].includes(status),
        sortAt: timestampMs(changedAt),
      });
    }
  }

  if (role === "employer") {
    const [applications, jobs] = await Promise.all([
      getEmployerApplicationsSnapshot(userId),
      getEmployerJobsSnapshot(userId),
    ]);
    for (const document of applications.docs) {
      const data = document.data();
      notifications.push({
        id: `application-${document.id}`,
        title: data.currentStatus === "submitted" ? "New application received" : "Applicant status updated",
        message: `${String(data.studentName ?? "Student")} · ${String(data.jobTitle ?? "Vacancy")}`,
        href: `/employer/applications/${document.id}`,
        createdAt: formatDate(data.updatedAt ?? data.submittedAt, true),
        kind: "application",
        attention: data.currentStatus === "submitted",
        sortAt: timestampMs(data.updatedAt ?? data.submittedAt),
      });
    }
    for (const document of jobs.docs) {
      const data = document.data();
      if (!["published", "rejected", "pending_approval"].includes(data.status)) continue;
      const titles: Record<string, string> = {
        published: "Vacancy approved",
        rejected: "Vacancy rejected",
        pending_approval: "Vacancy awaiting approval",
      };
      notifications.push({
        id: `vacancy-${document.id}`,
        title: titles[data.status] ?? "Vacancy updated",
        message: String(data.title ?? "Vacancy"),
        href: `/employer/vacancies/${document.id}`,
        createdAt: formatDate(data.updatedAt ?? data.createdAt, true),
        kind: "vacancy",
        attention: data.status === "rejected",
        sortAt: timestampMs(data.updatedAt ?? data.createdAt),
      });
    }
  }

  if (role === "admin") {
    const [jobs, users] = await Promise.all([
      getAllJobsSnapshot(),
      getAllUsersSnapshot(),
    ]);
    for (const document of jobs.docs) {
      const data = document.data();
      if (data.status !== "pending_approval") continue;
      notifications.push({ id: `vacancy-${document.id}`, title: "Vacancy approval required", message: `${String(data.title ?? "Vacancy")} · ${String(data.department ?? "APU Department")}`, href: "/admin/vacancies", createdAt: formatDate(data.updatedAt ?? data.createdAt, true), kind: "vacancy", attention: true, sortAt: timestampMs(data.updatedAt ?? data.createdAt) });
    }
    for (const document of users.docs) {
      const data = document.data();
      if (data.requestedRole !== "employer" || data.approved === true) continue;
      notifications.push({ id: `employer-${document.id}`, title: "Employer approval required", message: `${String(data.fullName ?? "Employer")} · ${String(data.department ?? "APU Department")}`, href: "/admin/users", createdAt: formatDate(data.updatedAt ?? data.createdAt, true), kind: "employer", attention: true, sortAt: timestampMs(data.updatedAt ?? data.createdAt) });
    }
  }

  return notifications
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 8)
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      href: notification.href,
      createdAt: notification.createdAt,
      kind: notification.kind,
      attention: notification.attention,
    }));
}
