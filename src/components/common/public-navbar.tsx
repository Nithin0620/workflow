"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface PublicNavbarProps {
  theme?: "dark" | "light";
  workspaceUrl?: string | null;
}

export function PublicNavbar({ theme = "dark", workspaceUrl }: PublicNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resolvedWsUrl, setResolvedWsUrl] = useState<string | null>(workspaceUrl || null);

  const isDark = theme === "dark";

  useEffect(() => {
    if (workspaceUrl) {
      setResolvedWsUrl(workspaceUrl);
      return;
    }

    if (session?.user) {
      import("@/actions/workspaces").then(({ getUserWorkspaces }) => {
        getUserWorkspaces()
          .then((workspaces) => {
            if (workspaces && workspaces.length > 0 && workspaces[0].organization) {
              setResolvedWsUrl(`/${workspaces[0].organization.slug}/${workspaces[0].slug}`);
            }
          })
          .catch(() => {});
      });
    }
  }, [session, workspaceUrl]);

  const targetWorkspaceUrl = resolvedWsUrl || "/login";

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Hierarchy", href: "/#hierarchy" },
    { label: "Planned Journeys", href: "/planned-journey" },
    { label: "Contact & Enquiry", href: "/contact" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors ${
        isDark
          ? "border-neutral-900 dark:border-neutral-100 bg-black dark:bg-white/95 text-white"
          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black/95 text-black"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo & Left Navigation Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-7 w-7 shrink-0" />
            <span
              className={`text-base font-bold tracking-tight ${
                isDark ? "text-white dark:text-black" : "text-black dark:text-white"
              }`}
            >
              Workflow
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium">
            {navLinks.map((link) => {
              const isActive =
                link.href === pathname ||
                (link.href.startsWith("/#") && pathname === "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition ${
                    isActive
                      ? isDark
                        ? "text-white dark:text-black font-semibold"
                        : "text-black dark:text-white font-semibold"
                      : isDark
                      ? "text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                isDark
                  ? "bg-white dark:bg-black text-black hover:bg-neutral-200"
                  : "bg-black dark:bg-white text-white hover:bg-neutral-800"
              }`}
            >
              <span>Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  isDark
                    ? "text-neutral-300 dark:text-neutral-700 hover:text-white dark:text-black hover:bg-neutral-900"
                    : "text-neutral-700 dark:text-neutral-300 hover:text-black dark:text-white hover:bg-neutral-100"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                  isDark
                    ? "bg-white dark:bg-black text-black hover:bg-neutral-200"
                    : "bg-black dark:bg-white text-white hover:bg-neutral-800"
                }`}
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`sm:hidden p-2 rounded-lg transition ${
            isDark ? "text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black hover:bg-neutral-900" : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white hover:bg-neutral-100"
          }`}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className={`sm:hidden border-t px-6 py-4 space-y-3 ${
            isDark
              ? "border-neutral-900 dark:border-neutral-100 bg-black dark:bg-white text-white"
              : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-black"
          }`}
        >
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-sm font-medium transition ${
                  isDark ? "text-neutral-300 dark:text-neutral-700 hover:text-white dark:text-black" : "text-neutral-700 hover:text-black dark:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-800 dark:border-neutral-200 flex flex-col gap-2">
            {session?.user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-center py-2 text-xs font-bold rounded-lg ${
                  isDark ? "bg-white dark:bg-black text-black" : "bg-black text-white dark:text-black"
                }`}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-center py-2 text-xs font-semibold rounded-lg ${
                    isDark ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black" : "bg-neutral-100 text-black dark:text-white"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-center py-2 text-xs font-bold rounded-lg ${
                    isDark ? "bg-white dark:bg-black text-black" : "bg-black text-white dark:text-black"
                  }`}
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

