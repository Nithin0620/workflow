# REST API Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, secure, REST-compatible API layer (`/api/v1/...` and `/api/...`) in Next.js that mirrors all core domain operations (Workspaces, Projects, Issues, Sprints, Members, Discussions, Notifications, Profile) so that both the React Native mobile app and third-party clients can fully interact with the backend using standard HTTP/JSON and Bearer token / NextAuth authentication.

**Architecture:**
- A shared API authentication and authorization helper (`src/lib/api/auth.ts`) that verifies both NextAuth session cookies and `Authorization: Bearer <token>` JWTs.
- Clean Next.js Route Handlers (`route.ts`) under `src/app/api/v1/` structured by resource hierarchy, reusing database queries and zod schemas from `src/lib/validators.ts` and domain logic.
- Consistent JSON error formats (`{ error: string, details?: any }`) with proper HTTP status codes (`400`, `401`, `403`, `404`, `500`).
- A typed Mobile API client in `app/src/lib/api.ts` ready for the React Native app.

**Tech Stack:** Next.js 16 Route Handlers, NextAuth JWT / jsonwebtoken, Prisma 6, Zod, Vitest.

---

## Global Constraints
- Must not break existing Next.js web application or existing Server Actions in `src/actions/`.
- All endpoints must validate inputs using existing or extended Zod schemas.
- Must return appropriate standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
- Authentication must support mobile login (`/api/v1/auth/login`) returning JWT tokens usable via `Authorization: Bearer <token>` as well as NextAuth session cookies.

---

### Task 1: API Authentication Helper & Mobile Auth Endpoint

**Files:**
- Create: `src/lib/api/auth.ts`
- Create: `src/app/api/v1/auth/login/route.ts`
- Create: `src/app/api/v1/auth/me/route.ts`
- Test: `tests/unit/api-auth.test.ts`

**Interfaces:**
- `getApiUser(req: Request): Promise<{ user: User, workspaceMembers: WorkspaceMember[] } | null>`
- `requireApiAuth(req: Request): Promise<{ user: User, workspaceMembers: WorkspaceMember[] }>`
- `POST /api/v1/auth/login`: `{ email, password }` -> `{ token, user }`
- `GET /api/v1/auth/me`: `Authorization: Bearer <token>` -> `{ user }`

- [ ] **Step 1: Write the failing unit test for API Auth helper**
- [ ] **Step 2: Implement `src/lib/api/auth.ts` with JWT & session verification**
- [ ] **Step 3: Implement `/api/v1/auth/login/route.ts` and `/api/v1/auth/me/route.ts`**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 2: Workspaces REST API Endpoints

**Files:**
- Create: `src/app/api/v1/workspaces/route.ts`
- Create: `src/app/api/v1/workspaces/[workspaceId]/route.ts`
- Create: `src/app/api/v1/workspaces/[workspaceId]/members/route.ts`
- Test: `tests/unit/api-workspaces.test.ts`

**Interfaces:**
- `GET /api/v1/workspaces` -> List user's workspaces
- `POST /api/v1/workspaces` -> Create workspace
- `GET /api/v1/workspaces/[workspaceId]` -> Workspace details
- `PATCH /api/v1/workspaces/[workspaceId]` -> Update workspace
- `DELETE /api/v1/workspaces/[workspaceId]` -> Delete workspace
- `GET /api/v1/workspaces/[workspaceId]/members` -> List workspace members
- `POST /api/v1/workspaces/[workspaceId]/members` -> Invite member

- [x] **Step 1: Write tests for Workspace API endpoints**
- [x] **Step 2: Implement `src/app/api/v1/workspaces/route.ts` (GET, POST)**
- [x] **Step 3: Implement `src/app/api/v1/workspaces/[workspaceId]/route.ts` (GET, PATCH, DELETE)**
- [x] **Step 4: Implement `src/app/api/v1/workspaces/[workspaceId]/members/route.ts` (GET, POST, DELETE)**
- [x] **Step 5: Run tests and commit**

---

### Task 3: Projects & Columns REST API Endpoints

**Files:**
- Create: `src/app/api/v1/workspaces/[workspaceId]/projects/route.ts`
- Create: `src/app/api/v1/projects/[projectId]/route.ts`
- Create: `src/app/api/v1/projects/[projectId]/columns/route.ts`
- Create: `src/app/api/v1/projects/[projectId]/members/route.ts`
- Test: `tests/unit/api-projects.test.ts`

**Interfaces:**
- `GET /api/v1/workspaces/[workspaceId]/projects` -> List projects
- `POST /api/v1/workspaces/[workspaceId]/projects` -> Create project
- `GET /api/v1/projects/[projectId]` -> Project detail & columns
- `PATCH /api/v1/projects/[projectId]` -> Update project
- `DELETE /api/v1/projects/[projectId]` -> Delete project
- `GET/POST /api/v1/projects/[projectId]/columns` -> List / create / reorder columns
- `GET/POST /api/v1/projects/[projectId]/members` -> List / assign project members

- [ ] **Step 1: Write tests for Projects & Columns API**
- [ ] **Step 2: Implement `src/app/api/v1/workspaces/[workspaceId]/projects/route.ts`**
- [ ] **Step 3: Implement `src/app/api/v1/projects/[projectId]/route.ts`**
- [ ] **Step 4: Implement `src/app/api/v1/projects/[projectId]/columns/route.ts`**
- [ ] **Step 5: Implement `src/app/api/v1/projects/[projectId]/members/route.ts`**
- [ ] **Step 6: Run tests and commit**

---

### Task 4: Issues & Sprints REST API Endpoints

**Files:**
- Create: `src/app/api/v1/projects/[projectId]/issues/route.ts`
- Create: `src/app/api/v1/issues/[issueId]/route.ts`
- Create: `src/app/api/v1/projects/[projectId]/sprints/route.ts`
- Create: `src/app/api/v1/sprints/[sprintId]/route.ts`
- Test: `tests/unit/api-issues.test.ts`

**Interfaces:**
- `GET /api/v1/projects/[projectId]/issues` -> List / filter issues (by sprint, status, assignee, priority)
- `POST /api/v1/projects/[projectId]/issues` -> Create issue
- `GET /api/v1/issues/[issueId]` -> Issue details (with comments, assignees, labels)
- `PATCH /api/v1/issues/[issueId]` -> Update issue (move status, reorder, assign, update details)
- `DELETE /api/v1/issues/[issueId]` -> Delete issue
- `GET/POST /api/v1/projects/[projectId]/sprints` -> List / create sprints
- `GET/PATCH /api/v1/sprints/[sprintId]` -> Sprint details / start / complete sprint

- [ ] **Step 1: Write tests for Issues & Sprints API**
- [ ] **Step 2: Implement `src/app/api/v1/projects/[projectId]/issues/route.ts`**
- [ ] **Step 3: Implement `src/app/api/v1/issues/[issueId]/route.ts`**
- [ ] **Step 4: Implement `src/app/api/v1/projects/[projectId]/sprints/route.ts` & `src/app/api/v1/sprints/[sprintId]/route.ts`**
- [ ] **Step 5: Run tests and commit**

---

### Task 5: Discussions, Notifications & Profile REST API Endpoints

**Files:**
- Create: `src/app/api/v1/workspaces/[workspaceId]/channels/route.ts`
- Create: `src/app/api/v1/channels/[channelId]/messages/route.ts`
- Create: `src/app/api/v1/notifications/route.ts`
- Create: `src/app/api/v1/profile/route.ts`
- Test: `tests/unit/api-misc.test.ts`

**Interfaces:**
- `GET/POST /api/v1/workspaces/[workspaceId]/channels` -> Discussion channels
- `GET/POST /api/v1/channels/[channelId]/messages` -> Channel messages
- `GET/PATCH /api/v1/notifications` -> List & mark notifications read
- `GET/PATCH /api/v1/profile` -> View & update profile

- [ ] **Step 1: Write tests for Channels, Notifications & Profile endpoints**
- [ ] **Step 2: Implement Channels & Messages routes**
- [ ] **Step 3: Implement Notifications route**
- [ ] **Step 4: Implement Profile route**
- [ ] **Step 5: Run tests and commit**

---

### Task 6: Mobile Client REST API Service Scaffolding

**Files:**
- Create: `app/src/lib/api.ts`
- Create: `app/src/lib/auth-storage.ts`
- Create: `app/src/types/api.ts`

**Interfaces:**
- `setAuthToken(token: string)`
- `apiClient.get(endpoint: string, params?: object)`
- `apiClient.post(endpoint: string, body?: object)`
- `apiClient.patch(endpoint: string, body?: object)`
- `apiClient.delete(endpoint: string)`

- [ ] **Step 1: Create typed API client and storage in `app/src/lib/api.ts`**
- [ ] **Step 2: Verify type-check passes across root and `app/`**
- [ ] **Step 3: Commit**
