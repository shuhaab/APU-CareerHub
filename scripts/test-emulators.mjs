import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { generateKeyPairSync } from "node:crypto";
import { cert, initializeApp as adminApp } from "firebase-admin/app";
import { getAuth as adminAuth } from "firebase-admin/auth";
import { getFirestore as adminDb, Timestamp } from "firebase-admin/firestore";
import { getStorage as adminStorage } from "firebase-admin/storage";
import { initializeApp, deleteApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, doc, getDocFromServer, setDoc, getDocsFromServer, collection, terminate } from "firebase/firestore";
import { connectStorageEmulator, getStorage, getMetadata, listAll, ref, uploadBytes } from "firebase/storage";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { assertEmulatorEnvironment, demoProject } from "../src/lib/firebase/emulator.ts";

const origin = "http://127.0.0.1:3137";
const env = {
  ...process.env,
  APP_ORIGIN: origin,
  FIREBASE_PROJECT_ID: demoProject,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: demoProject,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${demoProject}.appspot.com`,
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:careerhub",
  NEXT_PUBLIC_FIREBASE_EMULATOR: "1",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
};
assertEmulatorEnvironment(env);
assert.equal(process.env.GCLOUD_PROJECT, demoProject);
const app = adminApp({
  projectId: demoProject, storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  credential: cert({
    projectId: demoProject, clientEmail: "emulator@demo-careerhub.iam.gserviceaccount.com",
    privateKey: generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey,
  }),
});
const auth = adminAuth(app);
const db = adminDb(app);
const bucket = adminStorage(app).bucket();
const password = "CareerHub-Test!123";
const client = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: demoProject,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};
const endpoint = (key) => {
  const [host, port] = env[key].split(":");
  return [host, Number(port)];
};
const fixtures = [
  ["student", "student", "student", true, true],
  ["outside", "student", "student", true, true],
  ["employer", "employer", "employer", true, true],
  ["otheremployer", "employer", "employer", true, true],
  ["pending", "employer", "pending_employer", true, false],
  ["admin", "admin", "admin", true, true],
  ["disabled", "student", "student", false, true],
  ["unverified", "student", "student", true, true, false],
];
for (const [uid, role, claim, accountActive, approved, emailVerified = true] of fixtures) {
  const email = `${uid}@example.test`;
  await auth.createUser({ uid, email, password, emailVerified });
  await auth.setCustomUserClaims(uid, { role: claim });
  await db.collection("users").doc(uid).set({ role, accountActive, approved, email, ...(uid === "pending" ? { requestedRole: "employer" } : {}), fullName: `Test ${uid}`, createdAt: Timestamp.now() });
}

const filePath = "application-documents/student/profile/selected.pdf";
const extraPath = "application-documents/student/profile/unused.pdf";
const pdf = await PDFDocument.create();
pdf.addPage();
const bytes = Buffer.from(await pdf.save());
for (const [id, storagePath] of [["selected", filePath], ["unused", extraPath]]) {
  await bucket.file(storagePath).save(bytes, { resumable: false, contentType: "application/pdf" });
  await db.doc(`users/student/documents/${id}`).set({ ownerId: "student", originalName: `${id}.pdf`, storagePath, mimeType: "application/pdf", createdAt: Timestamp.now() });
}
for (const [id, title, offset, status] of [
  ["open", "Emulator Lab Assistant", 86_400_000, "published"],
  ["expired", "Confidential expired vacancy", -60_000, "published"],
  ["closed", "Confidential closed vacancy", 86_400_000, "closed"],
  ["pending", "Emulator Pending Vacancy", 86_400_000, "pending_approval"],
  ["expiredpending", "Emulator Expired Pending Vacancy", -60_000, "pending_approval"],
  ["race", "Emulator File Race Vacancy", 86_400_000, "published"],
]) {
  await db.doc(`jobs/${id}`).set({
    status, title, employerId: "employer", department: "Test Department", applicationDeadline: Timestamp.fromMillis(Date.now() + offset),
    description: "Synthetic vacancy for integration tests.", applicants: 0, createdAt: Timestamp.now(),
  });
}

const session = {};
const tokens = {};
for (const uid of [null, ...fixtures.map(([uid]) => uid)]) {
  const sdk = initializeApp(client, uid ?? "guest");
  const sdkAuth = getAuth(sdk);
  connectAuthEmulator(sdkAuth, `http://${env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  if (uid) tokens[uid] = await (await signInWithEmailAndPassword(sdkAuth, `${uid}@example.test`, password)).user.getIdToken();
  const firestore = getFirestore(sdk);
  connectFirestoreEmulator(firestore, ...endpoint("FIRESTORE_EMULATOR_HOST"));
  const storage = getStorage(sdk);
  connectStorageEmulator(storage, ...endpoint("FIREBASE_STORAGE_EMULATOR_HOST"));
  const denied = (operation, code) => assert.rejects(operation, { code });
  await Promise.all([
    denied(getDocFromServer(doc(firestore, "jobs/open")), "permission-denied"),
    denied(getDocsFromServer(collection(firestore, "applications/open_student/messages")), "permission-denied"),
    denied(setDoc(doc(firestore, "jobs/open"), { applicants: 100 }), "permission-denied"),
    denied(getMetadata(ref(storage, filePath)), "storage/unauthorized"),
    denied(listAll(ref(storage, "application-documents")), "storage/unauthorized"),
    denied(uploadBytes(ref(storage, "unauthorized.txt"), new Uint8Array([1])), "storage/unauthorized"),
  ]);
  const response = await fetch(`http://${env.FIRESTORE_EMULATOR_HOST}/v1/projects/${demoProject}/databases/(default)/documents/jobs/open`, {
    headers: uid ? { Authorization: `Bearer ${tokens[uid]}` } : {},
  });
  assert.equal(response.status, 403);
  await terminate(firestore);
  await deleteApp(sdk);
}
console.log("Direct Firestore SDK/REST and Storage access denied for guests and all synthetic roles.");

const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3137"], {
  env: { ...env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "inherit", "inherit"],
});
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { await fetch(`${origin}/login`, { signal: AbortSignal.timeout(60_000) }); break; }
    catch (error) { if (attempt >= 40 || next.exitCode !== null) throw error; await delay(500); }
  }
  const redirectedTo = async (response, target) => {
    if (response.status === 307) assert.equal(response.headers.get("location"), target);
    else {
      assert.equal(response.status, 200);
      assert.ok((await response.text()).includes(`NEXT_REDIRECT;replace;${target};307`));
    }
  };
  const missingPage = async (response) => {
    if (response.status === 404) return;
    assert.equal(response.status, 200);
    assert.match(await response.text(), /NEXT_HTTP_ERROR_FALLBACK;404/);
  };
  const api = (path, options = {}) => fetch(origin + path, { redirect: "manual", ...options });
  const exchange = (idToken, requestOrigin = origin) => api("/api/session", {
    method: "POST", headers: { Origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify({ idToken }),
  });
  for (const [uid, state] of [["student", "student"], ["outside", "student"], ["employer", "employer"], ["otheremployer", "employer"], ["pending", "pending"], ["admin", "mfa"]]) {
    const response = await exchange(tokens[uid]);
    assert.equal(response.status, 200, uid);
    assert.equal((await response.json()).state, state, uid);
    session[uid] = response.headers.getSetCookie().find((value) => /^(apu_session|apu_onboarding)=\S{20}/.test(value)).split(";")[0];
  }
  assert.equal((await exchange(tokens.disabled)).status, 403);
  assert.equal((await exchange(tokens.unverified)).status, 403);
  assert.equal((await exchange(tokens.student, "https://elsewhere.example")).status, 403);
  assert.equal((await exchange({ invalid: true })).status, 400);
  for (const [uid, role] of [["pending", "employer"], ["admin", "admin"]]) {
    const response = await api(`/${role}`, { headers: { Cookie: session[uid] } });
    await redirectedTo(response, "/onboarding");
    assert.match(await (await api("/onboarding", { headers: { Cookie: session[uid] } })).text(), /approval pending|Administrator setup/i);
  }
  assert.equal((await api("/api/documents/download?ownerId=student&documentId=selected", { headers: { Cookie: session.admin } })).status, 401);
  const authBase = `http://${env.FIREBASE_AUTH_EMULATOR_HOST}`;
  const authPost = async (path, data) => {
    const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/${path}?key=demo-key`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    assert.ok(response.ok, path);
    return response.json();
  };
  const sms = async (sessionInfo) => {
    const response = await fetch(`${authBase}/emulator/v1/projects/${demoProject}/verificationCodes`);
    const { verificationCodes } = await response.json();
    return { sessionInfo, code: verificationCodes.find((entry) => entry.sessionInfo === sessionInfo).code };
  };
  // The Auth emulator supports SMS MFA. Staging verifies the TOTP provider path.
  const enrollment = await authPost("v2/accounts/mfaEnrollment:start", {
    idToken: tokens.admin, phoneEnrollmentInfo: { phoneNumber: "+16505550100" },
  });
  const enrolled = await authPost("v2/accounts/mfaEnrollment:finalize", {
    idToken: tokens.admin, phoneVerificationInfo: await sms(enrollment.phoneSessionInfo.sessionInfo),
  });
  const enrollmentSession = await exchange(enrolled.idToken);
  assert.equal((await enrollmentSession.json()).state, "mfa");
  await delay(1100);
  const challenge = await authPost("v1/accounts:signInWithPassword", { email: "admin@example.test", password, returnSecureToken: true });
  const { mfaPendingCredential } = challenge;
  const factorChallenge = await authPost("v2/accounts/mfaSignIn:start", { mfaPendingCredential, mfaEnrollmentId: challenge.mfaInfo[0].mfaEnrollmentId, phoneSignInInfo: {} });
  const verified = await authPost("v2/accounts/mfaSignIn:finalize", { mfaPendingCredential, phoneVerificationInfo: await sms(factorChallenge.phoneResponseInfo.sessionInfo) });
  const adminSession = await exchange(verified.idToken);
  assert.equal(adminSession.status, 200);
  assert.equal((await adminSession.json()).state, "admin");
  const adminCookie = adminSession.headers.getSetCookie().find((value) => /^apu_session=\S{20}/.test(value));
  assert.match(adminCookie, /Max-Age=28800/i);
  session.admin = adminCookie.split(";")[0];

  const invalid = new FormData();
  invalid.set("file", new Blob(["not a PDF"], { type: "application/pdf" }), "fake.pdf");
  assert.equal((await api("/api/documents/upload", { method: "POST", headers: { Cookie: session.student, Origin: origin }, body: invalid })).status, 400);
  const valid = new FormData();
  valid.set("file", new Blob([bytes], { type: "application/pdf" }), "cv.pdf");
  assert.equal((await api("/api/documents/upload", { method: "POST", headers: { Cookie: session.student, Origin: origin }, body: valid })).status, 200);
  const registered = await authPost("v1/accounts:signUp", { email: "registration@example.test", password, returnSecureToken: true });
  const registration = (role) => api("/api/register-profile", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: registered.idToken, fullName: "Synthetic registration", requestedRole: role, studentId: "TEST123", programme: "Test programme" }),
  });
  assert.equal((await registration("admin")).status, 400);
  assert.equal((await registration("student")).status, 200);
  await auth.setCustomUserClaims(registered.localId, null); // Simulate the profile having persisted without the claim.
  assert.equal((await registration("student")).status, 200);
  assert.equal((await auth.getUser(registered.localId)).customClaims.role, "student");
  const registrationEvents = await db.collection("auditLogs").where("entityId", "==", registered.localId).get();
  assert.equal(registrationEvents.docs.filter((doc) => doc.get("action") === "user.registered").length, 1);
  console.log("Session exchange, restricted onboarding, foreign-origin denial, and file-content checks passed.");

  browser = await chromium.launch({ headless: true });
  const context = async (uid, viewport = { width: 1280, height: 900 }) => {
    const result = await browser.newContext({ viewport });
    if (uid) {
      const [name, ...parts] = session[uid].split("=");
      await result.addCookies([{ name, value: parts.join("="), url: origin, httpOnly: true }]);
    }
    return result;
  };
  const student = await context("student", { width: 390, height: 844 });
  const student2 = await context("student");
  const employer = await context("employer");
  const outsider = await context("outside");
  const guest = await context();
  const login = await guest.newPage();
  await login.goto(origin + "/login");
  await login.getByLabel("Email address").fill("outside@example.test");
  await login.getByLabel("Password", { exact: true }).fill(password);
  await login.getByRole("button", { name: "Sign in securely" }).click();
  await login.waitForURL("**/student");
  await login.getByRole("button", { name: "Refresh dashboard" }).click();
  await login.getByRole("button", { name: "Refresh dashboard" }).waitFor();
  const admin = await context("admin");
  const employerHome = await employer.newPage();
  const adminHome = await admin.newPage();
  for (const [page, role] of [[employerHome, "employer"], [adminHome, "admin"]]) {
    await page.goto(origin + "/" + role);
    await page.getByRole("button", { name: "Refresh dashboard" }).click();
    await page.getByRole("button", { name: "Refresh dashboard" }).waitFor();
  }
  console.log("All three dashboards rendered and refreshed. Admin access required a fresh second-factor sign-in.");
  await adminHome.goto(origin + "/admin/users");
  await auth.setCustomUserClaims("pending", { role: "employer" }); // Simulate an interrupted approval after its Auth write.
  assert.equal((await db.doc("users/pending").get()).get("approved"), false);
  await adminHome.getByRole("button", { name: "Approve employer" }).first().click();
  await adminHome.getByText("Employer access approved successfully.").waitFor();
  assert.equal((await db.doc("users/pending").get()).get("approved"), true);
  assert.equal((await db.collection("auditLogs").where("action", "==", "employer.approved").get()).size, 1);
  await redirectedTo(await api("/employer", { headers: { Cookie: session.pending } }), "/login");

  await adminHome.goto(origin + "/admin/vacancies");
  await adminHome.getByRole("button", { name: "Approve Emulator Expired Pending Vacancy" }).click();
  await adminHome.getByText(/The deadline has passed/).waitFor();
  assert.equal((await db.doc("jobs/expiredpending").get()).get("status"), "pending_approval");
  const moderation2 = await admin.newPage();
  await moderation2.goto(origin + "/admin/vacancies");
  moderation2.on("dialog", (dialog) => dialog.accept("Synthetic rejection reason"));
  await Promise.all([
    adminHome.getByRole("button", { name: "Approve Emulator Pending Vacancy" }).click(),
    moderation2.getByRole("button", { name: "Reject Emulator Pending Vacancy" }).click(),
  ]);
  await Promise.all([adminHome, moderation2].map((page) => page.getByText(/is now published|has been rejected|Pending vacancy not found/).first().waitFor()));
  const decisions = await db.collection("auditLogs").where("entityId", "==", "pending").get();
  assert.equal(decisions.docs.filter((doc) => /^vacancy\./.test(doc.get("action"))).length, 1);
  console.log("Interrupted employer approval recovered and competing moderation actions wrote one decision.");


  const vacancies = await api("/jobs");
  const listing = await vacancies.text();
  assert.match(listing, /Emulator Lab Assistant/);
  assert.doesNotMatch(listing, /Confidential expired vacancy|Confidential closed vacancy/);
  await missingPage(await api("/jobs/expired"));
  await missingPage(await api("/jobs/closed/apply", { headers: { Cookie: session.student } }));
  const apply = async (ctx, vacancy = "open", file = "selected") => {
    const page = await ctx.newPage();
    await page.goto(origin + `/jobs/${vacancy}/apply`);
    await page.getByLabel("Cover letter").fill("This is a synthetic cover letter for testing concurrent submissions. It contains no personal data.");
    await page.getByText(`${file}.pdf`, { exact: true }).click();
    await page.getByRole("checkbox").check();
    return page;
  };
  const pages = await Promise.all([apply(student), apply(student2)]);
  await Promise.all(pages.map((page) => page.getByRole("button", { name: /Submit application securely/ }).click()));
  await Promise.all(pages.map((page) => page.getByText(/Application submitted$|You already applied/).first().waitFor()));
  const application = db.doc("applications/open_student");
  assert.equal((await application.get()).get("documentId"), "selected");
  assert.equal((await application.collection("statusHistory").get()).size, 1);
  assert.equal((await db.collection("auditLogs").where("action", "==", "application.submitted").get()).size, 1);
  assert.equal((await db.doc("jobs/open").get()).get("applicants"), 1);
  assert.equal((await student.request.delete(origin + "/api/documents/selected", { headers: { Origin: origin } })).status(), 409);
  const download = origin + "/api/documents/download?ownerId=student&documentId=selected&applicationId=open_student";
  assert.equal((await employer.request.get(download)).status(), 200);
  assert.equal((await employer.request.get(download.replace("selected", "unused"))).status(), 404);
  assert.equal((await outsider.request.get(download)).status(), 404);
  console.log("Concurrent duplicate submissions produced one application, history entry, audit entry, and count increment. Selected files were retained.");
  const race = await apply(student2, "race", "unused");
  const [, deleteResult] = await Promise.all([
    race.getByRole("button", { name: /Submit application securely/ }).click(),
    student.request.delete(origin + "/api/documents/unused", { headers: { Origin: origin } }),
  ]);
  await race.getByText(/Application submitted$|selected document is no longer available/).first().waitFor();
  const applied = (await db.doc("applications/race_student").get()).exists;
  assert.equal(deleteResult.status(), applied ? 409 : 200);
  assert.equal((await bucket.file(extraPath).exists())[0], applied);


  const threadStudent = await student.newPage();
  const threadEmployer = await employer.newPage();
  const studentUrl = origin + "/student/applications/open_student";
  const employerUrl = origin + "/employer/applications/open_student";
  await Promise.all([threadStudent.goto(studentUrl), threadEmployer.goto(employerUrl)]);
  await missingPage(await api("/student/applications/open_student", { headers: { Cookie: session.outside } }));
  await threadStudent.getByRole("textbox", { name: "Message", exact: true }).fill("Synthetic question from the student");
  const originalRequest = threadStudent.waitForRequest((req) => req.method() === "POST" && !!req.headers()["next-action"]);
  await threadStudent.getByRole("button", { name: "Send message" }).click();
  const sent = await originalRequest;
  await threadStudent.getByText("Synthetic question from the student", { exact: true }).waitFor();
  const requestHeaders = sent.headers();
  const replay = await student.request.post(sent.url(), {
    data: sent.postDataBuffer(),
    headers: { origin, "content-type": requestHeaders["content-type"], "next-action": requestHeaders["next-action"] },
  });
  assert.equal(replay.status(), 200);
  assert.equal((await application.collection("messages").get()).size, 1);
  await threadEmployer.getByRole("button", { name: "Refresh messages" }).click();
  await threadEmployer.getByText("Synthetic question from the student", { exact: true }).waitFor();
  await threadEmployer.getByRole("textbox", { name: "Message", exact: true }).fill("Synthetic reply from the employer");
  await threadEmployer.getByRole("button", { name: "Send message" }).click();
  await threadEmployer.getByText("Synthetic reply from the employer", { exact: true }).waitFor();
  await threadStudent.getByRole("button", { name: "Refresh messages" }).click();
  await threadStudent.getByText("Synthetic reply from the employer", { exact: true }).waitFor();
  assert.equal((await application.collection("messages").get()).size, 2);
  const foreignReplay = await outsider.request.post(sent.url(), {
    data: sent.postDataBuffer(),
    headers: { origin, "content-type": requestHeaders["content-type"], "next-action": requestHeaders["next-action"] },
  });
  assert.match(await foreignReplay.text(), /Application not found/);
  assert.equal((await application.collection("messages").get()).size, 2);

  console.log("Private conversation worked in both directions; replay produced no duplicate.");
  const reviewer2 = await employer.newPage();
  await reviewer2.goto(employerUrl);
  async function chooseStatus(page) {
    await page.getByText("Choose the next status").click();
    await page.getByRole("option", { name: "Under review", exact: true }).click();
  }
  await chooseStatus(threadEmployer);
  await chooseStatus(reviewer2);
  await threadEmployer.getByLabel("Message to student").fill("Synthetic public review update");
  await threadEmployer.getByLabel("Private review note").fill("Synthetic confidential review note");
  await reviewer2.getByLabel("Private review note").fill("Synthetic stale draft");
  await threadEmployer.getByRole("button", { name: "Save decision" }).click();
  await threadEmployer.getByText("The application status was updated successfully.").waitFor();
  await reviewer2.getByRole("button", { name: "Save decision" }).click();
  await reviewer2.getByText(/This application changed/).waitFor();
  assert.equal(await reviewer2.getByLabel("Private review note").inputValue(), "Synthetic stale draft");
  assert.equal((await application.collection("statusHistory").get()).size, 2);
  const studentPayload = await (await api("/student/applications/open_student", { headers: { Cookie: session.student } })).text();
  assert.match(studentPayload, /Synthetic public review update/);
  assert.doesNotMatch(studentPayload, /Synthetic confidential review note|Synthetic stale draft|internalNote/);
  await threadEmployer.getByText("Synthetic confidential review note", { exact: true }).waitFor();
  await employerHome.goto(origin + "/employer/applications?q=Test+student&vacancy=open&status=under_review");
  assert.equal(await employerHome.getByRole("row").count(), 2);
  assert.match(await employerHome.getByRole("row").last().innerText(), /Test student.*Emulator Lab Assistant/s);
  await employerHome.goto(origin + "/employer/applications?q=unmatched");
  await employerHome.getByText("No applications match these filters.").waitFor();

  const refresh = threadStudent.getByRole("button", { name: "Refresh messages" });
  await refresh.focus();
  await threadStudent.keyboard.press("Tab");
  assert.ok(await threadStudent.evaluate(() => document.activeElement !== document.body));
  for (const page of [threadStudent, threadEmployer]) {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  console.log("Stale reviews preserved drafts, student responses omitted notes, and applicant filters worked.");


  await adminHome.goto(origin + "/admin/users");
  await adminHome.getByRole("row").filter({ hasText: "outside@example.test" }).getByRole("button", { name: "Deactivate" }).click();
  await adminHome.getByText("Account deactivated successfully.").waitFor();
  assert.equal((await auth.getUser("outside")).disabled, true);
  const revokedByProfile = await api("/student", { headers: { Cookie: session.outside } });
  await redirectedTo(revokedByProfile, "/login");
  console.log("An existing cookie could not bypass account deactivation.");
  const burst = await Promise.all(Array.from({ length: 6 }, () => exchange(tokens.disabled)));
  assert.ok(burst.some((response) => response.status === 429 && response.headers.get("retry-after") === "60"));
  console.log("A burst crossed the shared per-account session limit and returned Retry-After.");
} finally {
  await browser?.close();
  next.kill();
}
