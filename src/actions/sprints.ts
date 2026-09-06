"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";
import { createSprintSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { z } from "zod";

export type CreateSprintInput = z.infer<typeof createSprintSchema>;

const SPRINT_SELECT = {
  id: true,
  projectId: true,
  name: true,
  number: true,
  goal: true,
  startDate: true,
  endDate: true,
  isActive: true,
  createdAt: true,
} as const;

/**
 * Lists sprints for a project with issue load metrics, plus the backlog
 * (issues not assigned to any sprint) for planning.
 */
export async function getProjectSprints(projectId: string) {
  const result = await requireProjectAccess(projectId, "VIEWER");
  const user = result.user;

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    include: {
      _count: { select: { issues: { where: { status: { notIn: ["DONE", "CANCELED"] } } } } },
      issues: {
        where: { status: { notIn: ["DONE", "CANCELED"] } },
        select: { estimate: true },
      },
    },
    orderBy: { number: "asc" },
  });
  void user;

  const backlogIssues = await prisma.issue.findMany({
    where: { projectId, sprintId: null },
    select: {
      id: true,
      projectKey: true,
      issueNumber: true,
      title: true,
      status: true,
      estimate: true,
    },
    orderBy: { order: "asc" },
  });

  const doneCount = await prisma.issue.count({
    where: { projectId, status: "DONE" },
  });

  const totalIssueCount = await prisma.issue.count({ where: { projectId } });

  return {
    sprints: sprints.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      number: s.number,
      goal: s.goal,
      startDate: s.startDate,
      endDate: s.endDate,
      isActive: s.isActive,
      createdAt: s.createdAt,
      openIssueCount: s._count.issues,
      openEstimate: s.issues.reduce((sum, i) => sum + (i.estimate || 0), 0),
    })),
    backlogIssues,
    doneCount,
    totalIssueCount,
  };
}

/**
 * Creates a sprint with the next sequential number.
 */
export async function createSprint(projectId: string, input: CreateSprintInput) {
  const { user, project } = await requireProjectAccess(projectId, "EDITOR");

  const parsed = createSprintSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const lastSprint = await prisma.sprint.findFirst({
    where: { projectId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const sprint = await prisma.sprint.create({
    data: {
      projectId,
      name: parsed.data.name,
      goal: parsed.data.goal || null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      number: (lastSprint?.number ?? 0) + 1,
    },
  });

  await prisma.activityLog.create({
    data: {
      workspaceId: project.workspaceId,
      actorId: user.id,
      action: "SPRINT_CREATED",
      details: { sprintId: sprint.id, name: sprint.name },
    },
  });

  broadcastProjectEvent({
    type: "SPRINT_CREATED",
    projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { sprint: { id: sprint.id, name: sprint.name, number: sprint.number } },
  });

  return { success: true, sprint };
}

/**
 * Starts a sprint (deactivating any other active sprint) or completes it
 * (moving unfinished issues back to the backlog).
 */
export async function setSprintActive(sprintId: string, isActive: boolean) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { project: true },
  });

  if (!sprint) return { error: "Sprint not found" };

  const { user } = await requireProjectAccess(sprint.projectId, "EDITOR");

  const updated = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.sprint.updateMany({
        where: { projectId: sprint.projectId, isActive: true, id: { not: sprint.id } },
        data: { isActive: false },
      });
    }

    const result = await tx.sprint.update({
      where: { id: sprintId },
      data: isActive ? { isActive: true } : { isActive: false, endDate: new Date() },
      select: SPRINT_SELECT,
    });

    // Completing a sprint pushes leftover issues back to the backlog
    if (!isActive) {
      await tx.issue.updateMany({
        where: { sprintId: sprint.id, status: { notIn: ["DONE", "CANCELED"] } },
        data: { sprintId: null },
      });
    }

    await tx.activityLog.create({
      data: {
        workspaceId: sprint.project.workspaceId,
        actorId: user.id,
        action: isActive ? "SPRINT_STARTED" : "SPRINT_COMPLETED",
        details: { sprintId: sprint.id, name: sprint.name },
      },
    });

    return result;
  });

  broadcastProjectEvent({
    type: "SPRINT_UPDATED",
    projectId: sprint.projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { sprintId: sprint.id, isActive },
  });

  return { success: true, sprint: updated };
}

/**
 * Updates sprint metadata (name, goal, dates).
 */
export async function updateSprint(sprintId: string, fields: { name?: string; goal?: string; startDate?: string; endDate?: string }) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { project: true },
  });
  if (!sprint) return { error: "Sprint not found" };

  const { user } = await requireProjectAccess(sprint.projectId, "EDITOR");

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.goal !== undefined && { goal: fields.goal || null }),
      ...(fields.startDate !== undefined && { startDate: new Date(fields.startDate) }),
      ...(fields.endDate !== undefined && { endDate: new Date(fields.endDate) }),
    },
    select: SPRINT_SELECT,
  });

  broadcastProjectEvent({
    type: "SPRINT_UPDATED",
    projectId: sprint.projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { sprintId: sprint.id },
  });

  return { success: true, sprint: updated };
}

/**
 * Deletes a sprint and unassigns all issues from it.
 */
export async function deleteSprint(sprintId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { project: true },
  });
  if (!sprint) return { error: "Sprint not found" };

  const { user } = await requireProjectAccess(sprint.projectId, "EDITOR");

  await prisma.$transaction(async (tx) => {
    await tx.issue.updateMany({
      where: { sprintId: sprint.id },
      data: { sprintId: null },
    });
    await tx.sprint.delete({ where: { id: sprintId } });
    await tx.activityLog.create({
      data: {
        workspaceId: sprint.project.workspaceId,
        actorId: user.id,
        action: "SPRINT_DELETED",
        details: { sprintId: sprint.id, name: sprint.name },
      },
    });
  });

  broadcastProjectEvent({
    type: "SPRINT_DELETED",
    projectId: sprint.projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { sprintId: sprint.id },
  });

  return { success: true };
}