import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { inviteStatus, roleLabel } from "@/lib/invites";
import { InviteActions } from "@/components/invite/invite-actions";

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token) {
    return <State title="Invalid invitation" message="This invite link is missing its token. Ask the person who invited you to resend it." />;
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true, invitedBy: { select: { name: true, email: true } } },
  });

  if (!invite) {
    return <State title="Invalid invitation" message="This invitation no longer exists. It may have been superseded by a new invite." />;
  }

  const status = inviteStatus(invite);
  if (status === "expired") {
    return <State title="Invitation expired" message={`This invitation expired on ${invite.expiresAt.toDateString()}. Ask the workspace admin to send a new one.`} />;
  }
  if (status === "accepted") {
    return <State title="Invitation already used" message="This invitation has already been accepted. You're all set — sign in and it should appear under your workspaces." />;
  }

  const user = await getCurrentUser();
  const hasAccount = (await prisma.user.findUnique({ where: { email: invite.email } })) !== null;
  const isMatchingUser = user !== null && user.email?.toLowerCase() === invite.email;

  const callbackUrl = `/invite?token=${token}`;
  const encodedCallback = encodeURIComponent(callbackUrl);
  const inviterName = invite.invitedBy.name ?? invite.invitedBy.email ?? "A teammate";
  const currentEmail = user?.email ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-black">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white text-xs font-black">W</div>
          <span className="text-sm font-bold tracking-tight">Workflow</span>
        </div>

        <h1 className="mt-6 text-xl font-bold text-black">
          {inviterName} invited you to <span className="text-black">{invite.workspace.name}</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Join as a <span className="font-bold text-neutral-800">{roleLabel(invite.role)}</span> and
          start collaborating on boards, issues, and sprints.
        </p>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
            Invited email
          </div>
          <div className="mt-0.5 font-semibold text-black">{invite.email}</div>
        </div>

        <InviteActions
          token={token}
          invitedEmail={invite.email}
          currentEmail={currentEmail}
          hasAccount={hasAccount}
          isMatchingUser={isMatchingUser}
          registerUrl={`/register?callbackUrl=${encodedCallback}`}
          loginUrl={`/login?callbackUrl=${encodedCallback}`}
          workspaceName={invite.workspace.name}
          base={base}
        />

        <p className="mt-6 text-center text-[11px] text-neutral-400">
          Invitation expires {invite.expiresAt.toDateString()} · Sent by {inviterName}
        </p>
      </div>
    </div>
  );
}

function State({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-black">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">{message}</p>
      </div>
    </div>
  );
}