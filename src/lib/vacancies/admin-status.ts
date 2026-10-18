export function canAdminCloseVacancy(status: string | undefined) {
  return status === "published";
}

export function canAdminArchiveVacancy(status: string | undefined) {
  return status !== "pending_approval" && status !== "archived";
}
