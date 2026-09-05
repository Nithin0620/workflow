import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { KanbanBoard } from "@/components/issues/kanban-board";

interface BoardPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
    projectKey: string;
  }>;
}

export default async function ProjectBoardPage({ params }: BoardPageProps) {
  const { orgSlug, workspaceSlug, projectKey } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const project = await prisma.project.findFirst({
    where: {
      key: projectKey.toUpperCase(),
      workspace: {
        slug: workspaceSlug,
        organization: { slug: orgSlug },
      },
    },
    include: {
      issues: {
        include: {
          assignee: { select: { id: true, name: true, image: true, email: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="h-full">
      <KanbanBoard
        projectId={project.id}
        projectKey={project.key}
        projectName={project.name}
        initialIssues={project.issues}
      />
    </div>
  );
}
