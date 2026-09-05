"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { Mail, Lock, User, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await registerUser({ name, email, password });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created, but error signing in. Please go to login.");
        setLoading(false);
      } else {
        router.push(`/${res.defaultOrgSlug}/${res.defaultWorkspaceSlug}`);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* Left Column: Pure Black Showcase */}
      <div className="flex flex-col justify-between bg-black p-8 sm:p-12 text-white border-b lg:border-b-0 lg:border-r border-neutral-800 lg:w-1/2">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black font-black text-xs">
              W
            </div>
            <span className="text-base font-bold tracking-tight text-white">Workflow</span>
          </Link>

          {/* Back to Home Button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="my-10 lg:my-auto space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-[11px] text-neutral-400 font-mono">
            <span>Get Started</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Start shipping faster with your team today.
          </h2>

          <div className="space-y-3 text-xs text-neutral-400">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
              <span>Auto-provisions your Organization & Workspace</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
              <span>Full project hierarchy with custom issue keys</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
              <span>Free forever for small engineering teams</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:block text-xs text-neutral-500 font-mono">
          © 2026 Workflow. Built with Next.js & PostgreSQL.
        </div>
      </div>

      {/* Right Column: Pure White Auth Form */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-12 text-black">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Create your account
            </h1>
            <p className="text-xs text-neutral-500">
              Get started in seconds. No credit card required.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleOAuthLogin("google")}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign up with Google
            </button>

            <button
              onClick={() => handleOAuthLogin("github")}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-400"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Sign up with GitHub
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-neutral-200" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              or with email
            </span>
            <div className="w-full border-t border-neutral-200" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nithin"
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account & Workspace"}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-black underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
