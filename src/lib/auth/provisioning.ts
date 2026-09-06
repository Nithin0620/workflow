import { PrismaClient } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { defaultBannerUrls } from "@/lib/banners";

type PrismaTx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Ensures any new user (Credentials or OAuth) has a default Organization,
 * Workspace, and a Starter Project with realistic Kanban demo issues
 * that they fully own and can modify or delete anytime.
 */
export async function provisionDefaultUserWorkspace(
  tx: PrismaTx,
  user: { id: string; name?: string | null; email?: string | null }
) {
  const userName = user.name || user.email?.split("@")[0] || "My Team";
  const orgSlug = `${slugify(userName)}-org-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Create Organization
  const org = await tx.organization.create({
    data: {
      name: `${userName}'s Organization`,
      slug: orgSlug,
      ownerId: user.id,
    },
  });

  // 2. Create Default Workspace
  const workspace = await tx.workspace.create({
    data: {
      name: "Engineering Space",
      slug: "engineering",
      description: "Default collaborative engineering workspace",
      organizationId: org.id,
      banners: { create: defaultBannerUrls() },
    },
  });

  // 3. Assign OWNER role
  await tx.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  // 4. Create Starter Project
  const project = await tx.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Starter Project",
      key: "DEMO",
      description: "Interactive starter project showcasing Kanban workflow, fractional reordering, and markdown discussions. You can edit, drag, or delete any of these items.",
      color: "#000000",
      icon: "FolderKanban",
      leadId: user.id,
      issueSequence: 4,
      banners: { create: defaultBannerUrls() },
    },
  });

  // 5. Populate Realistic Starter Issues across Kanban stages
  const issues = [
    {
      projectId: project.id,
      projectKey: project.key,
      issueNumber: 1,
      title: "👋 Welcome to Workflow — Read quick start guide",
      description: `### Welcome to your new workspace!\n\nThis is a sample ticket to help you get familiar with Workflow.\n\n- **Drag & Drop**: Move this card across columns (To Do, In Progress, Done).\n- **Properties**: Click to open details, change priority, or assign story points.\n- **Keyboard Speed**: Press \`⌘K\` or \`Ctrl+K\` to open the command palette.\n\n> *Feel free to delete or edit this issue whenever you want!*`,
      status: "DONE" as const,
      priority: "LOW" as const,
      order: 1000.0,
      creatorId: user.id,
      assigneeId: user.id,
      estimate: 1,
    },
    {
      projectId: project.id,
      projectKey: project.key,
      issueNumber: 2,
      title: "⚡ Set up your first real engineering project",
      description: `Create a dedicated project for your actual app or team:\n\n1. Click **+ New Project** in the sidebar.\n2. Choose a project prefix key (e.g. \`API\`, \`WEB\`, \`APP\`).\n3. Start adding your team's real backlog items.`,
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      order: 2000.0,
      creatorId: user.id,
      assigneeId: user.id,
      estimate: 3,
    },
    {
      projectId: project.id,
      projectKey: project.key,
      issueNumber: 3,
      title: "👥 Invite your team members to collaborate",
      description: `Go to **Settings & Team** in the sidebar to invite teammates with precise roles (\`OWNER\`, \`ADMIN\`, \`MEMBER\`, \`VIEWER\`).`,
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      order: 3000.0,
      creatorId: user.id,
      assigneeId: null,
      estimate: 2,
    },
    {
      projectId: project.id,
      projectKey: project.key,
      issueNumber: 4,
      title: "🚀 Configure CI/CD pipeline and deployment targets",
      description: `Sample backlog ticket showing how stories and bug tickets can be prioritized with estimates and due dates.`,
      status: "BACKLOG" as const,
      priority: "URGENT" as const,
      order: 4000.0,
      creatorId: user.id,
      assigneeId: null,
      estimate: 5,
    },
  ];

  for (const issueData of issues) {
    const createdIssue = await tx.issue.create({
      data: issueData,
    });

    // Add a welcome comment on the first issue
    if (issueData.issueNumber === 1) {
      await tx.comment.create({
        data: {
          issueId: createdIssue.id,
          authorId: user.id,
          content: "Welcome aboard! Let us know if you need anything via the **Contact & Enquiry** page.",
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: workspace.id,
          issueId: createdIssue.id,
          actorId: user.id,
          action: "CREATED",
          details: { message: "Initial starter issue generated." },
        },
      });
    }
  }

  return { org, workspace, project };
}
