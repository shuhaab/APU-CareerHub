import assert from "node:assert/strict";
import test from "node:test";
import { canAdminArchiveVacancy, canAdminCloseVacancy } from "../src/lib/vacancies/admin-status.ts";

test("administrators can close only published vacancies", () => {
  for (const status of ["draft", "pending_approval", "rejected", "closed", "archived"]) {
    assert.equal(canAdminCloseVacancy(status), false, `${status} should not be closable`);
  }
  assert.equal(canAdminCloseVacancy("published"), true);
});

test("administrators cannot archive pending or already archived vacancies", () => {
  for (const status of ["draft", "published", "rejected", "closed"]) {
    assert.equal(canAdminArchiveVacancy(status), true, `${status} should be archivable`);
  }
  assert.equal(canAdminArchiveVacancy("pending_approval"), false);
  assert.equal(canAdminArchiveVacancy("archived"), false);
});
