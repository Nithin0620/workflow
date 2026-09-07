"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { acceptInvite } from "@/actions/members";
import { Loader2 } from "lucide-react";

interface InviteActionsProps {
  token: string;
  invitedEmail: string;
  currentEmail: string | null;
  hasAccount: boolean;
  isMatchingUser: boolean;
  registerUrl: string;
  loginUrl: string;
  workspaceName: string;
  base: string;
}

export function InviteActions({
  token,
  invitedEmail,
  currentEmail,
  hasAccount,
  isMatchingUser,
  registerUrl,
  loginUrl,
  workspaceName,
  base,
}: InviteActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      const res = await acceptInvite(token);
      if (res.error) {
        setError(res.error);
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      }
    });
  };

  const handleSwitchAccount = () => {
    signOut({ callbackUrl: loginUrl });
  };

  const openLink = () => window.open(base, "_blank", "noopener,noreferrer");

  if (isMatchingUser) {
    return (
      <div className="mt-6 space-y-3">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
            {error}
          </div>
        )}
        <button
          onClick={handleAccept}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-black transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Accept invitation & open {workspaceName}
        </button>
        <button
          onClick={openLink}
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-950"
        >
          Not now — go to Workflow
        </button>
      </div>
    );
  }

  if (currentEmail) {
    return (
      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          This invitation is for <strong>{invitedEmail}</strong>, but you&apos;re signed in as{" "}
          <strong>{currentEmail}</strong>. Switch accounts to accept it.
        </div>
        <button
          onClick={handleSwitchAccount}
          className="w-full rounded-xl bg-black dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-black transition hover:bg-neutral-800"
        >
          Switch account & sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        {hasAccount
          ? `You have an account with ${invitedEmail}. Sign in to accept this invitation.`
          : `No account with ${invitedEmail} yet? Create one in a minute, then accept — we'll take you straight back here.`}
      </p>
      {hasAccount ? (
        <a
          href={loginUrl}
          className="block w-full rounded-xl bg-black dark:bg-white px-4 py-3 text-center text-sm font-bold text-white dark:text-black transition hover:bg-neutral-800"
        >
          Sign in to accept
        </a>
      ) : (
        <a
          href={registerUrl}
          className="block w-full rounded-xl bg-black dark:bg-white px-4 py-3 text-center text-sm font-bold text-white dark:text-black transition hover:bg-neutral-800"
        >
          Create account with {invitedEmail}
        </a>
      )}
      <a
        href={loginUrl}
        className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-3 text-center text-sm font-semibold text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-950"
      >
        I already have an account
      </a>
    </div>
  );
}