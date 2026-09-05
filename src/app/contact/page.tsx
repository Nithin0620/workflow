"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/common/public-navbar";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  Building,
  User,
  MessageSquare,
  Sparkles,
  Shield,
  Server,
  Zap,
} from "lucide-react";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("access_key", "648eea10-8a59-4105-b10c-5de130c5828d");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Unified Public Navbar */}
      <PublicNavbar theme="dark" />

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Pure Black Value Proposition */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-400 font-mono">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span>Enterprise & Paid Services</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Let&apos;s build something great together.
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Looking for dedicated self-hosted deployment, custom integrations, enterprise SLA, or professional consulting? Start an enquiry below.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-neutral-900 bg-neutral-950 p-4">
                <Server className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">Dedicated Private Hosting</h3>
                  <p className="text-[11px] text-neutral-400">
                    Deploy Workflow inside your private AWS/GCP VPC or on-premise infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-neutral-900 bg-neutral-950 p-4">
                <Shield className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">Custom RBAC & SSO (SAML/Okta)</h3>
                  <p className="text-[11px] text-neutral-400">
                    Custom compliance integrations, SOC2 audit assistance, and enterprise single sign-on.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-neutral-900 bg-neutral-950 p-4">
                <Zap className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">Priority Engineering SLA</h3>
                  <p className="text-[11px] text-neutral-400">
                    Direct access to core engineering support with guaranteed response times.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pure White Contact Form Card */}
          <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-white p-6 sm:p-10 text-black shadow-2xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-black">
                  Enquiry Received!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
                  Thank you for reaching out. Our engineering team has received your details and will get back to you within 24 hours.
                </p>
                <div className="pt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-neutral-800 transition"
                  >
                    <span>Return to Home</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1 border-b border-neutral-200 pb-4">
                  <h2 className="text-xl font-bold text-black">
                    Start an Enterprise Enquiry
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Fill out the details below and we&apos;ll get back to you shortly.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Your Name *
                    </label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Nithin"
                        className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Work Email *
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="nithin@company.com"
                        className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Company & Service Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Company / Organization
                    </label>
                    <div className="relative mt-1">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="text"
                        name="company"
                        placeholder="Acme Corp"
                        className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Service Type
                    </label>
                    <select
                      name="service_type"
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-black focus:border-black focus:outline-none"
                    >
                      <option value="Paid Dedicated Hosting">Dedicated Private Cloud / On-Prem</option>
                      <option value="Custom Engineering & Integrations">Custom Engineering & Integrations</option>
                      <option value="Enterprise SLA & Priority Support">Enterprise SLA & Priority Support</option>
                      <option value="General Paid Inquiry">General Paid Inquiry</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Project Requirements / Message *
                  </label>
                  <div className="relative mt-1">
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Tell us about your team size, infrastructure requirements, and timeline..."
                      className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs font-bold text-white shadow-xl hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Sending Enquiry..." : "Submit Enterprise Enquiry"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-black font-black text-xs">
              W
            </div>
            <span className="text-sm font-bold text-white">Workflow</span>
            <span className="text-xs text-neutral-500">© 2026. Built with Next.js & PostgreSQL.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400 font-medium">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <Link href="/how-it-works" className="hover:text-white transition">
              How It Works
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-white transition font-bold text-white">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
