import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { assertEmulatorEnvironment, demoProject } from "../src/lib/firebase/emulator.ts";

const env = {
  ...process.env,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? demoProject,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? demoProject,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${demoProject}.appspot.com`,
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:19099",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:19099",
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:18080",
  FIREBASE_STORAGE_EMULATOR_HOST: process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:19199",
};
assertEmulatorEnvironment(env);
Object.assign(process.env, env);
const app = initializeApp({ projectId: demoProject, credential: cert({
  projectId: demoProject, clientEmail: "emulator@demo-careerhub.iam.gserviceaccount.com",
  privateKey: generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey,
}) });
const auth = getAuth(app);
const db = getFirestore(app);
const password = "CareerHub-Test!123";

for (const role of ["student", "employer", "admin"]) {
  const email = `${role}@example.test`;
  let user;
  try { user = await auth.getUserByEmail(email); }
  catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email });
  }
  const fullName = `Test ${role[0].toUpperCase()}${role.slice(1)}`;
  await auth.updateUser(user.uid, {
    password, emailVerified: true, disabled: false, displayName: fullName,
    ...(role === "admin" && !user.multiFactor?.enrolledFactors?.length ? {
      multiFactor: { enrolledFactors: [{ uid: "local-admin-sms", factorId: "phone", phoneNumber: "+16505550100", displayName: "Local test SMS", enrollmentTime: new Date(Date.now() - 60_000).toUTCString() }] },
    } : {}),
  });
  await auth.setCustomUserClaims(user.uid, { role });
  const ref = db.collection("users").doc(user.uid);
  const existing = await ref.get();
  await ref.set({
    email, fullName, role, accountActive: true, approved: true, mustChangePassword: false,
    canManageAdmins: role === "admin",
    ...(role === "student" ? { studentId: "TP000001", programme: "Software Engineering" } : { department: role === "employer" ? "APU Library" : "System Administration" }),
    ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  assert.equal((await auth.getUser(user.uid)).emailVerified, true);
  assert.equal((await ref.get()).data().role, role);
  console.log(`${role}: ${email}`);
}
console.log("Local accounts ready. Password: " + password);
await db.terminate();
