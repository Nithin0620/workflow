import { IssueStatus, IssuePriority } from "@prisma/client";
import type { StructuredFilter } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";
const TIMEOUT_MS = 5_000;

export interface WorkspaceContext {
  workspaceId: string;
  members: Array<{ userId: string; name: string | null }>;
  projectKeys: string[];
  labelNames: string[];
}

export interface ParseResult {
  success: boolean;
  filter?: StructuredFilter;
  confidenceScore?: number;
  assigneeCandidates?: string[];
  noAssigneeMatch?: boolean;
  errorType?: string;
}

/** Raw shape returned by the LLM */
interface LLMFilterOutput {
  confidenceScore?: number;
  status?: string[];
  priority?: string[];
  labels?: string[];
  assigneeNameToken?: string;
  projectKey?: string;
  sprintId?: string;
  dueBefore?: string;
  dueAfter?: string;
  updatedBefore?: string;
  updatedAfter?: string;
  createdBefore?: string;
  createdAfter?: string;
}

const VALID_STATUSES = new Set<string>(Object.values(IssueStatus));
const VALID_PRIORITIES = new Set<string>(Object.values(IssuePriority));

function isSafeDate(s: string | undefined | null): boolean {
  if (!s) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

/**
 * Calls the Groq LLM to parse an NL query into a StructuredFilter.
 * Falls back gracefully on any error, returning { success: false }.
 */
export async function parseNLQuery(
  query: string,
  context: WorkspaceContext,
  nowIso: string
): Promise<ParseResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    console.error("[nl-search] GROQ_API_KEY is not configured");
    return { success: false, errorType: "ConfigurationError" };
  }

  const systemPrompt = buildSystemPrompt(context, nowIso);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startMs = Date.now();

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Parse this search query into structured filters: "${query}"`,
          },
        ],
        temperature: 0,
        max_tokens: 512,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("[nl-search] LLM call failed", {
        errorType: "HTTPError",
        status: res.status,
        message: errBody?.error?.message ?? res.statusText,
        durationMs: Date.now() - startMs,
        workspaceId: context.workspaceId,
      });
      return { success: false, errorType: "HTTPError" };
    }

    const data = await res.json();
    const rawContent: string = data.choices?.[0]?.message?.content ?? "{}";

    // Extract JSON object from the content (model may wrap it in markdown fences)
    let raw: LLMFilterOutput = {};
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        raw = JSON.parse(jsonMatch[0]);
      }
    } catch {
      raw = {};
    }

    return buildParseResult(raw, context);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorType =
      err instanceof Error ? err.name : "UnknownError";
    console.error("[nl-search] LLM call failed", {
      errorType,
      durationMs: Date.now() - startMs,
      workspaceId: context.workspaceId,
    });
    return { success: false, errorType };
  }
}

function buildSystemPrompt(context: WorkspaceContext, nowIso: string): string {
  const memberList = context.members
    .filter((m) => m.name)
    .map((m) => m.name)
    .join(", ");

  const validStatuses = Object.values(IssueStatus).join(", ");
  const validPriorities = Object.values(IssuePriority).join(", ");
  const projectKeys = context.projectKeys.join(", ") || "(none)";
  const labelNames = context.labelNames.join(", ") || "(none)";

  return `You are a search query parser for a project management tool. Given a natural-language search query, extract structured filter predicates and return them as JSON.

Current UTC time: ${nowIso}

Workspace context:
- Team members: ${memberList || "(none)"}
- Project keys: ${projectKeys}
- Labels: ${labelNames}
- Valid statuses: ${validStatuses}
- Valid priorities: ${validPriorities}

Return ONLY a JSON object with these fields (omit any field you cannot confidently extract):
{
  "confidenceScore": 0.0 to 1.0,
  "status": [],
  "priority": [],
  "labels": [],
  "assigneeNameToken": "",
  "projectKey": "",
  "sprintId": "",
  "dueBefore": "",
  "dueAfter": "",
  "updatedBefore": "",
  "updatedAfter": "",
  "createdBefore": "",
  "createdAfter": ""
}

Rules:
- confidenceScore: 1.0 if all parts of the query map to known predicates; lower if ambiguous or partially understood; below 0.4 if the query is unrecognizable.
- status: array of valid IssueStatus values (${validStatuses})
- priority: array of valid IssuePriority values (${validPriorities})
- labels: array of label names from the workspace label list
- assigneeNameToken: the person's name token as typed (e.g. "Rahul", "me", "myself") — do NOT resolve to an ID
- projectKey: the project key if mentioned (e.g. "WEB", "API")
- All date/time values must be absolute ISO 8601 UTC strings computed from the current time above
- "this week" means updatedAfter = start of current Monday UTC; "last 7 days" means updatedAfter = 7 days ago
- "me" or "myself" or "I" as assignee → use the token "me" as assigneeNameToken
- If nothing can be extracted confidently, return {"confidenceScore": 0.0}`;
}

function buildParseResult(
  raw: LLMFilterOutput,
  context: WorkspaceContext
): ParseResult {
  const confidenceScore =
    typeof raw.confidenceScore === "number"
      ? Math.max(0, Math.min(1, raw.confidenceScore))
      : 0;

  const filter: StructuredFilter = {};

  // Status
  if (raw.status?.length) {
    const valid = raw.status.filter((s) => VALID_STATUSES.has(s)) as IssueStatus[];
    if (valid.length) filter.status = valid;
  }

  // Priority
  if (raw.priority?.length) {
    const valid = raw.priority.filter((p) => VALID_PRIORITIES.has(p)) as IssuePriority[];
    if (valid.length) filter.priority = valid;
  }

  // Labels — keep only those matching workspace labels (case-insensitive)
  if (raw.labels?.length) {
    const wsLabels = new Map(
      context.labelNames.map((l) => [l.toLowerCase(), l])
    );
    const matched = raw.labels
      .map((l) => wsLabels.get(l.toLowerCase()))
      .filter(Boolean) as string[];
    if (matched.length) filter.labels = matched;
  }

  // Project key
  if (
    raw.projectKey &&
    context.projectKeys
      .map((k) => k.toUpperCase())
      .includes(raw.projectKey.toUpperCase())
  ) {
    filter.projectKey = raw.projectKey.toUpperCase();
  }

  // Sprint
  if (raw.sprintId) filter.sprintId = raw.sprintId;

  // Date predicates
  if (isSafeDate(raw.dueBefore)) filter.dueBefore = raw.dueBefore!;
  if (isSafeDate(raw.dueAfter)) filter.dueAfter = raw.dueAfter!;
  if (isSafeDate(raw.updatedBefore)) filter.updatedBefore = raw.updatedBefore!;
  if (isSafeDate(raw.updatedAfter)) filter.updatedAfter = raw.updatedAfter!;
  if (isSafeDate(raw.createdBefore)) filter.createdBefore = raw.createdBefore!;
  if (isSafeDate(raw.createdAfter)) filter.createdAfter = raw.createdAfter!;

  // Assignee resolution
  const result: ParseResult = { success: true, filter, confidenceScore };
  const token = raw.assigneeNameToken?.trim();

  if (token) {
    // "me" / "myself" / "I" → will be resolved to the requesting user in the server action
    if (/^(me|myself|i)$/i.test(token)) {
      filter.assigneeId = "__CURRENT_USER__";
    } else {
      const lower = token.toLowerCase();
      const matches = context.members.filter((m) =>
        m.name?.toLowerCase().includes(lower)
      );

      if (matches.length === 1) {
        filter.assigneeId = matches[0].userId;
      } else if (matches.length > 1) {
        result.assigneeCandidates = matches
          .slice(0, 10)
          .map((m) => m.name ?? m.userId);
      } else {
        result.noAssigneeMatch = true;
      }
    }
  }

  return result;
}
