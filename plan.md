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
| **7. File & Image Attachments** | Drag-and-drop file/image upload inside issue modal and comments with preview and deletion. | Medium | Queued |
| **8. Sprint Planning & Milestones** | Create sprints, assign issues to sprints, start/complete sprints with backlog drawer. | Medium | Queued |

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

## 🔨 Active Task: 1. Team Member Invites & Role Management

### Objectives:
1. **Server Actions (`src/actions/members.ts`)**:
   - `inviteOrAddMember(workspaceId, email, role)`: Add existing user or create invite.
   - `updateMemberRole(workspaceId, memberId, newRole)`: Enforce RBAC (only `OWNER` / `ADMIN` can update roles; cannot demote the only `OWNER`).
   - `removeMember(workspaceId, memberId)`: Remove a member from the workspace (cannot remove the last `OWNER`).
   - `leaveWorkspace(workspaceId)`: Allow non-owners to leave the workspace.
2. **Client Components**:
   - `src/components/settings/invite-member-dialog.tsx`: Dialog to enter email and select role (`ADMIN`, `MEMBER`, `VIEWER`).
   - `src/components/settings/members-list.tsx`: Interactive members table with role dropdown selector and remove member button.
3. **Integration**:
   - Update `src/app/(dashboard)/[orgSlug]/[workspaceSlug]/settings/page.tsx` with the new interactive members management UI.
4. **Validation & Tests**:
   - Add unit/integration tests for member invitation, role changes, and permission boundaries.
