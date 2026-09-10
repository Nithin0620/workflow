"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "./logo";

interface PublicNavbarProps {
  theme?: "dark" | "light";
  workspaceUrl?: string | null;
}

export function PublicNavbar({ theme = "dark", workspaceUrl }: PublicNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resolvedWsUrl, setResolvedWsUrl] = useState<string | null>(workspaceUrl || null);
  const [scrolled, setScrolled] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isDark
          ? `bg-black/80 text-white ${scrolled ? "border-b border-white/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.04)]" : "border-b border-transparent"}`
          : `bg-white/80 text-black ${scrolled ? "border-b border-black/[0.06] shadow-[0_1px_0_0_rgba(0,0,0,0.04)]" : "border-b border-transparent"}`
      } backdrop-blur-xl`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative">
              <Logo className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            </div>
            <span
              className={`text-sm font-semibold tracking-[-0.01em] ${
                isDark ? "text-white" : "text-zinc-900"
              }`}
            >
              Workflow
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive =
                link.href === pathname ||
                (link.href.startsWith("/#") && pathname === "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 rounded-md ${
                    isActive
                      ? isDark
                        ? "text-white bg-white/[0.08]"
                        : "text-zinc-900 bg-black/[0.05]"
                      : isDark
                      ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-1">
          {session?.user ? (
            <Link
              href="/dashboard"
              className={`group flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              Dashboard
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                  isDark
                    ? "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`group flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                  isDark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-1.5 -mr-1.5 rounded-md transition-colors duration-150 ${
            isDark
              ? "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]"
          }`}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
          mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`px-5 pb-4 pt-2 ${
            isDark ? "border-t border-white/[0.06]" : "border-t border-black/[0.06]"
          }`}
        >
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                  isDark
                    ? "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div
            className={`mt-3 flex flex-col gap-1.5 ${
              isDark ? "border-t border-white/[0.06] pt-3" : "border-t border-black/[0.06] pt-3"
            }`}
          >
            {session?.user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium ${
                  isDark ? "bg-white text-black" : "bg-zinc-900 text-white"
                }`}
              >
                Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg py-2 text-center text-[13px] font-medium ${
                    isDark
                      ? "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium ${
                    isDark ? "bg-white text-black" : "bg-zinc-900 text-white"
                  }`}
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
