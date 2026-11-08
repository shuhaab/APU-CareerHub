import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { demoProject, isLoopbackEmulatorHost } from "./emulator";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseClientConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

function requireFirebaseApp(): FirebaseApp {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase client configuration is missing.");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1";
  const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulator && (firebaseConfig.projectId !== demoProject || firebaseConfig.apiKey !== "demo-key" || !isLoopbackEmulatorHost(host))) {
    throw new Error("Unsafe Firebase Auth emulator configuration.");
  }
  const auth = getAuth(requireFirebaseApp());
  if (emulator && !auth.emulatorConfig) connectAuthEmulator(auth, `http://${host}`);
  return auth;
}
