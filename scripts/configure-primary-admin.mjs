import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const primaryAdminEmail = (process.env.PRIMARY_ADMIN_EMAIL || "admin1@example.com").trim().toLowerCase();

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase Admin credentials are missing from .env.local.");
}

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });

const auth = getAuth();
const db = getFirestore();
const primaryUser = await auth.getUserByEmail(primaryAdminEmail);
const primaryProfile = await db.collection("users").doc(primaryUser.uid).get();

if (!primaryProfile.exists || primaryProfile.data()?.role !== "admin") {
  throw new Error(`${primaryAdminEmail} does not have an administrator profile in Firestore.`);
}

const administrators = await db.collection("users").where("role", "==", "admin").get();
const batch = db.batch();
for (const administrator of administrators.docs) {
  batch.update(administrator.ref, {
    canManageAdmins: administrator.id === primaryUser.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
batch.create(db.collection("auditLogs").doc(), {
  actorId: primaryUser.uid,
  action: "admin.management_permission_configured",
  entityType: "user",
  entityId: primaryUser.uid,
  metadata: { primaryAdminEmail },
  createdAt: FieldValue.serverTimestamp(),
});
await batch.commit();

process.stdout.write(`Primary administrator permission assigned to ${primaryAdminEmail}.\n`);
