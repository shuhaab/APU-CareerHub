import { readFile } from "node:fs/promises";
import { cert } from "firebase-admin/app";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase Admin credentials are missing from .env.local.");
}

const credential = cert({ projectId, clientEmail, privateKey });
const accessToken = await credential.getAccessToken();
const authorization = `Bearer ${accessToken.access_token}`;
const rulesContent = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

const rulesetResponse = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
  method: "POST",
  headers: { Authorization: authorization, "Content-Type": "application/json" },
  body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content: rulesContent }] } }),
});

if (!rulesetResponse.ok) {
  throw new Error(`Firebase rejected the Firestore rules: ${await rulesetResponse.text()}`);
}

const ruleset = await rulesetResponse.json();
const releaseName = `projects/${projectId}/releases/cloud.firestore`;
const releaseResponse = await fetch(`https://firebaserules.googleapis.com/v1/${releaseName}`, {
  method: "PATCH",
  headers: { Authorization: authorization, "Content-Type": "application/json" },
  body: JSON.stringify({
    release: { name: releaseName, rulesetName: ruleset.name },
    updateMask: "rulesetName",
  }),
});

if (!releaseResponse.ok) {
  throw new Error(`Firebase could not release the Firestore rules: ${await releaseResponse.text()}`);
}

process.stdout.write("Firestore security rules deployed successfully.\n");
