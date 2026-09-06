import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { getChannelDetails, getChannelMessages } from "@/actions/discussions";
import { DiscussionChannelView } from "@/components/discussions/discussion-channel-view";

interface ChannelPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
    channelId: string;
  }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { orgSlug, workspaceSlug, channelId } = await params;
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
    include: {
      projects: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const { channel, error } = await getChannelDetails(channelId);

  if (error || !channel || channel.workspaceId !== workspace.id) {
    notFound();
  }

  const { messages = [] } = await getChannelMessages(channelId, { limit: 50 });

  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <DiscussionChannelView
        channel={channel as any}
        initialMessages={messages}
        currentUserId={user.id}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        projects={workspace.projects}
      />
    </div>
  );
}
