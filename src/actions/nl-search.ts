"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember } from "@/lib/auth/session";
import { searchWorkspace } from "@/actions/search";
import { isNLQuery, buildFilterSummary, type NLSearchResponse } from "@/lib/nl-search/types";
import { parseNLQuery } from "@/lib/nl-search/nl-parser";
import { executeStructuredFilter } from "@/lib/nl-search/filter-executor";
import { checkRateLimit } from "@/lib/nl-search/rate-limiter";
import { getCached, setCached } from "@/lib/nl-search/cache";

/**
 * Natural-language search server action.
 * Routes NL queries through the AI parser and executes the resulting structured filter.
 * Falls back to keyword search on any error, low confidence, or rate-limit.
 *
 * @param workspaceId - derived from the authenticated session (not trusted from client)
 * @param query       - the raw user query string
 * @param nowIso      - optional server clock override for testing determinism
 */
export async function nlSearch(
  workspaceId: string,
  query: string,
  nowIso?: string
): Promise<NLSearchResponse> {
  // Guard: only valid NL queries should reach here, but double-check
  if (!isNLQuery(query)) {
    return { success: true, mode: "empty", results: [] };
  }

  // Step 1: Authorization — derives userId from server-side session
  const { user } = await requireWorkspaceMember(workspaceId);
  const userId = user.id;

  // Step 2: Rate limit check
  const { allowed } = checkRateLimit(userId, workspaceId);
  if (!allowed) {
    const fallback = await searchWorkspace(workspaceId, query);
    return {
      success: true,
      mode: "keyword",
      results: fallback.results,
      fallbackReason: "rate_limit",
      fallbackMessage: "Search limit reached — using keyword search",
    };
  }

  // Step 3: Cache check
  const cached = getCached(workspaceId, query);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Step 4: Fetch workspace context in parallel
  const [members, projects, labels] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.project.findMany({
      where: { workspaceId },
      select: { key: true, name: true },
    }),
    prisma.label.findMany({
      where: { workspaceId },
      select: { name: true },
    }),
  ]);

  const memberList = members.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
  }));

  const context = {
    workspaceId,
    members: memberList,
    projectKeys: projects.map((p) => p.key),
    labelNames: labels.map((l) => l.name),
  };

  // Step 5: Parse with LLM
  const parseResult = await parseNLQuery(
    query,
    context,
    nowIso ?? new Date().toISOString()
  );

  // Step 6: Fallback on parse failure or low confidence
  if (
    !parseResult.success ||
    (parseResult.confidenceScore !== undefined &&
      parseResult.confidenceScore < 0.4)
  ) {
    const fallback = await searchWorkspace(workspaceId, query);
    const fallbackReason = !parseResult.success
      ? ("llm_error" as const)
      : ("low_confidence" as const);
    const fallbackMessage =
      fallbackReason === "llm_error"
        ? "AI search unavailable — showing keyword results"
        : "Couldn't understand query — showing keyword results";

    return {
      success: true,
      mode: "keyword",
      results: fallback.results,
      fallbackReason,
      fallbackMessage,
    };
  }

  const filter = parseResult.filter!;

  // Resolve __CURRENT_USER__ placeholder
  if (filter.assigneeId === "__CURRENT_USER__") {
    filter.assigneeId = userId;
  }

  // Step 7: Execute structured filter
  const results = await executeStructuredFilter(filter, workspaceId, userId);

  // Step 8: Build member names map for summary
  const memberNamesMap = new Map<string, string>(
    memberList
      .filter((m) => m.name)
      .map((m) => [m.userId, m.name as string])
  );

  const filterSummary = buildFilterSummary(filter, memberNamesMap);

  // Build response
  const response: NLSearchResponse = {
    success: true,
    mode: "nl",
    results,
    filter,
    filterSummary: filterSummary || undefined,
    confidenceScore: parseResult.confidenceScore,
    assigneeCandidates: parseResult.assigneeCandidates,
    noAssigneeMatch: parseResult.noAssigneeMatch,
  };

  // Add contextual notices for assignee issues
  if (parseResult.assigneeCandidates?.length) {
    response.fallbackMessage = `Multiple people match that name — assignee filter was skipped`;
  } else if (parseResult.noAssigneeMatch) {
    response.fallbackMessage = `That person wasn't found in the workspace — assignee filter was skipped`;
  }

  // Step 9: Cache the result
  setCached(workspaceId, query, response);

  return response;
}
