import type { Metadata } from "next";
import { SessionProvider } from "@/components/common/session-provider";
import { SmoothScrollProvider } from "@/components/common/smooth-scroll-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full antialiased bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

