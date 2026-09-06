import { NextResponse } from "next/server";
import { getProjectIssues } from "@/actions/issues";
// Using a direct Prisma query for create issue since we don't have a direct createIssue action that returns simple data
import { requireProjectAccess } from "@/lib/auth/session";
import { createIssueSchema } from "@/lib/validators";
import { prisma } from "@/lib/db/prisma";
import { broadcastProjectEvent } from "@/lib/realtime/events";

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const issues = await getProjectIssues(projectId);

    return NextResponse.json({ data: issues });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();

    const { user, projectRole } = await requireProjectAccess(projectId, "EDITOR");

    const parsed = createIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          issueSequence: { increment: 1 },
        },
        select: {
          issueSequence: true,
          key: true,
          workspaceId: true,
        },
      });

      const issue = await tx.issue.create({
        data: {
          projectId,
          projectKey: updatedProject.key,
          issueNumber: updatedProject.issueSequence,
          title: parsed.data.title,
          description: parsed.data.description,
          status: parsed.data.status,
          priority: parsed.data.priority,
          assigneeId: parsed.data.assigneeId || null,
          sprintId: parsed.data.sprintId || null,
          estimate: parsed.data.estimate || null,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          creatorId: user.id,
          labels: parsed.data.labelIds && parsed.data.labelIds.length > 0
            ? {
                connect: parsed.data.labelIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          labels: true,
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: updatedProject.workspaceId,
          issueId: issue.id,
          actorId: user.id,
          action: "ISSUE_CREATED",
          details: { title: issue.title },
        },
      });

      return issue;
    });

    broadcastProjectEvent({
      type: "ISSUE_CREATED",
      projectId,
      timestamp: Date.now(),
      actor: { id: user.id, name: user.name, email: user.email, image: user.image },
      data: { issue: result as any },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
