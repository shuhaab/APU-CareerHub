"use server";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/auth/server";
import type { ActionResult } from "@/app/actions/applications";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function vacancyFields(formData: FormData) {
  const deadlineValue = text(formData, "deadline");
  const parsedDeadline = deadlineValue ? new Date(`${deadlineValue}T23:59:59+08:00`) : null;
  const deadline = parsedDeadline && !Number.isNaN(parsedDeadline.getTime()) ? parsedDeadline : null;
  const openingsValue = Number(text(formData, "openings") || "1");
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    category: text(formData, "category"),
    location: text(formData, "location"),
    employmentType: text(formData, "employmentType"),
    workMode: text(formData, "workMode"),
    compensation: text(formData, "compensation"),
    hoursPerWeek: text(formData, "hoursPerWeek"),
    applicationDeadline: deadline ? Timestamp.fromDate(deadline) : null,
    openings: Number.isInteger(openingsValue) ? openingsValue : 0,
    responsibilities: text(formData, "responsibilities").split("\n").map((item) => item.trim()).filter(Boolean),
    requirements: text(formData, "requirements").split("\n").map((item) => item.trim()).filter(Boolean),
    skills: text(formData, "skills").split(",").map((item) => item.trim()).filter(Boolean),
  };
}

function vacancyValidationError(fields: ReturnType<typeof vacancyFields>): string | null {
  if (fields.title.length < 5) return "Enter a job title containing at least 5 characters.";
  if (!fields.category) return "Select a vacancy category.";
  if (!fields.employmentType) return "Select an employment type.";
  if (!fields.location) return "Enter the work location.";
  if (!fields.workMode) return "Select a work arrangement.";
  if (!fields.compensation) return "Enter the vacancy compensation.";
  if (!fields.hoursPerWeek) return "Enter the expected weekly hours.";
  if (!fields.applicationDeadline) return "Select a valid application deadline.";
  if (fields.applicationDeadline.toMillis() <= Date.now()) return "Choose an application deadline in the future.";
  if (fields.openings < 1 || fields.openings > 100) return "Enter between 1 and 100 openings.";
  if (fields.description.length < 80) return `Add ${80 - fields.description.length} more characters to the opportunity description.`;
  if (!fields.responsibilities.length) return "Enter at least one responsibility.";
  if (!fields.requirements.length) return "Enter at least one requirement.";
  return null;
}

function storedVacancyFields(data: DocumentData): ReturnType<typeof vacancyFields> {
  return {
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    category: String(data.category ?? "").trim(),
    location: String(data.location ?? "").trim(),
    employmentType: String(data.employmentType ?? "").trim(),
    workMode: String(data.workMode ?? "").trim(),
    compensation: String(data.compensation ?? "").trim(),
    hoursPerWeek: String(data.hoursPerWeek ?? "").trim(),
    applicationDeadline: data.applicationDeadline instanceof Timestamp ? data.applicationDeadline : null,
    openings: Number.isInteger(Number(data.openings ?? 1)) ? Number(data.openings ?? 1) : 0,
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.map(String).map((item: string) => item.trim()).filter(Boolean) : [],
    requirements: Array.isArray(data.requirements) ? data.requirements.map(String).map((item: string) => item.trim()).filter(Boolean) : [],
    skills: Array.isArray(data.skills) ? data.skills.map(String).map((item: string) => item.trim()).filter(Boolean) : [],
  };
}

function revalidateVacancies() {
  revalidatePath("/", "layout");
  revalidatePath("/employer", "layout");
  revalidatePath("/student", "layout");
  revalidatePath("/admin", "layout");
}

export async function createVacancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["employer"]);
    const fields = vacancyFields(formData);
    const intent = formData.get("intent") === "submit" ? "submit" : "draft";
    if (intent === "draft" && fields.title.length < 3) return { ok: false, error: "Enter a title of at least 3 characters before saving the draft." };
    const validationError = intent === "submit" ? vacancyValidationError(fields) : null;
    if (validationError) return { ok: false, error: validationError };
    const db = getAdminDb();
    const profile = (await db.collection("users").doc(user.uid).get()).data();
    if (!profile?.approved) return { ok: false, error: "Employer access has not been approved." };
    const ref = db.collection("jobs").doc();
    await ref.create({
      ...fields,
      department: profile.department ?? "APU Department",
      employerId: user.uid,
      employerName: profile.fullName ?? user.email,
      status: intent === "submit" ? "pending_approval" : "draft",
      applicants: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidateVacancies();
    return { ok: true, id: ref.id };
  } catch {
    return { ok: false, error: "The vacancy could not be created." };
  }
}

export async function updateVacancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["employer"]);
    const jobId = text(formData, "jobId");
    const fields = vacancyFields(formData);
    const intent = formData.get("intent") === "submit" ? "submit" : "draft";
    if (!jobId) return { ok: false, error: "Vacancy not found." };
    if (intent === "draft" && fields.title.length < 3) return { ok: false, error: "Enter a title of at least 3 characters before saving the draft." };
    const validationError = intent === "submit" ? vacancyValidationError(fields) : null;
    if (validationError) return { ok: false, error: validationError };
    const db = getAdminDb();
    const jobRef = db.collection("jobs").doc(jobId);
    const snapshot = await jobRef.get();
    if (!snapshot.exists || snapshot.data()?.employerId !== user.uid) return { ok: false, error: "Vacancy not found." };
    if (!["draft", "rejected"].includes(snapshot.data()?.status)) return { ok: false, error: "Only draft or rejected vacancies can be edited." };
    const nextStatus = intent === "submit" ? "pending_approval" : "draft";
    const batch = db.batch();
    batch.update(jobRef, { ...fields, status: nextStatus, updatedAt: FieldValue.serverTimestamp() });
    batch.create(db.collection("auditLogs").doc(), {
      actorId: user.uid,
      action: nextStatus === "pending_approval" ? "vacancy.submitted" : "vacancy.updated",
      entityType: "job",
      entityId: jobId,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    revalidateVacancies();
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be updated." };
  }
}

export async function createVacancyFormAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = await createVacancyAction(formData);
  if (result.ok) redirect("/employer/vacancies");
  return result;
}

export async function updateVacancyFormAction(_previousState: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = await updateVacancyAction(formData);
  if (result.ok) redirect(`/employer/vacancies/${result.id}`);
  return result;
}

export async function submitVacancyForApprovalAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["employer"]);
    const jobId = text(formData, "jobId");
    if (!jobId) return { ok: false, error: "Vacancy not found." };
    const db = getAdminDb();
    const jobRef = db.collection("jobs").doc(jobId);
    const snapshot = await jobRef.get();
    const job = snapshot.data();
    if (!snapshot.exists || job?.employerId !== user.uid) return { ok: false, error: "Vacancy not found." };
    if (!["draft", "rejected"].includes(job?.status)) return { ok: false, error: "Only draft or rejected vacancies can be submitted." };
    const validationError = vacancyValidationError(storedVacancyFields(job));
    if (validationError) return { ok: false, error: validationError };
    const batch = db.batch();
    batch.update(jobRef, { status: "pending_approval", updatedAt: FieldValue.serverTimestamp() });
    batch.create(db.collection("auditLogs").doc(), { actorId: user.uid, action: "vacancy.submitted", entityType: "job", entityId: jobId, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    revalidateVacancies();
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be submitted for approval." };
  }
}

export async function closeVacancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["employer"]);
    const jobId = text(formData, "jobId");
    if (!jobId) return { ok: false, error: "Vacancy not found." };
    const db = getAdminDb();
    const jobRef = db.collection("jobs").doc(jobId);
    const snapshot = await jobRef.get();
    const job = snapshot.data();
    if (!snapshot.exists || job?.employerId !== user.uid) return { ok: false, error: "Vacancy not found." };
    if (job?.status !== "published") return { ok: false, error: "Only a published vacancy can be closed." };
    const batch = db.batch();
    batch.update(jobRef, { status: "closed", closedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    batch.create(db.collection("auditLogs").doc(), { actorId: user.uid, action: "vacancy.closed", entityType: "job", entityId: jobId, createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    revalidateVacancies();
    return { ok: true, id: jobId };
  } catch {
    return { ok: false, error: "The vacancy could not be closed." };
  }
}
