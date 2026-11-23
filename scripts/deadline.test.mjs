import assert from "node:assert/strict";
import { test } from "node:test";
import { vacancyDeadline, isVacancyOpen } from "../src/lib/vacancies/deadline.ts";

test("vacancies close at the end of their Kuala Lumpur deadline and fail closed on invalid dates", () => {
  const deadline = vacancyDeadline("2026-11-09");
  assert.equal(deadline.toISOString(), "2026-11-09T15:59:59.999Z");
  assert.equal(vacancyDeadline("2026-02-31"), null);
  assert.equal(isVacancyOpen("published", deadline, deadline.getTime() - 1), true);
  assert.equal(isVacancyOpen("published", deadline, deadline.getTime()), false);
  assert.equal(isVacancyOpen("closed", deadline, deadline.getTime() - 1), false);
  assert.equal(isVacancyOpen("published", null), false);
});
