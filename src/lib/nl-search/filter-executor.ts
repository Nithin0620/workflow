import { prisma } from "@/lib/db/prisma";
import type { StructuredFilter } from "./types";
import type { SearchResultItem } from "@/actions/search";

/**
 * Checks whether a StructuredFilter has at least one present predicate.
 * A predicate is "present" if it is not null, undefined, or an empty array.
 */
export function hasAnyPredicate(filter: StructuredFilter): boolean {
  return Object.entries(filter).some(([, v]) => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

/**
 * Translates a StructuredFilter into a Prisma query and returns matching issues
 * as SearchResultItems (max 15, ordered by updatedAt desc).
 *
 * Always scoped to workspaceId from the server session.
 * Private projects are silently excluded unless the user is an explicit ProjectMember.
 */
export async function executeStructuredFilter(
  filter: StructuredFilter,
  workspaceId: string,
  userId: string
): Promise<SearchResultItem[]> {
  if (!hasAnyPredicate(filter)) {
    return [];
  }

  // Build date-range conditions
  const dueConditions: Record<string, Date> = {};
  if (filter.dueAfter && isValidDate(filter.dueAfter)) {
    dueConditions.gte = new Date(filter.dueAfter);
  }
  if (filter.dueBefore && isValidDate(filter.dueBefore)) {
    dueConditions.lte = new Date(filter.dueBefore);
  }

  const updatedConditions: Record<string, Date> = {};
  if (filter.updatedAfter && isValidDate(filter.updatedAfter)) {
    updatedConditions.gte = new Date(filter.updatedAfter);
  }
  if (filter.updatedBefore && isValidDate(filter.updatedBefore)) {
    updatedConditions.lte = new Date(filter.updatedBefore);
  }

  const createdConditions: Record<string, Date> = {};
  if (filter.createdAfter && isValidDate(filter.createdAfter)) {
    createdConditions.gte = new Date(filter.createdAfter);
  }
  if (filter.createdBefore && isValidDate(filter.createdBefore)) {
    createdConditions.lte = new Date(filter.createdBefore);
  }

  const issues = await prisma.issue.findMany({
    where: {
      project: {
        workspaceId,
        ...(filter.projectKey ? { key: filter.projectKey } : {}),
        // Private-project exclusion: silently exclude private projects
        // unless the user is an explicit ProjectMember
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: { some: { userId } },
          },
        ],
      },
      ...(filter.status?.length ? { status: { in: filter.status } } : {}),
      ...(filter.priority?.length ? { priority: { in: filter.priority } } : {}),
      ...(filter.assigneeId ? { assigneeId: filter.assigneeId } : {}),
      ...(filter.sprintId ? { sprintId: filter.sprintId } : {}),
      // Labels: use "some" for Prisma, then post-filter for ALL semantics
      ...(filter.labels?.length
        ? {
            labels: {
              some: {
                name: { in: filter.labels, mode: "insensitive" as const },
              },
            },
          }
        : {}),
      ...(Object.keys(dueConditions).length
        ? { dueDate: dueConditions }
        : {}),
      ...(Object.keys(updatedConditions).length
        ? { updatedAt: updatedConditions }
        : {}),
      ...(Object.keys(createdConditions).length
        ? { createdAt: createdConditions }
        : {}),
    },
    include: { project: true, labels: true },
    orderBy: { updatedAt: "desc" },
    // Fetch extra to account for post-filter label pruning, then slice to 15
    take: filter.labels?.length ? 60 : 15,
  });

  // Post-filter: ALL-labels semantics (issue must have ALL requested labels)
  let filtered = issues;
  if (filter.labels?.length) {
    const requestedLower = filter.labels.map((l) => l.toLowerCase());
    filtered = issues.filter((issue) => {
      const issueLabelNames = issue.labels.map((l: { name: string }) =>
        l.name.toLowerCase()
      );
      return requestedLower.every((req) => issueLabelNames.includes(req));
    });
  }

  return filtered.slice(0, 15).map((issue) => ({
    type: "issue" as const,
    id: issue.id,
    title: issue.title,
    subtitle: `${issue.projectKey}-${issue.issueNumber} • ${issue.status}`,
    href: `/projects/${issue.project.key}/board`,
    key: `${issue.projectKey}-${issue.issueNumber}`,
  }));
}

function isValidDate(s: string): boolean {
  return !isNaN(new Date(s).getTime());
}
