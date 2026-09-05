"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Menu, X } from "lucide-react";

interface PublicNavbarProps {
  theme?: "dark" | "light";
}

export function PublicNavbar({ theme = "dark" }: PublicNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === "dark";

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Hierarchy", href: "/#hierarchy" },
    { label: "Contact & Enquiry", href: "/contact" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors ${
        isDark
          ? "border-neutral-900 bg-black/95 text-white"
          : "border-neutral-200 bg-white/95 text-black"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo & Left Navigation Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              W
            </div>
            <span
              className={`text-base font-bold tracking-tight ${
                isDark ? "text-white" : "text-black"
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
                        ? "text-white font-semibold"
                        : "text-black font-semibold"
                      : isDark
                      ? "text-neutral-400 hover:text-white"
                      : "text-neutral-600 hover:text-black"
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
          {session?.user ? (
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                isDark
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              <span>Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  isDark
                    ? "text-neutral-300 hover:text-white hover:bg-neutral-900"
                    : "text-neutral-700 hover:text-black hover:bg-neutral-100"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                  isDark
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
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
            isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-900" : "text-neutral-600 hover:text-black hover:bg-neutral-100"
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
              ? "border-neutral-900 bg-black text-white"
              : "border-neutral-200 bg-white text-black"
          }`}
        >
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-sm font-medium transition ${
                  isDark ? "text-neutral-300 hover:text-white" : "text-neutral-700 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full text-center py-2 text-xs font-semibold rounded-lg ${
                isDark ? "bg-neutral-900 text-white" : "bg-neutral-100 text-black"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full text-center py-2 text-xs font-bold rounded-lg ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

