import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const password = process.env.SEED_ACCOUNT_PASSWORD;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase Admin credentials are missing from .env.local.");
}
if (!password || password.length < 12) {
  throw new Error("SEED_ACCOUNT_PASSWORD must contain at least 12 characters.");
}

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });

const auth = getAuth();
const db = getFirestore();
const accounts = [
  { email: "student1@example.com", fullName: "Aisha Rahman", role: "student", studentId: "TP076241", programme: "BSc (Hons) Software Engineering", phone: "+60 12 345 6789", skills: ["TypeScript", "Customer service", "Teamwork"] },
  { email: "student2@example.com", fullName: "Daniel Lee", role: "student", studentId: "TP074118", programme: "BA (Hons) Business Management", phone: "+60 12 555 0142", skills: ["Communication", "Microsoft Office", "Events"] },
  { email: "employer1@example.com", fullName: "Nadia Kamal", role: "employer", department: "APU Library", phone: "+60 3 8992 5000", bio: "APU Library learning resources and student support team." },
  { email: "employer2@example.com", fullName: "Faris Ahmad", role: "employer", department: "Student Affairs", phone: "+60 3 8992 5001", bio: "Student engagement, events, and campus experience team." },
  { email: "admin1@example.com", fullName: "Marcus Tan", role: "admin", department: "System Administration", canManageAdmins: true },
  { email: "admin2@example.com", fullName: "Sara Lim", role: "admin", department: "Career Services Administration", canManageAdmins: false },
];

for (const account of accounts) {
  let user;
  try {
    user = await auth.getUserByEmail(account.email);
    user = await auth.updateUser(user.uid, { password, displayName: account.fullName, disabled: false });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email: account.email, password, displayName: account.fullName, emailVerified: true });
  }

  await auth.setCustomUserClaims(user.uid, { role: account.role });
  await db.collection("users").doc(user.uid).set({
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    requestedRole: account.role === "employer" ? "employer" : account.role === "student" ? "student" : null,
    studentId: account.studentId ?? null,
    programme: account.programme ?? null,
    department: account.department ?? null,
    phone: account.phone ?? "",
    bio: account.bio ?? "",
    skills: account.skills ?? [],
    availability: account.role === "student" ? "12 hours per week" : "",
    availableFrom: "",
    approved: true,
    canManageAdmins: account.canManageAdmins === true,
    mustChangePassword: false,
    accountActive: true,
    seeded: true,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  process.stdout.write(`Seeded ${account.role}: ${account.email}\n`);
}

process.stdout.write("Firebase Authentication and Firestore account profiles are ready.\n");
