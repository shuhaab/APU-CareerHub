export function deadlineMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && value && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis();
  if (typeof value !== "string") return NaN;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? vacancyDeadline(value)?.getTime() ?? NaN : Date.parse(value);
}

export function vacancyDeadline(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T23:59:59.999+08:00`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(date) ? parsed : null;
}

export function isVacancyOpen(status: unknown, deadline: unknown, now = Date.now()): boolean {
  return status === "published" && deadlineMillis(deadline) > now;
}
