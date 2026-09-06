import { getCurrentUser, requireProjectAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { KanbanBoard } from "@/components/issues/kanban-board";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { ISSUE_STATUSES } from "@/lib/constants";

interface BoardPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
    projectKey: string;
  }>;
}

export default async function ProjectBoardPage({ params }: BoardPageProps) {
  const { orgSlug, workspaceSlug, projectKey } = await params;

  // Auth + project data are independent — fire in parallel (one remote DB round-trip, not serial)
  const [user, project] = await Promise.all([
    getCurrentUser(),
    prisma.project.findFirst({
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
        banners: {
          select: { id: true, imageUrl: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
  ]);

  if (!user) redirect("/login");

  if (!project) {
    notFound();
  }

  // Role, columns, and repository are independent — run in parallel.
  // requireProjectAccess reuses the cached getCurrentUser (single user query).
  const [access, columns, repo] = await Promise.all([
    requireProjectAccess(project.id).catch(() => null),
    getBoardColumns(project.id),
    prisma.projectRepository
      ? prisma.projectRepository.findUnique({ where: { projectId: project.id } }).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Determine user's role on this project (OWNER, EDITOR, VIEWER)
  const userRole = access?.projectRole ?? "VIEWER";

  return (
    <div className="flex h-full flex-col">
      <OnboardingTour tourId="board" />
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
        banners={project.banners}
        initialRepository={
          repo
            ? {
                id: repo.id,
                projectId: repo.projectId,
                repoUrl: repo.repoUrl,
                repoOwner: repo.repoOwner,
                repoName: repo.repoName,
                defaultBranch: repo.defaultBranch,
                hasToken: !!repo.accessToken,
                maskedToken: repo.accessToken
                  ? `${repo.accessToken.slice(0, 4)}••••${repo.accessToken.slice(-4)}`
                  : null,
                aiScanEnabled: repo.aiScanEnabled,
                cronSchedule: repo.cronSchedule,
                lastScannedAt: repo.lastScannedAt,
                status: repo.status,
              }
            : null
        }
      />
    </div>
  );
}

async function getBoardColumns(projectId: string) {
  let columns = await prisma.boardColumn.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  if (columns.length === 0) {
    await prisma.boardColumn.createMany({
      data: ISSUE_STATUSES.map((status, index) => ({
        projectId,
        name: status.label,
        key: status.id,
        color: "#737373",
        order: index * 1000,
      })),
      skipDuplicates: true,
    });

    columns = await prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
  }

  return columns;
}
