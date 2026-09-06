# Implementation Plan: Natural-Language Search

## Overview

Add natural-language search to the ⌘K Command Palette. Users type plain-English queries; the system routes them through an AI parser (Groq) to extract a `StructuredFilter`, then executes that filter via Prisma. The existing keyword-search path is fully preserved as a fallback. No new npm packages are needed — the implementation uses the raw `fetch` + Groq pattern already established in `src/lib/ai/groq.ts`.

---

## Tasks

- [ ] 1. Create the `src/lib/nl-search` module: types and routing helper
  - [ ] 1.1 Create `src/lib/nl-search/types.ts` with the `StructuredFilter` interface, `NLSearchResponse` interface, and the `isNLQuery(query: string): boolean` routing helper
    - Define all 12 filter predicates matching the Prisma `IssueStatus` and `IssuePriority` enums from `@prisma/client`
    - Define `NLSearchResponse` with fields: `success`, `mode`, `results`, `filter?`, `filterSummary?`, `confidenceScore?`, `fallbackReason?`, `fallbackMessage?`, `assigneeCandidates?`, `noAssigneeMatch?`, `cached?`
    - Implement `isNLQuery`: returns `false` when trimmed length < 10 or when the string matches `FILTER_FIELD_PATTERN` (`/\b(status|priority|label|assignee|project|sprint):[^\s]+/i`); returns `true` otherwise
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.2 Write unit tests for `isNLQuery`
    - Test boundary: 9 chars → `false`, 10 chars → `true`
    - Test field:value patterns for each of the 6 known fields → `false`
    - Test plain sentences (no field tokens, ≥ 10 chars) → `true`
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement `serializeFilter` / `deserializeFilter`
  - [ ] 2.1 Create `src/lib/nl-search/filter-serializer.ts` with `serializeFilter(f: StructuredFilter): string` and `deserializeFilter(s: string): StructuredFilter`
    - `serializeFilter`: produce a stable, human-readable string with alphabetically sorted keys and sorted array values; omit absent/null/empty-array fields; format: `key=value1,value2 key2=value`
    - `deserializeFilter`: parse the string back into a `StructuredFilter`; support all 12 predicates including array fields (`status`, `priority`, `labels`) and scalar date/string fields
    - The round-trip `deserializeFilter(serializeFilter(f))` must produce strictly equal predicate values for any filter `f`
    - _Requirements: 7.2_

  - [ ]* 2.2 Write unit tests for `serializeFilter` and `deserializeFilter`
    - Test round-trip on fully-populated filter, partially-populated filter, and empty filter `{}`
    - Test that serialization is stable (same input → same output across calls)
    - Test that absent fields are omitted from the serialized string
    - _Requirements: 7.2_

- [ ] 3. Implement the rate limiter
  - [ ] 3.1 Create `src/lib/nl-search/rate-limiter.ts` with `checkRateLimit(userId: string, workspaceId: string): { allowed: boolean }`
    - Use an in-memory `Map` keyed by `` `${userId}:${workspaceId}` `` storing `{ count: number; windowStart: number }`
    - Rolling 60-second window: if `Date.now() - windowStart > 60_000`, reset `count` to 0 and update `windowStart`
    - Limit: 30 requests per window; return `{ allowed: false }` when count would exceed 30
    - _Requirements: 8.2_

  - [ ]* 3.2 Write unit tests for `checkRateLimit`
    - Test that the 30th request is allowed and the 31st is not
    - Test that the counter resets after the 60-second window expires (advance `Date.now` via `vi.setSystemTime`)
    - Test key isolation: different `userId:workspaceId` pairs have independent counters
    - _Requirements: 8.2_

- [ ] 4. Implement the in-memory cache
  - [ ] 4.1 Create `src/lib/nl-search/cache.ts` with `getCached(workspaceId: string, query: string): NLSearchResponse | null` and `setCached(workspaceId: string, query: string, response: NLSearchResponse): void`
    - Cache key: `` `${workspaceId}:${query.toLowerCase().trim()}` ``
    - TTL: 60 000 ms; return `null` for missing or expired entries
    - `setCached` records `expiresAt = Date.now() + 60_000` alongside the response
    - _Requirements: 8.3, 8.4_

  - [ ]* 4.2 Write unit tests for the cache
    - Test cache miss on first call, hit on second call with same key
    - Test that an expired entry returns `null` (advance `Date.now` via `vi.setSystemTime`)
    - Test case-insensitive / trim normalization of the query portion of the key
    - _Requirements: 8.3, 8.4_

- [ ] 5. Checkpoint — core utilities complete
  - Ensure all tests pass for tasks 1–4. Ask the user if questions arise before continuing.

- [ ] 6. Implement the AI parser (`parseNLQuery`)
  - [ ] 6.1 Create `src/lib/nl-search/nl-parser.ts` with `parseNLQuery(query, context, nowIso?)`
    - Follow the same raw `fetch` pattern as `src/lib/ai/groq.ts`; call `https://api.groq.com/openai/v1/chat/completions` with model `llama-3.3-70b-versatile`, `temperature: 0`, `response_format: { type: "json_object" }`
    - Use an `AbortController` with a 5 000 ms timeout; catch `AbortError` and other errors; log server-side with `console.error("[nl-search] LLM call failed", { errorType, durationMs, workspaceId })` — no LLM details in the returned value
    - System prompt must include: current UTC timestamp (`nowIso`), workspace member names, project keys, and label names; instruct the model to return JSON matching the schema defined in the design (`confidenceScore`, `status`, `priority`, `labels`, `assigneeNameToken`, `projectKey`, `sprintId`, date predicates)
    - Perform server-side assignee resolution from `assigneeNameToken` against `context.members`: 0 matches → `noAssigneeMatch: true`; 1 match → `assigneeId`; 2+ matches → `assigneeCandidates` (capped at 10)
    - Return `{ success: false }` on any LLM error (timeout, non-2xx, JSON parse failure) so the caller can fall back
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 6.5_

  - [ ]* 6.2 Write unit tests for `parseNLQuery` (LLM mocked via `vi.stubGlobal('fetch', ...)`)
    - Test successful parse: mock returns valid JSON → `assigneeId` resolved, `confidenceScore` set
    - Test timeout: abort after 5 s → returns `{ success: false }`
    - Test non-2xx HTTP response → returns `{ success: false }`
    - Test ambiguous assignee (2 matches) → `assigneeCandidates` populated, `assigneeId` absent
    - Test zero assignee matches → `noAssigneeMatch: true`
    - Test nonsensical query mock (confidence < 0.4) → all predicates absent
    - _Requirements: 2.3, 2.4, 2.7, 3.2, 3.3, 3.4, 7.4_

- [ ] 7. Implement the filter executor
  - [ ] 7.1 Create `src/lib/nl-search/filter-executor.ts` with `executeStructuredFilter(filter, workspaceId, userId): Promise<SearchResultItem[]>`
    - Empty-filter guard: if all predicates are absent/null/undefined/empty-array → return `[]` immediately without querying
    - Build the Prisma `where` clause with `project.workspaceId` always enforced; include the private-project exclusion (`OR: [{ isPrivate: false }, { isPrivate: true, members: { some: { userId } } }]`)
    - Apply all present predicates: `status` → `{ in: filter.status }`, `priority` → `{ in: filter.priority }`, `assigneeId`, `sprintId`, `projectKey` on the nested `project` relation, date predicates with `gte`/`lte` on `dueDate`, `updatedAt`, `createdAt`
    - For `labels`: run Prisma with `some: { name: { in: filter.labels, mode: "insensitive" } }` then post-filter in-memory so only issues with ALL specified labels are kept
    - `orderBy: { updatedAt: "desc" }`, `take: 15`; map results to `SearchResultItem[]` using the same shape as `src/actions/search.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 6.3, 6.4_

  - [ ]* 7.2 Write integration tests for `executeStructuredFilter` (Prisma mocked via `vi.mock`)
    - Test empty filter → returns `[]`, Prisma not called
    - Test `status` filter → correct `{ in: [...] }` clause passed
    - Test `priority` filter → correct `{ in: [...] }` clause
    - Test `labels` (multi-label ALL semantics) → post-filter keeps only superset matches
    - Test `assigneeId` filter → `assigneeId` predicate in where clause
    - Test `projectKey` filter → nested on `project` relation
    - Test date predicates (`dueAfter`, `dueBefore`, `updatedAfter`, `updatedBefore`, `createdAfter`, `createdBefore`) → `gte`/`lte` on correct fields
    - Test private-project exclusion → `isPrivate: true` issues without `ProjectMember` entry are not returned
    - Test 15-result cap → mock returns 20 records, only 15 returned
    - _Requirements: 4.1–4.9, 6.3, 6.4_

- [ ] 8. Checkpoint — library layer complete
  - Ensure all tests pass for tasks 6–7. Ask the user if questions arise before continuing.

- [ ] 9. Build the `buildFilterSummary` helper and wire it into types
  - [ ] 9.1 Add `buildFilterSummary(filter: StructuredFilter, memberNames: Map<string, string>): string` to `src/lib/nl-search/types.ts` (or a separate `src/lib/nl-search/filter-summary.ts`)
    - Produces human-readable output, e.g. `"status = OPEN, priority = HIGH, assignee = Rahul"`
    - Date values formatted as `YYYY-MM-DD` (not full ISO)
    - `assigneeId` resolved to a display name via `memberNames` map
    - _Requirements: 5.2, 5.3_

  - [ ]* 9.2 Write unit tests for `buildFilterSummary`
    - Test full filter with all predicates → correct labels and values
    - Test date formatting → `YYYY-MM-DD` output
    - Test `assigneeId` resolution via map → shows display name, not ID
    - Test empty filter `{}` → returns empty string or appropriate fallback
    - _Requirements: 5.2_

- [ ] 10. Create the `nlSearch` server action
  - [ ] 10.1 Create `src/actions/nl-search.ts` implementing `nlSearch(workspaceId, query, nowIso?): Promise<NLSearchResponse>`
    - `"use server"` directive at top; signature matches the design doc
    - Step 1: `requireWorkspaceMember(workspaceId)` — throws on 403; extract `userId`
    - Step 2: `checkRateLimit(userId, workspaceId)` — if `!allowed`, call `searchWorkspace()` and return `mode: "keyword"`, `fallbackReason: "rate_limit"`, `fallbackMessage: "Search limit reached — using keyword search"`
    - Step 3: `checkCache(workspaceId, query)` — if hit, return with `cached: true`
    - Step 4: Fetch workspace context in parallel — `WorkspaceMember` records (with `user.name`, `user.id`), `Project` records (`key`, `name`), `Label` records (`name`) — all scoped to `workspaceId`
    - Step 5: Call `parseNLQuery(query, context, nowIso ?? new Date().toISOString())`
    - Step 6: If `!result.success` or `confidenceScore < 0.4` → call `searchWorkspace()` fallback with appropriate `fallbackReason` and `fallbackMessage`
    - Step 7: Call `executeStructuredFilter(filter, workspaceId, userId)`
    - Step 8: Call `buildFilterSummary(filter, memberNamesMap)`
    - Step 9: `setCached(workspaceId, query, response)`
    - Step 10: Return complete `NLSearchResponse` with `mode: "nl"`, `success: true`
    - _Requirements: 1.4, 1.6, 2.5, 2.7, 2.8, 6.1, 6.2, 8.1, 8.2, 8.3, 8.4_

- [ ] 11. Update `CommandPalette` to support NL routing, AI indicator, and filter UX
  - [ ] 11.1 Add NL state and routing logic to `src/components/common/command-palette.tsx`
    - Import `nlSearch` from `@/actions/nl-search` and `isNLQuery` from `@/lib/nl-search/types`
    - Add state: `nlResponse: NLSearchResponse | null`, `isNLPending: boolean`, `hasActiveFilter: boolean`
    - Change debounce: `isNLQuery(query) ? 400 : 200` ms
    - When query qualifies as NL: call `nlSearch()`, set `isNLPending` around the call, update `nlResponse` on completion
    - When query is below threshold or contains field:value token: call existing `searchWorkspace()` path, clear `nlResponse`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1_

  - [ ] 11.2 Add the AI-processing visual indicator
    - Render a pulsing `Sparkles` icon or "AI" badge inside the search input bar when `isNLPending === true`
    - The existing `Loader2` spinner remains for keyword search; both indicators must be visually distinct
    - Hide the AI indicator when `isNLPending === false` (including cache hits — `nlResponse?.cached === true`)
    - _Requirements: 1.4, 8.4_

  - [ ] 11.3 Render the filter summary bar and "Smart Search" section heading
    - Show the filter summary bar between the search input and results list when `nlResponse?.filterSummary` is truthy; include a "Clear ×" button that calls a `clearFilter()` handler
    - Render NL results under a "Smart Search" heading; keep keyword/fallback results under "Matching Issues & Projects"; the two sections must not share a heading
    - When `nlResponse` is set but `results` is empty: show a "no issues matched" message that includes the filter summary
    - When `nlResponse?.fallbackMessage` is set: show it as an inline non-blocking notice above the results
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [ ] 11.4 Implement the progressive Escape dismiss and "Clear filters" UX
    - First Escape when `hasActiveFilter === true`: call `clearFilter()` → clear `nlResponse` and `hasActiveFilter`, keep palette open, preserve `query` text
    - Second Escape (or first Escape when `hasActiveFilter === false`): close palette (existing `onClose()`)
    - "Clear filters" button: same effect as first-Escape clear, then re-run keyword search with current `query`
    - _Requirements: 5.5, 5.6_

- [ ] 12. Checkpoint — integration complete
  - Ensure all tests pass end-to-end. Verify the `CommandPalette` renders correctly with and without the `workspaceId` prop. Ask the user if questions arise before continuing.

- [ ]* 13. Write smoke tests for `CommandPalette` NL additions
  - [ ]* 13.1 Test that the AI indicator renders when `isNLPending` is `true` and is absent otherwise
    - Mock `nlSearch` to return a pending promise; assert `Sparkles` / "AI" badge visible
    - _Requirements: 1.4_

  - [ ]* 13.2 Test that the filter summary bar renders with the correct text and "Clear ×" button
    - Mock `nlSearch` to resolve with `filterSummary: "status = OPEN, priority = HIGH"`; assert summary visible
    - Click "Clear ×"; assert summary removed and palette stays open
    - _Requirements: 5.2, 5.6_

  - [ ]* 13.3 Test that the "Smart Search" section heading appears for NL results
    - Mock `nlSearch` to resolve with `mode: "nl"` and non-empty `results`; assert "Smart Search" heading present
    - _Requirements: 5.1_

- [ ] 14. Final checkpoint — all tests pass
  - Run `pnpm vitest --run` and confirm all unit, integration, and smoke tests pass. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- LLM calls are mocked in all test tiers via `vi.stubGlobal('fetch', ...)` or `vi.mock`; no `GROQ_API_KEY` is needed to run the test suite
- The `workspaceId` used in every Prisma query and LLM context call is always derived from the server-side session (`requireWorkspaceMember`), never from client input
- The `isNLQuery` routing function is also exported so the `CommandPalette` client component can use it without a server round-trip
- All date predicate strings from the LLM are validated as parseable by `new Date(str)` before being passed to Prisma; invalid strings should be omitted rather than thrown
- The `labels` "ALL" semantics two-pass approach (Prisma `some` + in-memory superset check) is safe because the result cap is 15

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2", "4.2"] },
    { "id": 2, "tasks": ["6.1", "7.1", "9.1"] },
    { "id": 3, "tasks": ["6.2", "7.2", "9.2"] },
    { "id": 4, "tasks": ["10.1"] },
    { "id": 5, "tasks": ["11.1"] },
    { "id": 6, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 7, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```
