import type { Metadata } from "next";
import { appOrigin } from "@/lib/http/input";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const origin = appOrigin();
  const metadataBase = origin ? new URL(origin) : undefined;
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
