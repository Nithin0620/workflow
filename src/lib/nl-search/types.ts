import { IssueStatus, IssuePriority } from "@prisma/client";
import type { SearchResultItem } from "@/actions/search";

export interface StructuredFilter {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  labels?: string[];
  assigneeId?: string;
  projectKey?: string;
  sprintId?: string;
  dueBefore?: string;
  dueAfter?: string;
  updatedBefore?: string;
  updatedAfter?: string;
  createdBefore?: string;
  createdAfter?: string;
}

export interface NLSearchResponse {
  success: boolean;
  mode: "nl" | "keyword" | "empty";
  results: SearchResultItem[];
  filter?: StructuredFilter;
  filterSummary?: string;
  confidenceScore?: number;
  fallbackReason?: "low_confidence" | "llm_error" | "rate_limit" | "empty_filter";
  fallbackMessage?: string;
  assigneeCandidates?: string[];
  noAssigneeMatch?: boolean;
  cached?: boolean;
}

const FILTER_FIELD_PATTERN = /\b(status|priority|label|assignee|project|sprint):[^\s]+/i;

/**
 * Returns true if the query should be routed to the AI parser.
 * Returns false for short queries (< 10 chars) or structured field:value syntax.
 */
export function isNLQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 10) return false;
  if (FILTER_FIELD_PATTERN.test(trimmed)) return false;
  return true;
}

/**
 * Builds a human-readable summary string from a StructuredFilter.
 * Dates are formatted as YYYY-MM-DD. AssigneeId is resolved to a display name via memberNames.
 */
export function buildFilterSummary(
  filter: StructuredFilter,
  memberNames: Map<string, string>
): string {
  const parts: string[] = [];

  if (filter.status?.length) {
    parts.push(`status = ${filter.status.join(", ")}`);
  }
  if (filter.priority?.length) {
    parts.push(`priority = ${filter.priority.join(", ")}`);
  }
  if (filter.assigneeId) {
    const name = memberNames.get(filter.assigneeId) ?? filter.assigneeId;
    parts.push(`assignee = ${name}`);
  }
  if (filter.labels?.length) {
    parts.push(`labels = ${filter.labels.join(", ")}`);
  }
  if (filter.projectKey) {
    parts.push(`project = ${filter.projectKey}`);
  }
  if (filter.sprintId) {
    parts.push(`sprint = ${filter.sprintId}`);
  }
  if (filter.dueAfter) {
    parts.push(`due after ${filter.dueAfter.slice(0, 10)}`);
  }
  if (filter.dueBefore) {
    parts.push(`due before ${filter.dueBefore.slice(0, 10)}`);
  }
  if (filter.updatedAfter) {
    parts.push(`updated after ${filter.updatedAfter.slice(0, 10)}`);
  }
  if (filter.updatedBefore) {
    parts.push(`updated before ${filter.updatedBefore.slice(0, 10)}`);
  }
  if (filter.createdAfter) {
    parts.push(`created after ${filter.createdAfter.slice(0, 10)}`);
  }
  if (filter.createdBefore) {
    parts.push(`created before ${filter.createdBefore.slice(0, 10)}`);
  }

  return parts.join(", ");
}
