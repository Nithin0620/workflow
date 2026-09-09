# Backend REST API Endpoints

This document provides a reference for all REST API endpoints available in the application (accessible by both the React Native mobile app and web/external clients).

All endpoints (except login and webhooks) require authentication via `Authorization: Bearer <token>` or a valid NextAuth session cookie.

---

## 1. Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticates user credentials (email/password) and returns a 30-day JWT bearer token and user profile. |
| `GET` | `/api/v1/auth/me` | Fetches the current authenticated user's profile and list of workspace memberships. |

---

## 2. Workspaces

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces` | Lists all workspaces where the current user is a member, including roles and summary counts. |
| `POST` | `/api/v1/workspaces` | Creates a new workspace under an organization and assigns the caller as the `OWNER`. |
| `GET` | `/api/v1/workspaces/[workspaceId]` | Retrieves detailed workspace information, branding banners, and aggregate counts. |
| `PATCH` | `/api/v1/workspaces/[workspaceId]` | Updates workspace metadata (name, slug, description) for workspace Admins and Owners. |
| `DELETE` | `/api/v1/workspaces/[workspaceId]` | Permanently deletes a workspace and cascades associated data (Owner only). |
| `GET` | `/api/v1/workspaces/[workspaceId]/members` | Retrieves the list of members in a workspace with their assigned roles. |
| `POST` | `/api/v1/workspaces/[workspaceId]/members` | Invites or adds a new user to the workspace with a specific role. |
| `DELETE` | `/api/v1/workspaces/[workspaceId]/members` | Removes a member from the workspace enforcing RBAC rules. |

---

## 3. Projects & Columns

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/[workspaceId]/projects` | Lists all accessible projects in a workspace (filtering out private projects based on permissions). |
| `POST` | `/api/v1/workspaces/[workspaceId]/projects` | Creates a new project with default Kanban columns (`Backlog`, `To Do`, `In Progress`, `In Review`, `Done`). |
| `GET` | `/api/v1/projects/[projectId]` | Retrieves single project details, board columns, active sprint, and member stats. |
| `PATCH` | `/api/v1/projects/[projectId]` | Updates project properties (name, key, description, visibility, default view). |
| `DELETE` | `/api/v1/projects/[projectId]` | Permanently removes a project and its associated board assets (Owner only). |
| `GET` | `/api/v1/projects/[projectId]/columns` | Retrieves the list of board columns for a project ordered by board position. |
| `POST` | `/api/v1/projects/[projectId]/columns` | Creates a new board column or updates the order of existing columns. |
| `GET` | `/api/v1/projects/[projectId]/members` | Lists all members assigned directly to a specific project. |
| `POST` | `/api/v1/projects/[projectId]/members` | Assigns or updates a project member's role (`OWNER`, `EDITOR`, `VIEWER`). |
| `DELETE` | `/api/v1/projects/[projectId]/members` | Removes a member's direct assignment from a project. |

---

## 4. Issues & Sprints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/projects/[projectId]/issues` | Lists and filters issues in a project by `sprintId`, `columnId`, `assigneeId`, `priority`, or `search`. |
| `POST` | `/api/v1/projects/[projectId]/issues` | Creates a new issue with auto-generated key (e.g., `PROJ-101`), assignees, and sprint link. |
| `GET` | `/api/v1/issues/[issueId]` | Retrieves detailed issue information including assignees, labels, comments, and activities. |
| `PATCH` | `/api/v1/issues/[issueId]` | Updates issue details, status column, priority, story points, or assignee associations. |
| `DELETE` | `/api/v1/issues/[issueId]` | Deletes an issue and broadcasts realtime deletion events to active project boards. |
| `GET` | `/api/v1/projects/[projectId]/sprints` | Lists all project sprints categorized into Active, Planned, and Completed with point totals. |
| `POST` | `/api/v1/projects/[projectId]/sprints` | Creates a new sprint iteration with planned start and end dates. |
| `GET` | `/api/v1/sprints/[sprintId]` | Retrieves sprint details along with all assigned issues. |
| `PATCH` | `/api/v1/sprints/[sprintId]` | Updates sprint metadata, starts planned sprints, or completes active sprints. |
| `DELETE` | `/api/v1/sprints/[sprintId]` | Deletes a sprint and moves unfinished issues back to the project backlog. |

---

## 5. Discussions & Channels

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/[workspaceId]/channels` | Lists all public, private, and project discussion channels with unread status. |
| `POST` | `/api/v1/workspaces/[workspaceId]/channels` | Creates a new discussion channel in the workspace. |
| `GET` | `/api/v1/channels/[channelId]/messages` | Retrieves channel messages with cursor pagination, author metadata, reactions, and attachments. |
| `POST` | `/api/v1/channels/[channelId]/messages` | Sends a message, parses `@mentions`/`#issue` references, and broadcasts realtime events. |

---

## 6. Notifications & Profile

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Retrieves the authenticated user's notification feed along with unread counter. |
| `PATCH` | `/api/v1/notifications` | Marks a single notification or all user notifications as read. |
| `GET` | `/api/v1/profile` | Returns the current user's profile details and account settings. |
| `PATCH` | `/api/v1/profile` | Updates user profile information (name, avatar) or securely changes password. |

---

## 7. Realtime Streaming (SSE) & Webhooks

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/realtime/discussions/[channelId]` | Server-Sent Events (SSE) stream for realtime channel chat messages and reactions. |
| `GET` | `/api/realtime/projects/[projectId]` | Server-Sent Events (SSE) stream for live Kanban issue updates and column changes. |
| `GET` | `/api/realtime/whiteboards/[whiteboardId]` | Server-Sent Events (SSE) stream for live whiteboard node and edge collaboration. |
| `POST` | `/api/webhooks/github` | Handles GitHub webhook events for issue linking and commit sync. |
| `GET`/`POST` | `/api/cron/bug-hunt` | Automated background cron trigger for running AI bug triage and health checks. |
