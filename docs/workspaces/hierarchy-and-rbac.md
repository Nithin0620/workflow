# Workspace Hierarchy & Role-Based Access Control (RBAC)

Workflow is architected around a flexible, multi-tenant hierarchy that supports both individual developer side-projects and multi-team enterprise organizations.

---

## 1. The 4-Tier Hierarchy

```
1. Organization (Acme Corp)
   └── 2. Workspace (Engineering, Marketing, Mobile Team)
          └── 3. Project (TripTally [TRIP], API Gateway [API])
                 └── 4. Issue (TRIP-101, TRIP-102...)
```

1. **Organization**: Highest-level legal and billing boundary. Owns workspaces and global policies.
2. **Workspace**: A dedicated team environment with its own members, project keys, and settings.
3. **Project**: A distinct codebase, repository, or product initiative with an isolated issue sequence.
4. **Issue**: Individual engineering task, bug report, or feature request.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Capability | OWNER | ADMIN | MEMBER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| Delete Workspace | ✅ | ❌ | ❌ | ❌ |
| Invite Members & Change Roles | ✅ | ✅ | ❌ | ❌ |
| Create / Archive Projects | ✅ | ✅ | ❌ | ❌ |
| Create & Edit Issues | ✅ | ✅ | ✅ | ❌ |
| Drag & Drop Kanban Statuses | ✅ | ✅ | ✅ | ❌ |
| Post Comments & Attachments | ✅ | ✅ | ✅ | ❌ |
| View Boards, Sprints & Analytics | ✅ | ✅ | ✅ | ✅ |

---

## 3. URL Routing Strategy

Workflow routes mirror the multi-tenant hierarchy:
* `/[orgSlug]/[workspaceSlug]` ➔ Workspace Overview & Metrics
* `/[orgSlug]/[workspaceSlug]/projects` ➔ Projects Directory
* `/[orgSlug]/[workspaceSlug]/projects/[projectKey]/board` ➔ Project Kanban Board
* `/[orgSlug]/[workspaceSlug]/settings` ➔ Workspace & Team Settings
* `/[orgSlug]/[workspaceSlug]/analytics` ➔ Velocity & Throughput
