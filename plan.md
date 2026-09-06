# Workflow — Comprehensive Roadmap & Execution Plan

This document outlines the full roadmap for the **Workflow** engineering management platform (Linear / Jira alternative), categorizing all remaining work into **Main Core Features** and **Small UX Polish Items**.

---

## 🗺️ Master Roadmap

### 🚀 Phase A: Main Core Features

| Feature Area | Description | Priority | Status |
|---|---|---|---|
| **1. Team Member Invites & Role Management** | Interactive invite modal in `/settings`, inviting teammates by email, role assignments (`ADMIN`, `MEMBER`, `VIEWER`), removing members, and role updates. | High | **Completed** ✅ |
| **2. Issue Views Toggle (Board ⇄ List View)** | Toggle between Kanban Column view and a compact Linear-style List/Table view with column sorting and status/priority filters. | High | **Completed** ✅ |
| **3. Interactive Notification Center** | Top navbar bell dropdown with live alerts (issue assignments, mentions, status changes) and "Mark all as read". | High | **Completed** ✅ |
| **4. Granular Project-Level RBAC & Privacy** | Restrict projects to specific teammates (`Public` vs `Private`), assign Project Roles (`👑 Co-Owner`, `✏️ Write/Editor`, `👁️ Read-Only/Viewer`), and manage team permissions. | High | **Completed** ✅ |
| **5. Customizable Board Columns & Custom Lists** | Create, rename, customize colors, and delete custom workflow columns on project boards (Owner & Co-Owner permissions), with real-time SSE live sync. | High | **Completed** ✅ |
| **6. Collapsible Left Sidebar** | Collapse left navigation sidebar into compact icon-only view with persisted `localStorage` state and smooth transition. | High | **Completed** ✅ |
| **7. File & Image Attachments** | Drag-and-drop file/image upload inside issue modal and comments with preview and deletion. | Medium | **Completed** ✅ |
| **8. Sprint Planning & Milestones** | Create sprints, assign issues to sprints, start/complete sprints with backlog drawer. | Medium | **Completed** ✅ |
| **9. Project & Workspace Banner Carousel** | Auto-attached default banner images (3-4 picsum.photos) per workspace/project with sliding carousel on board + workspace overview, small previews in dashboard/workspace/projects cards, add-by-URL & delete (RBAC). | Low | **Completed** ✅ |

---

### 🎨 Phase B: Small / Polish & UX Items

| Feature Area | Description | Priority | Status |
|---|---|---|---|
| **1. Command Palette Live Search (`Cmd+K`)** | Quick live search across all issues and projects with keyboard arrow navigation. | High UX | **Completed** ✅ |
| **2. Board Priority & Assignee Quick Filters** | Quick filter pills (`Filter by Assignee: Me`, `Priority: High/Urgent`, `Reset`). | Medium UX | **Completed** ✅ |
| **3. Workspace Danger Zone (Delete / Leave)** | Owner workspace deletion with confirmation, renaming, and member leave workspace in settings. | Medium | **Completed** ✅ |
| **4. CSV & JSON Issue Export** | Export issues with metadata to CSV/JSON format for reports and backups. | Low | **Completed** ✅ |
| **5. Profile & User Account Settings** | Update display name, profile avatar, and change password with auth verification. | Low | **Completed** ✅ |

---

### 🤖 Phase C: AI Repository Intelligence & Autonomous Engineering Agent

| Phase | Description | Priority | Status |
|---|---|---|---|
| **Phase 1: Repository Authorization & GitHub Codebase Integration** | Connect GitHub repositories to projects with encrypted access token / PAT, test repo connectivity, fetch branch/file tree, and configure AI scanner permissions. | High | **Completed** ✅ |
| **Phase 2: AI Issue Code Scanner & Recommended Fixes (Groq API)** | Analyze issue descriptions against repository code using Groq AI (`llama-3.3-70b-versatile`) to generate Root Cause Analysis, file location mapping, and actionable code diffs/patches with unit test suggestions. | High | **Completed** ✅ |
| **Phase 3: Scheduled Daily Bug Hunter & Security Scanner (Cron 12:00 PM)** | Automated recurring daily scan of connected repositories at 12:00 PM to detect bugs, type errors, dead code, and security risks, automatically creating tagged issues on the board. | Medium | **Completed** ✅ |

---

## 🔨 Active Task: Phase 1 — Repository Authorization & GitHub Integration

### Objectives:
1. **Prisma Schema (`prisma/schema.prisma`)**:
   - Add `ProjectRepository` model linked to `Project` with fields for `repoOwner`, `repoName`, `branch`, `accessToken`, `aiScanEnabled`, `cronSchedule`, `lastScannedAt`, and `status`.
2. **GitHub Integration Library (`src/lib/github/client.ts`)**:
   - Validate repository existence and access token permissions.
   - Fetch repo details, branch list, file tree, and raw file contents via GitHub REST API.
3. **Server Actions (`src/actions/repositories.ts`)**:
   - `connectProjectRepository`: Link and validate a GitHub repository for a project (Owner/Editor only).
   - `getProjectRepository`: Retrieve current repository connection status and settings.
   - `updateRepositorySettings`: Toggle AI scan permissions and default branch.
   - `disconnectProjectRepository`: Unlink repository from project.
   - `testRepositoryConnection`: Verify live token connectivity.
4. **UI Components (`src/components/repositories/`)**:
   - `repository-settings-dialog.tsx`: Dialog inside Project Permissions/Board to connect GitHub repo, test connection, select default branch, and toggle AI analyzer settings.
   - `repository-badge.tsx`: Header badge on Kanban board showing connected repo status and quick branch switcher.
5. **Validation & Unit Tests (`tests/unit/repositories.test.ts`)**:
   - Test repository URL parser, token validator schemas, and GitHub client mock workflows.
