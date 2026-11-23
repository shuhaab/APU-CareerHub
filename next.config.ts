import type { NextConfig } from "next";
import { assertEmulatorEnvironment } from "./src/lib/firebase/emulator";

if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1") assertEmulatorEnvironment(process.env);

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  logging: false,
  async headers() {
    return [
      ...["/student/:path*", "/employer/:path*", "/admin/:path*", "/onboarding", "/api/:path*"].map((source) => ({
        source, headers: [{ key: "Cache-Control", value: "private, no-store" }],
      })),
    ];
  },
};

export default nextConfig;
