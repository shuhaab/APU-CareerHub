import assert from "node:assert/strict";
import { test } from "node:test";
import { assertEmulatorEnvironment, demoProject } from "../src/lib/firebase/emulator.ts";

const env = {
  FIREBASE_PROJECT_ID: demoProject,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: demoProject,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${demoProject}.appspot.com`,
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
};

test("emulator configuration rejects real projects, nonlocal hosts, credentials and missing services", () => {
  assert.doesNotThrow(() => assertEmulatorEnvironment(env));
  for (const [key, value] of Object.entries({
    FIREBASE_PROJECT_ID: "real-project",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "real-project",
    FIREBASE_AUTH_EMULATOR_HOST: "auth.example.org:9099",
    FIRESTORE_EMULATOR_HOST: "",
    FIREBASE_STORAGE_EMULATOR_HOST: "",
    STORAGE_EMULATOR_HOST: "https://storage.example.org",
    GOOGLE_APPLICATION_CREDENTIALS: "/tmp/test-key.json",
  })) assert.throws(() => assertEmulatorEnvironment({ ...env, [key]: value }), /isolated CareerHub demo/);
});
