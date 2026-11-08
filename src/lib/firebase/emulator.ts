export const demoProject = "demo-careerhub";

export function isLoopbackEmulatorHost(value: string | undefined): value is string {
  if (!value || !/^127\.0\.0\.1:\d{1,5}$/.test(value)) return false;
  const port = Number(value.split(":")[1]);
  return port > 0 && port <= 65535;
}

export function assertEmulatorEnvironment(env: NodeJS.ProcessEnv, publicProject = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  if (env.FIREBASE_PROJECT_ID !== demoProject || publicProject !== demoProject ||
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET !== `${demoProject}.appspot.com` ||
      !isLoopbackEmulatorHost(env.FIREBASE_AUTH_EMULATOR_HOST) ||
      !isLoopbackEmulatorHost(env.FIRESTORE_EMULATOR_HOST) ||
      !isLoopbackEmulatorHost(env.FIREBASE_STORAGE_EMULATOR_HOST) ||
      env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST !== env.FIREBASE_AUTH_EMULATOR_HOST ||
      (env.CLOUD_STORAGE_EMULATOR_HOST && env.CLOUD_STORAGE_EMULATOR_HOST !== `http://${env.FIREBASE_STORAGE_EMULATOR_HOST}`) ||
      (env.STORAGE_EMULATOR_HOST && env.STORAGE_EMULATOR_HOST !== `http://${env.FIREBASE_STORAGE_EMULATOR_HOST}`) ||
      env.GOOGLE_APPLICATION_CREDENTIALS || env.FIREBASE_CLIENT_EMAIL || env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase emulator mode requires the isolated CareerHub demo project, loopback hosts, and no credentials.");
  }
}
