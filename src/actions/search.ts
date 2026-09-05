"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember } from "@/lib/auth/session";

export interface SearchResultItem {
  type: "issue" | "project";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  key?: string;
}

export async function searchWorkspace(
  workspaceId: string,
  query: string
): Promise<{ success: boolean; results: SearchResultItem[] }> {
  if (!query || !query.trim()) {
    return { success: true, results: [] };
  }

  const { workspace } = await requireWorkspaceMember(workspaceId);
  const cleanQuery = query.trim();

  // Search projects
  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { key: { contains: cleanQuery.toUpperCase() } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
      ],
    },
    take: 5,
  });

  // Search issues
  const issues = await prisma.issue.findMany({
    where: {
      project: { workspaceId },
      OR: [
        { title: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
        { projectKey: { contains: cleanQuery.toUpperCase() } },
      ],
    },
    include: {
      project: true,
    },
    take: 8,
  });

  const projectResults: SearchResultItem[] = projects.map((p) => ({
    type: "project",
    id: p.id,
    title: p.name,
    subtitle: `Project (${p.key})`,
    href: `/projects/${p.key}/board`,
    key: p.key,
  }));

  const issueResults: SearchResultItem[] = issues.map((i) => ({
    type: "issue",
    id: i.id,
    title: i.title,
    subtitle: `${i.projectKey}-${i.issueNumber} • ${i.status}`,
    href: `/projects/${i.project.key}/board`,
    key: `${i.projectKey}-${i.issueNumber}`,
  }));

  return {
    success: true,
    results: [...projectResults, ...issueResults],
  };
}
