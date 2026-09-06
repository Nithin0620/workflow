import type { StructuredFilter } from "./types";
import { IssueStatus, IssuePriority } from "@prisma/client";

// Array fields that need comma-separated serialization
const ARRAY_FIELDS: (keyof StructuredFilter)[] = ["status", "priority", "labels"];

// Scalar string fields
const SCALAR_FIELDS: (keyof StructuredFilter)[] = [
  "assigneeId",
  "projectKey",
  "sprintId",
  "dueBefore",
  "dueAfter",
  "updatedBefore",
  "updatedAfter",
  "createdBefore",
  "createdAfter",
];

/**
 * Produces a stable, deterministic, human-readable string from a StructuredFilter.
 * Keys are sorted alphabetically; array values are sorted; absent/null/empty fields are omitted.
 *
 * Example: "assigneeId=abc labels=backend,bug priority=HIGH status=OPEN,DONE"
 */
export function serializeFilter(f: StructuredFilter): string {
  const parts: string[] = [];

  // Collect all fields in sorted order
  const allFields: (keyof StructuredFilter)[] = [...ARRAY_FIELDS, ...SCALAR_FIELDS].sort();

  for (const key of allFields) {
    const val = f[key];
    if (val === null || val === undefined) continue;

    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      const sorted = [...val].sort();
      parts.push(`${key}=${sorted.join(",")}`);
    } else if (typeof val === "string" && val.length > 0) {
      parts.push(`${key}=${val}`);
    }
  }

  return parts.join(" ");
}

/**
 * Parses the string produced by serializeFilter back into a StructuredFilter.
 * Does not call the LLM.
 */
export function deserializeFilter(s: string): StructuredFilter {
  if (!s || !s.trim()) return {};

  const filter: StructuredFilter = {};

  const tokens = s.trim().split(/\s+/);
  for (const token of tokens) {
    const eqIdx = token.indexOf("=");
    if (eqIdx === -1) continue;

    const key = token.slice(0, eqIdx) as keyof StructuredFilter;
    const raw = token.slice(eqIdx + 1);

    if (!raw) continue;

    if (ARRAY_FIELDS.includes(key)) {
      const values = raw.split(",").filter(Boolean);
      if (key === "status") {
        filter.status = values as IssueStatus[];
      } else if (key === "priority") {
        filter.priority = values as IssuePriority[];
      } else if (key === "labels") {
        filter.labels = values;
      }
    } else if (SCALAR_FIELDS.includes(key)) {
      (filter as Record<string, string>)[key] = raw;
    }
  }

  return filter;
}
