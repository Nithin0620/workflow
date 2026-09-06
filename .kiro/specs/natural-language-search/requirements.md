# Requirements Document

## Introduction

Natural-language search allows users to query issues inside the ⌘K command palette using plain English instead of structured filter syntax. A user types a sentence like "Show me high-priority backend bugs assigned to Rahul that haven't been touched this week" and the system uses an AI model to translate that sentence into a structured filter object (status, priority, labels, assignee, date ranges, etc.). The structured filter is then handed to the existing database query layer to retrieve matching issues within the current workspace. The feature preserves the existing keyword-based search path so both modes work side-by-side.

---

## Glossary

- **Command_Palette**: The modal overlay opened with ⌘K / Ctrl+K that provides global navigation and search across a workspace.
- **NL_Query**: A free-text natural-language string entered by the user that expresses search intent (e.g. "open bugs assigned to me this sprint").
- **Structured_Filter**: A typed object derived from an NL_Query containing zero or more filter predicates: `status`, `priority`, `labels`, `assigneeId`, `projectKey`, `sprintId`, `dueBefore`, `dueAfter`, `updatedBefore`, `updatedAfter`, `createdBefore`, `createdAfter`.
- **AI_Parser**: The server-side component that calls the LLM API and converts an NL_Query into a Structured_Filter.
- **Filter_Executor**: The server-side component that translates a Structured_Filter into a Prisma query and returns matching issues.
- **Confidence_Score**: A numeric value (0.0–1.0) returned by the AI_Parser indicating how reliably the NL_Query was understood.
- **Keyword_Search**: The existing `searchWorkspace` text-matching path that searches issue titles, descriptions, and project names.
- **Search_Result**: A `SearchResultItem` returned to the Command_Palette containing type, id, title, subtitle, and href.
- **Workspace_Member**: A user who belongs to a workspace with any role (OWNER, ADMIN, MEMBER, VIEWER).
- **Trigger_Threshold**: The minimum character count (10) at which the Command_Palette treats a query as a candidate for NL parsing.

---

## Requirements

### Requirement 1: Natural-Language Query Detection

**User Story:** As a Workspace_Member, I want the Command_Palette to automatically recognize when I am typing a natural-language query so that I do not have to switch modes or learn special syntax.

#### Acceptance Criteria

1. WHEN a query entered in the Command_Palette reaches 10 or more characters AND does not contain a token matching the structured-filter syntax `field:value` (where `field` is one of the known filter fields: `status`, `priority`, `label`, `assignee`, `project`, `sprint`), THE Command_Palette SHALL route the query exclusively to the AI_Parser and SHALL NOT invoke Keyword_Search for that query.
2. WHEN a query entered in the Command_Palette contains fewer than 10 characters, THE Command_Palette SHALL route the query to Keyword_Search only and SHALL NOT invoke the AI_Parser.
3. WHEN a query contains at least one token matching the structured-filter syntax `field:value` (with a recognized field name), THE Command_Palette SHALL route the query to Keyword_Search only and SHALL NOT invoke the AI_Parser.
4. WHEN the AI_Parser has been invoked and has not yet returned a response, THE Command_Palette SHALL display a distinct AI-processing visual indicator (e.g., a spinner or pulsing badge labeled "AI") that is not shown during Keyword_Search processing; THE indicator SHALL be shown from the moment the debounced request is dispatched until a response is received or an error occurs.
5. WHILE the AI_Parser is processing, THE Command_Palette SHALL remain interactive: the user SHALL be able to continue typing, delete characters, and use keyboard navigation within the palette without interruption.
6. WHEN the AI_Parser call fails (network error, timeout, or non-2xx HTTP response), THE Command_Palette SHALL remove the AI-processing indicator, fall back to Keyword_Search using the current query string, and display a non-blocking inline error notice informing the user that AI search is temporarily unavailable.

---

### Requirement 2: AI-Powered Filter Extraction

**User Story:** As a Workspace_Member, I want the system to extract structured filters from my natural-language query so that I receive relevant results without knowing database field names.

#### Acceptance Criteria

1. WHEN the AI_Parser receives an NL_Query, THE AI_Parser SHALL attempt to extract zero or more of the following predicates: `status` (mapped to one or more `IssueStatus` enum values), `priority` (mapped to one or more `IssuePriority` enum values), `labels` (matched case-insensitively against workspace label names), `assigneeId` (resolved from a display name within the workspace; omitted if zero or two or more workspace members match), `projectKey` (matched against existing project keys in the workspace), `dueBefore`, `dueAfter`, `updatedBefore`, `updatedAfter`, `createdBefore`, `createdAfter` (each expressed as an absolute ISO 8601 UTC date-time computed from relative phrases such as "this week" or "last month").
2. WHEN the AI_Parser resolves relative date expressions (e.g. "this week", "yesterday", "last 7 days"), THE AI_Parser SHALL anchor all date calculations to the UTC timestamp of the server at the moment the request is received.
3. WHEN the AI_Parser cannot map a token to any known filter predicate, THE AI_Parser SHALL omit that predicate from the Structured_Filter rather than return an error.
4. THE AI_Parser SHALL return a Confidence_Score in the range [0.0, 1.0] (inclusive) alongside the Structured_Filter, where 0.0 indicates no recognizable intent and 1.0 indicates full confidence.
5. WHEN the Confidence_Score is below 0.4, THE Command_Palette SHALL fall back to Keyword_Search using the original NL_Query string and SHALL display an inline message informing the user that natural-language parsing was uncertain (e.g., "Couldn't understand query — showing keyword results").
6. THE AI_Parser SHALL complete extraction within 3,000 ms for 95% of requests when the system is handling 100 or fewer concurrent natural-language search requests.
7. WHEN the LLM API call fails or does not return a response within 5,000 ms, THE AI_Parser SHALL abort the LLM call, fall back to Keyword_Search, and log the failure (including error type and duration) server-side without including any LLM error details in the client response.
8. WHEN the AI_Parser falls back to Keyword_Search due to low confidence or an error, THE Command_Palette SHALL display a brief, user-friendly fallback notice (e.g., "Showing keyword results instead") alongside the Keyword_Search results.

---

### Requirement 3: Assignee Name Resolution

**User Story:** As a Workspace_Member, I want to search for issues by a person's name as I know them so that I do not need to look up internal user IDs.

#### Acceptance Criteria

1. WHEN the AI_Parser extracts an assignee name token from the NL_Query, THE AI_Parser SHALL trim leading and trailing whitespace from the token and then resolve it to a `userId` by performing a case-insensitive substring match against the `name` field of all `User` records who are `WorkspaceMember`s of the current workspace.
2. WHEN exactly one workspace member's `name` contains the (trimmed, case-insensitive) assignee name token as a substring, THE AI_Parser SHALL set `assigneeId` in the Structured_Filter to that member's `userId`.
3. WHEN two or more workspace members' `name` fields each contain the assignee name token as a substring, THE AI_Parser SHALL omit `assigneeId` from the Structured_Filter and SHALL include in the response metadata a `assigneeCandidates` array containing the display names of the matching members (capped at 10 entries) so the Command_Palette can prompt the user to disambiguate.
4. WHEN no workspace member's `name` contains the assignee name token as a substring, THE AI_Parser SHALL omit `assigneeId` from the Structured_Filter and SHALL set a `noAssigneeMatch` flag in the response metadata so the Command_Palette can inform the user that the named person was not found in the workspace.

---

### Requirement 4: Structured Filter Execution

**User Story:** As a Workspace_Member, I want the search results to reflect my intent accurately so that I can navigate directly to the issues I care about.

#### Acceptance Criteria

1. WHEN the Filter_Executor receives a Structured_Filter, THE Filter_Executor SHALL apply all present predicates (a predicate is "present" if its key exists in the Structured_Filter object and its value is neither `null`, `undefined`, nor an empty array) as AND conditions in the Prisma query against the `Issue` table scoped to the current workspace.
2. WHEN the Structured_Filter contains a `labels` predicate, THE Filter_Executor SHALL match only issues that have ALL specified labels attached (i.e., the label set of the issue is a superset of the specified labels).
3. WHEN the Structured_Filter contains a `status` predicate with multiple values, THE Filter_Executor SHALL match issues whose `status` field is ANY of the specified `IssueStatus` enum values.
4. WHEN the Structured_Filter contains a `priority` predicate with multiple values, THE Filter_Executor SHALL match issues whose `priority` field is ANY of the specified `IssuePriority` enum values.
5. THE Filter_Executor SHALL return at most 15 issue Search_Results per query, ordered by `updatedAt` descending.
6. WHEN the Structured_Filter contains no present predicates (all fields are absent, null, undefined, or empty arrays), THE Filter_Executor SHALL immediately return an empty result set and SHALL NOT issue any database query.
7. THE Filter_Executor SHALL scope all queries to issues whose `project.workspaceId` equals the workspace ID derived from the authenticated session, regardless of any other filter content.
8. WHEN the Structured_Filter contains a `dueBefore`, `dueAfter`, `updatedBefore`, `updatedAfter`, `createdBefore`, or `createdAfter` predicate, THE Filter_Executor SHALL apply the corresponding date-range condition on the `dueDate`, `updatedAt`, or `createdAt` field of the `Issue` model respectively, using inclusive bounds.
9. WHEN the Structured_Filter contains a `projectKey` predicate, THE Filter_Executor SHALL restrict results to issues belonging to the project with the matching `key` within the current workspace. WHEN the Structured_Filter contains a `sprintId` predicate, THE Filter_Executor SHALL restrict results to issues assigned to the sprint with the matching `id` within the current workspace.

---

### Requirement 5: Command Palette Result Presentation

**User Story:** As a Workspace_Member, I want to see my natural-language search results clearly labeled within the Command_Palette so that I know how my query was interpreted.

#### Acceptance Criteria

1. WHEN the Filter_Executor returns one or more results, THE Command_Palette SHALL render the results under a distinct labeled section heading (e.g., "Smart Search") that is visually separate from any concurrently rendered Keyword_Search section; the two sections SHALL NOT share a heading or be interleaved.
2. WHEN the Filter_Executor returns results, THE Command_Palette SHALL display a human-readable filter summary string (e.g., "Showing: status = OPEN, priority = HIGH, assignee = Rahul") immediately beneath the search input field, above the result list.
3. WHEN the Filter_Executor returns zero results, THE Command_Palette SHALL display a message stating no issues matched the applied filters and SHALL include the filter summary string so the user can understand which filters were active.
4. WHEN the user selects a Search_Result item, THE Command_Palette SHALL navigate the browser to the corresponding issue detail page and SHALL close the palette.
5. WHEN the filter summary is visible and the user presses Escape, THE Command_Palette SHALL first clear the active Structured_Filter and filter summary (reverting to plain Keyword_Search mode) without closing the palette; the existing query text SHALL be preserved in the input field; a subsequent Escape press SHALL close the palette.
6. WHEN the filter summary is visible and the user activates the "Clear filters" control, THE Command_Palette SHALL clear the active Structured_Filter and filter summary, revert to plain Keyword_Search mode using the current input text, and keep the palette open.

---

### Requirement 6: Security and Authorization

**User Story:** As a system administrator, I want natural-language search to respect workspace boundaries and access controls so that users cannot retrieve issues they are not permitted to see.

#### Acceptance Criteria

1. WHEN a request to perform a natural-language search is received, THE Filter_Executor SHALL derive the target workspace ID exclusively from the authenticated server-side session and SHALL verify the requesting user holds a `WorkspaceMember` record for that workspace before executing any query or invoking the AI_Parser.
2. IF the requesting user does not hold a `WorkspaceMember` record for the target workspace, THEN THE Filter_Executor SHALL return an HTTP 403 response with a generic "Forbidden" message and SHALL NOT execute any database query or return any issue data.
3. THE Filter_Executor SHALL hardcode `project.workspaceId` equal to the session-derived workspace ID in every Prisma query and SHALL NOT read or accept a `workspaceId` value from the client request payload.
4. WHERE a project has `isPrivate = true`, THE Filter_Executor SHALL silently exclude issues from that project from the result set unless the requesting user has an explicit `ProjectMember` record for that project; the response SHALL NOT indicate whether private projects exist or were excluded.
5. THE AI_Parser SHALL include in any LLM prompt context only the member names, project keys, and label names belonging to the target workspace; it SHALL NOT fetch or embed data from any other workspace.

---

### Requirement 7: NL Query Round-Trip Fidelity

**User Story:** As a developer, I want the parsing pipeline to be reliably verifiable so that regressions in filter extraction are caught automatically.

#### Acceptance Criteria

1. WHEN the AI_Parser is invoked with a fixed NL_Query string, a fixed server-side UTC timestamp, and an identical workspace context (same member list, project keys, and label set), AND the LLM temperature is set to 0, THE AI_Parser SHALL produce a Structured_Filter whose values for all 12 predicates (`status`, `priority`, `labels`, `assigneeId`, `projectKey`, `sprintId`, `dueBefore`, `dueAfter`, `updatedBefore`, `updatedAfter`, `createdBefore`, `createdAfter`) are identical across repeated invocations.
2. THE system SHALL provide a deterministic `serializeFilter(f: StructuredFilter): string` function and a deterministic `deserializeFilter(s: string): StructuredFilter` function such that for any Structured_Filter `f` produced by the AI_Parser, `deserializeFilter(serializeFilter(f))` returns a Structured_Filter whose values for all 12 predicates are strictly equal to those of `f`; this round-trip SHALL be verified without invoking the LLM.
3. THE AI_Parser SHALL return a Structured_Filter that is a valid instance of the `StructuredFilter` TypeScript type for every NL_Query input of up to 500 characters, including empty strings and strings containing only whitespace or special characters.
4. WHEN the AI_Parser is given an NL_Query string of up to 500 characters that contains no recognizable English words and no token matching any known predicate pattern (status values, priority values, label names, member names, project keys, sprint IDs, or temporal keywords), THE AI_Parser SHALL return a Structured_Filter in which all 12 predicates are absent (not present in the object) and a Confidence_Score below 0.4, rather than throwing an exception.

---

### Requirement 8: Performance and Rate Limiting

**User Story:** As a Workspace_Member, I want natural-language search to feel fast and not degrade the application under heavy use so that the palette remains a productivity tool.

#### Acceptance Criteria

1. WHEN the user modifies the query text in the Command_Palette and the query qualifies for AI_Parser routing, THE Command_Palette SHALL wait 400 ms after the last keystroke before dispatching the NL_Query to the AI_Parser; any prior pending dispatch for the same input session SHALL be cancelled.
2. THE system SHALL maintain a per-user rolling 60-second request counter; IF a user submits more than 30 natural-language search requests within any 60-second window, THEN THE Command_Palette SHALL display an inline rate-limit message (e.g., "Search limit reached — using keyword search") and SHALL route all subsequent queries in that same 60-second window to Keyword_Search only; the counter SHALL reset automatically when the 60-second window expires.
3. IF an NL_Query string (case-insensitively trimmed) has been successfully parsed within the current workspace in the last 60 seconds, THEN THE AI_Parser SHALL return the cached Structured_Filter without invoking the LLM API.
4. WHEN a cached Structured_Filter is returned, THE Command_Palette SHALL NOT display the AI-processing visual indicator.
