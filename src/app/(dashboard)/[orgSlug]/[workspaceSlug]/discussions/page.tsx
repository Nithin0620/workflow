import { getCurrentUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";

interface DiscussionsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function DiscussionsPage({ params }: DiscussionsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentMembership = user.workspaceMembers.find(
    (m) =>
      m.workspace.slug === workspaceSlug &&
      m.workspace.organization.slug === orgSlug
  );

  if (!currentMembership) {
    notFound();
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900 border border-neutral-800 text-white shadow-inner mb-6">
        <MessageSquare className="h-10 w-10 text-neutral-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Discussions</h2>
      <p className="text-neutral-400 max-w-md text-sm">
        Select a server, group, or channel from the sidebar to start collaborating. You can participate in threads or convert discussions directly into tracked issues.
      </p>
    </div>
  );
}
