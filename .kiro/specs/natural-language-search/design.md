# Design Document: Natural-Language Search

## Overview

This document describes the technical design for adding natural-language search to the ⌘K Command Palette. Users type a plain-English sentence; the system calls an LLM to parse it into a `StructuredFilter` object; the existing Prisma query layer executes the filter and returns matching issues. The existing keyword-search path is fully preserved and used as a fallback throughout.

---

## Architecture

```
CommandPalette (client)
  │
  ├── isNLQuery() ──── < 10 chars or field:value ──► searchWorkspace() [existing]
  │
  └── ≥ 10 chars, no field:value tokens
        │  400 ms debounce
        ▼
  nlSearch() [new Server Action]
        │
        ├── requireWorkspaceMember()    ← authorization guard
        ├── checkRateLimit()            ← 30 req / 60 s per user
        ├── checkCache()                ← 60 s in-memory cache
        │
        └── parseNLQuery() [AI_Parser]
              │
              ├── fetch workspace context  (members, project keys, labels)
              ├── call Groq API (temperature=0, 5 000 ms timeout, JSON mode)
              │
              ├── confidenceScore < 0.4 ──► fallback to searchWorkspace()
              │
              └── executeStructuredFilter() [Filter_Executor]
                    │
                    └── Prisma query → Issue[] (max 15, ordered updatedAt desc)
```

---

## New Files

| Path | Purpose |
|---|---|
| `src/lib/nl-search/types.ts` | `StructuredFilter` type, `NLSearchResponse` type |
| `src/lib/nl-search/filter-serializer.ts` | `serializeFilter` / `deserializeFilter` |
| `src/lib/nl-search/nl-parser.ts` | `parseNLQuery()` — LLM call & response parsing |
| `src/lib/nl-search/filter-executor.ts` | `executeStructuredFilter()` — Prisma query builder |
| `src/lib/nl-search/rate-limiter.ts` | Per-user rolling 60 s request counter |
| `src/lib/nl-search/cache.ts` | 60 s in-memory NL query result cache |
| `src/actions/nl-search.ts` | `nlSearch()` server action (public entry point) |

### Modified Files

| Path | Change |
|---|---|
| `src/components/common/command-palette.tsx` | Add NL routing, AI indicator, filter summary, "Smart Search" section, Escape/Clear-filter UX |

---

## Data Models

### `StructuredFilter`

```typescript
// src/lib/nl-search/types.ts

import { IssueStatus, IssuePriority } from "@prisma/client";

export interface StructuredFilter {
  status?:         IssueStatus[];
  priority?:       IssuePriority[];
  labels?:         string[];        // label names (case-insensitive matched at query time)
  assigneeId?:     string;          // resolved userId
  projectKey?:     string;
  sprintId?:       string;
  dueBefore?:      string;          // ISO 8601 UTC
  dueAfter?:       string;
  updatedBefore?:  string;
  updatedAfter?:   string;
  createdBefore?:  string;
  createdAfter?:   string;
}

export interface NLSearchResponse {
  success:             boolean;
  mode:                "nl" | "keyword" | "empty";
  results:             import("@/actions/search").SearchResultItem[];
  filter?:             StructuredFilter;
  filterSummary?:      string;          // human-readable, e.g. "status = OPEN, priority = HIGH"
  confidenceScore?:    number;
  fallbackReason?:     "low_confidence" | "llm_error" | "rate_limit" | "empty_filter";
  fallbackMessage?:    string;          // shown in the palette
  assigneeCandidates?: string[];        // when assignee name is ambiguous
  noAssigneeMatch?:    boolean;
  cached?:             boolean;
}
```

---

## Component: `isNLQuery` (routing logic)

```typescript
// src/lib/nl-search/types.ts (or inline in the action)

const FILTER_FIELD_PATTERN = /\b(status|priority|label|assignee|project|sprint):[^\s]+/i;

export function isNLQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 10) return false;
  if (FILTER_FIELD_PATTERN.test(trimmed)) return false;
  return true;
}
```

---

## Server Action: `nlSearch`

```typescript
// src/actions/nl-search.ts
"use server";

export async function nlSearch(
  workspaceId: string,
  query: string,
  nowIso?: string        // server clock injected for testability; defaults to new Date().toISOString()
): Promise<NLSearchResponse>
```

**Flow:**

1. `requireWorkspaceMember(workspaceId)` — throws on 403.
2. `checkRateLimit(userId, workspaceId)` — returns `{ allowed: boolean }`.  
   If `!allowed`, call `searchWorkspace()` and return `mode: "keyword"` with `fallbackReason: "rate_limit"`.
3. `checkCache(workspaceId, query)` — returns cached `NLSearchResponse | null`.  
   If hit, return with `cached: true` (no AI indicator shown on client).
4. Fetch workspace context in parallel:
   - `WorkspaceMember` records with `user.name` and `user.id`
   - `Project` records: `{ key, name }`
   - `Label` records: `{ name }`
5. Call `parseNLQuery(query, context, nowIso)`.
6. If `confidenceScore < 0.4` or parse error → `searchWorkspace()` fallback.
7. `executeStructuredFilter(filter, workspaceId, userId)`.
8. Build `filterSummary` string.
9. Store result in cache.
10. Return `NLSearchResponse`.

---

## Component: `parseNLQuery` (AI_Parser)

### LLM Call

The codebase already calls Groq via raw `fetch` to `https://api.groq.com/openai/v1/chat/completions`. This design follows the same pattern.

- **Model**: `llama-3.3-70b-versatile` (or `openai/gpt-oss-120b` per existing convention)
- **Temperature**: `0` (determinism)
- **Timeout**: 5 000 ms via `AbortController`
- **Response format**: `response_format: { type: "json_object" }`

### System Prompt Contract

The prompt instructs the model to return a JSON object matching this schema:

```json
{
  "confidenceScore": 0.0,
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
```

The model is given:
- Current UTC timestamp (for anchoring relative dates to absolute ISO strings)
- Workspace member names (for `assigneeNameToken` extraction only — resolution is done server-side)
- Project keys
- Label names

### Assignee Resolution (server-side)

After receiving `assigneeNameToken` from the LLM, the server resolves it:

```
members.filter(m => m.user.name?.toLowerCase().includes(token.toLowerCase().trim()))
```

- 0 matches → omit `assigneeId`, set `noAssigneeMatch: true`
- 1 match → set `assigneeId`
- 2+ matches → omit `assigneeId`, set `assigneeCandidates` (max 10)

### Timeout & Error Handling

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch(GROQ_URL, { ..., signal: controller.signal });
  // ...
} catch (err) {
  // log server-side: { errorType, durationMs }
  // return { success: false } → caller falls back to searchWorkspace()
} finally {
  clearTimeout(timeoutId);
}
```

---

## Component: `executeStructuredFilter` (Filter_Executor)

```typescript
// src/lib/nl-search/filter-executor.ts

export async function executeStructuredFilter(
  filter: StructuredFilter,
  workspaceId: string,
  userId: string
): Promise<SearchResultItem[]>
```

### Empty-filter guard

```typescript
const hasPredicates = Object.entries(filter).some(([, v]) =>
  v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
);
if (!hasPredicates) return [];
```

### Prisma query structure

```typescript
const issues = await prisma.issue.findMany({
  where: {
    project: {
      workspaceId,                         // always enforced
      ...(filter.projectKey && { key: filter.projectKey }),
      // private-project exclusion:
      OR: [
        { isPrivate: false },
        { isPrivate: true, members: { some: { userId } } },
      ],
    },
    ...(filter.status?.length    && { status:   { in: filter.status } }),
    ...(filter.priority?.length  && { priority: { in: filter.priority } }),
    ...(filter.assigneeId        && { assigneeId: filter.assigneeId }),
    ...(filter.sprintId          && { sprintId:   filter.sprintId }),
    ...(filter.labels?.length    && {
      labels: { every: { name: { in: filter.labels, mode: "insensitive" } } },
      // "every" is approximated; see note below
    }),
    // Date predicates (inclusive bounds via gte/lte)
    ...(filter.dueAfter    && { dueDate:   { gte: new Date(filter.dueAfter) } }),
    ...(filter.dueBefore   && { dueDate:   { lte: new Date(filter.dueBefore) } }),
    ...(filter.updatedAfter  && { updatedAt: { gte: new Date(filter.updatedAfter) } }),
    ...(filter.updatedBefore && { updatedAt: { lte: new Date(filter.updatedBefore) } }),
    ...(filter.createdAfter  && { createdAt: { gte: new Date(filter.createdAfter) } }),
    ...(filter.createdBefore && { createdAt: { lte: new Date(filter.createdBefore) } }),
  },
  include: { project: true },
  orderBy: { updatedAt: "desc" },
  take: 15,
});
```

> **Labels "ALL" semantics**: Prisma does not natively support "issue has ALL of these labels". The executor uses a two-pass approach: run the Prisma query with `some: { name: { in: labels } }` then post-filter in-memory to keep only issues whose label name-set is a superset of the requested labels. Because the result cap is 15 and labels are small arrays, this is safe.

---

## Component: `serializeFilter` / `deserializeFilter`

```typescript
// src/lib/nl-search/filter-serializer.ts

/**
 * Produces a stable, human-readable summary string, e.g.:
 * "status=OPEN,DONE priority=HIGH assignee=cm1abc labels=backend,bug updatedAfter=2025-01-01T00:00:00Z"
 * Keys are sorted alphabetically; array values are sorted; missing keys are omitted.
 */
export function serializeFilter(f: StructuredFilter): string

/**
 * Parses the string produced by serializeFilter back into a StructuredFilter.
 * Does not call the LLM.
 */
export function deserializeFilter(s: string): StructuredFilter
```

The serialization format is deterministic (sorted keys, sorted values) so that `deserializeFilter(serializeFilter(f))` is guaranteed to round-trip all 12 predicates.

---

## Component: Rate Limiter

```typescript
// src/lib/nl-search/rate-limiter.ts

// In-memory store: Map<`${userId}:${workspaceId}`, { count: number; windowStart: number }>
// Rolling window: if Date.now() - windowStart > 60_000, reset count = 0
// Limit: 30 requests per window

export function checkRateLimit(userId: string, workspaceId: string): { allowed: boolean }
```

> For a production multi-instance deployment this would be backed by Redis. For the current single-process Next.js deployment, in-memory is sufficient and matches the existing pattern used by other non-critical in-process state.

---

## Component: Cache

```typescript
// src/lib/nl-search/cache.ts

// Key: `${workspaceId}:${query.toLowerCase().trim()}`
// Value: { response: NLSearchResponse; expiresAt: number }

export function getCached(workspaceId: string, query: string): NLSearchResponse | null
export function setCached(workspaceId: string, query: string, response: NLSearchResponse): void
```

TTL: 60 000 ms. Same in-memory trade-off as rate limiter.

---

## Command Palette Changes

### Routing

```typescript
// Current debounce: 200 ms → change to 400 ms for NL path
const debounceMs = isNLQuery(query) ? 400 : 200;
```

### State additions

```typescript
const [nlResponse, setNlResponse] = useState<NLSearchResponse | null>(null);
const [isNLPending, setIsNLPending] = useState(false);
```

### AI processing indicator

Shown inside the search bar (alongside existing `Loader2`) only while `isNLPending === true`. A pulsing `Sparkles` icon or a badge labeled "AI" distinguishes it from the keyword-search spinner.

### Filter summary bar

Rendered between the search input and the result list when `nlResponse?.filterSummary` is set:

```
┌────────────────────────────────────────────────────────┐
│ Showing: status = OPEN, priority = HIGH, assignee = Rahul  [Clear ×] │
└────────────────────────────────────────────────────────┘
```

### Section headings

- NL results: **"Smart Search"** heading
- Keyword results (fallback): existing **"Matching Issues & Projects"** heading
- Both sections can appear at the same time only when the NL result is a fallback displaying keyword results alongside a fallback notice

### Escape key — progressive dismiss

```
First Escape (filter summary visible) → clear filter + summary, keep palette open, preserve input text
Second Escape → close palette
```

This is implemented by tracking `hasActiveFilter: boolean` state.

### Fallback notices (inline, non-blocking)

| Scenario | Message |
|---|---|
| `confidenceScore < 0.4` | "Couldn't understand query — showing keyword results" |
| LLM error / timeout | "AI search unavailable — showing keyword results" |
| Rate limit | "Search limit reached — using keyword search" |
| Ambiguous assignee | "Multiple people match '[name]' — showing all results" |
| No assignee match | "'[name]' not found in workspace — assignee filter ignored" |

---

## Security Design

All security requirements are enforced in `nlSearch()` (server action) before any LLM or database call:

1. `requireWorkspaceMember(workspaceId)` — derives `userId` from the server-side session; throws 403 if not a member.
2. `workspaceId` is always taken from the session context passed into `executeStructuredFilter`; it is never read from the client payload.
3. Private project exclusion is implemented in the Prisma `where` clause (see Filter_Executor above) — the response never reveals private project existence.
4. The LLM system prompt receives only member names, project keys, and label names fetched via `prisma.workspaceMember.findMany({ where: { workspaceId } })` — scoped to the current workspace.

---

## Error Logging

Server-side only, no LLM details leaked to the client:

```typescript
console.error("[nl-search] LLM call failed", {
  errorType: err.name,       // e.g. "AbortError", "TypeError"
  durationMs,
  workspaceId,               // for debugging; no PII
});
```

---

## Filter Summary String Format

`buildFilterSummary(filter: StructuredFilter, memberNames: Map<string, string>): string`

Example outputs:
- `"status = IN_PROGRESS, priority = HIGH"`
- `"assignee = Rahul, labels = backend, updated after 2025-01-13"`
- `"project = WEB, due before 2025-02-01"`

Date values are formatted as `YYYY-MM-DD` for readability (not the full ISO string).

---

## Testing Strategy

| Layer | What is tested |
|---|---|
| **Unit** (`tests/unit/`) | `isNLQuery`, `serializeFilter`, `deserializeFilter`, `buildFilterSummary`, `checkRateLimit`, `getCached`/`setCached` |
| **Integration** (`tests/integration/`) | `executeStructuredFilter` against a mock Prisma client covering all 9 filter predicate combinations, empty-filter guard, private-project exclusion, 15-result cap |
| **Regression** (`tests/regression/`) | Round-trip property: `deserializeFilter(serializeFilter(f))` equals `f` for generated filter inputs; `parseNLQuery` with nonsensical input returns empty filter + confidence < 0.4 |
| **Smoke** (`tests/smoke/`) | `CommandPalette` renders AI indicator when `isNLPending`, renders filter summary, renders "Smart Search" section heading |
| **E2E** (`tests/e2e/`) | Full palette flow: type NL query → see AI indicator → see filter summary → select result → navigate; Escape clears filter before closing |

LLM calls are mocked in all test tiers except E2E (which can be skipped in CI without `GROQ_API_KEY`).
