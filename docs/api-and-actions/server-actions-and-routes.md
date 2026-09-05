# Server Actions & API Specifications

Workflow utilizes Next.js Server Actions for typed RPC mutations and Route Handlers for standard REST/OAuth endpoints.

---

## 1. Server Actions (`src/actions/`)

### Authentication (`src/actions/auth.ts`)
* **`registerUser(input)`**: Validates input via Zod, hashes password, and creates User + default Org + Workspace.

### Workspaces (`src/actions/workspaces.ts`)
* **`createWorkspace(orgId, input)`**: Creates a new workspace under an organization.
* **`getUserWorkspaces()`**: Retrieves all workspaces where the current user holds active membership.
* **`inviteWorkspaceMember(workspaceId, input)`**: Invites a registered user to join a workspace with a specific role.

### Projects (`src/actions/projects.ts`)
* **`createProject(workspaceId, input)`**: Creates a project with a custom key and color accent.
* **`getWorkspaceProjects(workspaceId)`**: Returns all projects in a workspace with active issue counts.

### Issues (`src/actions/issues.ts`)
* **`createIssue(projectId, input)`**: Atomically increments project sequence and creates issue with fractional ordering.
* **`moveIssue(issueId, newStatus, newOrder)`**: Updates issue status and order for optimistic Kanban drag-and-drop.
* **`getProjectIssues(projectId)`**: Returns all issues in a project with assignee and comment counts.

---

## 2. API Routes (`src/app/api/`)

* **`GET /api/auth/[...nextauth]`**: NextAuth session initialization, OAuth callbacks, and token refreshes.
* **`POST /api/auth/[...nextauth]`**: NextAuth sign-in and sign-out handlers.
