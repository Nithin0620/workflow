import type { Metadata } from "next";
import { SessionProvider } from "@/components/common/session-provider";
import { SmoothScrollProvider } from "@/components/common/smooth-scroll-provider";
import "./globals.css";
import { VersionDisplay } from "@/components/common/version-display";

export const metadata: Metadata = {
  title: "Workflow — Real-Time Project & Issue Management",
  description: "A fast, collaborative engineering workspace for modern teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <SessionProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
          <VersionDisplay />
        </SessionProvider>
      </body>
    </html>
  );
}

