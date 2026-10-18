import type { Metadata } from "next";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "APU CareerHub | On-Campus Employment";
  const description = "Discover, apply for, and manage on-campus employment opportunities at Asia Pacific University.";

  return {
    metadataBase,
    title: { default: title, template: "%s | APU CareerHub" },
    description,
    applicationName: "APU CareerHub",
    keywords: ["APU", "campus jobs", "student employment", "career portal"],
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: "/og.png", width: 1731, height: 909, alt: "APU CareerHub on-campus employment portal" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
