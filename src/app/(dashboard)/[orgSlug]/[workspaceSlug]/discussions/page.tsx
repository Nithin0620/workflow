import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { getWorkspaceChannels } from "@/actions/discussions";

interface DiscussionsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function DiscussionsPage({ params }: DiscussionsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
      members: { some: { userId: user.id } },
    },
  });

  if (!workspace) {
    notFound();
  }

  const { workspaceChannels, projectGroups } = await getWorkspaceChannels(workspace.id);

  // Redirect to first available channel
  const firstChannel =
    workspaceChannels[0] ||
    projectGroups[0]?.channels[0];

  if (firstChannel) {
    redirect(`/${orgSlug}/${workspaceSlug}/discussions/${firstChannel.id}`);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center p-8">
      <h2 className="text-lg font-bold text-white dark:text-black">No discussion channels found</h2>
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
        Create a channel in the sidebar to start collaborating.
      </p>
    </div>
  );
}
