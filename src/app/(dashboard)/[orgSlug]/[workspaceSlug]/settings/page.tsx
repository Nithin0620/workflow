import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { Users, Shield, Mail, UserCheck } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    include: {
      organization: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!workspace) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Workspace Settings & Team
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Manage workspace details, team members, and role permissions.
        </p>
      </div>

      {/* General info card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          General Details
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Workspace Name
            </label>
            <div className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {workspace.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Workspace Slug
            </label>
            <div className="mt-1 font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {workspace.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Members Directory */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Team Members ({workspace.members.length})
            </h2>
            <p className="text-xs text-neutral-500">
              People with access to this workspace and its projects.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
          {workspace.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                  {(m.user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {m.user.name || "Unnamed User"}
                  </div>
                  <div className="text-[11px] text-neutral-500">{m.user.email}</div>
                </div>
              </div>

              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
