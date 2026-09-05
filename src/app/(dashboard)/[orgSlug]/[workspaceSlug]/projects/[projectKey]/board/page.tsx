import { getCurrentUser, requireProjectAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { KanbanBoard } from "@/components/issues/kanban-board";
import { getProjectColumns } from "@/actions/columns";

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

  // Determine user's role on this project (OWNER, EDITOR, VIEWER)
  let userRole = "EDITOR";
  try {
    const access = await requireProjectAccess(project.id);
    userRole = access.projectRole;
  } catch {
    userRole = "VIEWER";
  }

  // Fetch or initialize project columns
  const columns = await getProjectColumns(project.id);

  return (
    <div className="h-full">
      <KanbanBoard
        projectId={project.id}
        projectKey={project.key}
        projectName={project.name}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        userRole={userRole}
        currentUserId={user.id}
        initialColumns={columns}
        initialIssues={project.issues}
      />
    </div>
  );
}
