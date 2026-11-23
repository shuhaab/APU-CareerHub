import { generateKeyPairSync } from "node:crypto";
import { assertEmulatorEnvironment } from "./emulator";
import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): App {
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1";
  if (emulator) {
    assertEmulatorEnvironment(process.env, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  } else if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.STORAGE_EMULATOR_HOST || process.env.CLOUD_STORAGE_EMULATOR_HOST) {
    throw new Error("Emulator hosts require explicit emulator mode.");
  }
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)) {
    throw new Error("The server and browser Firebase project settings must match.");
  }
  if (Boolean(clientEmail) !== Boolean(privateKey)) throw new Error("Both Firebase service account fields are required.");

  // The SDK requires a certificate-shaped credential for Firestore; a disposable key avoids ADC discovery.
  const localCredential = emulator ? cert({
    projectId,
    clientEmail: "emulator@demo-careerhub.iam.gserviceaccount.com",
    privateKey: generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey,
  }) : undefined;
  return initializeApp({
    credential: localCredential ?? (clientEmail && privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault()),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}
