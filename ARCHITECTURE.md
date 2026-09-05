# Workflow — System Architecture & Design

## 1. High-Level Architecture

Workflow is designed as a high-performance, modular full-stack SaaS application built on Next.js App Router, PostgreSQL, and a real-time event broker.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  Next.js 16 + React 19 + Tailwind v4 + Optimistic State    │
│  Kanban Drag & Drop | Command Palette (⌘K) | Keyboard Hotkeys│
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP / Server Actions         │ WebSockets / SSE
               ▼                               │ Live Sync
┌──────────────────────────────────────────────┴──────────────┐
│                    Application Layer                        │
│  - Next.js Server Components & Route Handlers               │
│  - Role-Based Access Control (RBAC) Engine                  │
│  - Zod Request Validation & Mutation Sanitization          │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Queries / Mutations           │ Publish Events
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Data Storage Layer      │ │     Realtime / Cache       │
│  PostgreSQL Relational DB    │ │  Redis / Pusher / WS Hub   │
│  Multi-tenant Organizations  │ │  Presence & Live Updates   │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Multi-Tenant Hierarchy

Workflow follows a multi-tenant hierarchy designed to support both small developer teams and large enterprises:

1. **Organization**: The top-level account/billing entity (e.g. `Acme Corp`).
2. **Workspace**: A team space within an organization (e.g. `Engineering`, `Design`).
3. **Project**: A distinct codebase or initiative with its own issue sequence key (e.g. `TripTally [TRIP]`).
4. **Issue**: Individual work units (`TRIP-101`) with assigned priority, status, labels, attachments, and sprints.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| Delete Workspace / Org | ✅ | ❌ | ❌ | ❌ |
| Manage Members & Billing | ✅ | ✅ | ❌ | ❌ |
| Create / Delete Projects | ✅ | ✅ | ❌ | ❌ |
| Create & Edit Issues | ✅ | ✅ | ✅ | ❌ |
| Post Comments & Mentions | ✅ | ✅ | ✅ | ❌ |
| View Boards & Issues | ✅ | ✅ | ✅ | ✅ |

---

## 4. Real-time & Optimistic Synchronization

1. **Optimistic Updates**: When a user drags an issue from *To Do* to *In Progress*, the client UI updates immediately without waiting for the network round-trip.
2. **Event Broadcasting**: The server processes the mutation and emits a `RealtimeEvent` to the project channel.
3. **Conflict Resolution**: Client reconciles server timestamps using a Last-Write-Wins (LWW) or version-vector approach.
4. **User Presence**: Live avatars show who is currently viewing or editing an issue.

---

## 5. Keyboard & Productivity Architecture

Workflow provides a keyboard-first navigation model inspired by Linear:
- `⌘ + K` or `Ctrl + K`: Open universal Command Palette.
- `C`: Quick-create issue from anywhere.
- `J` / `K`: Move focus down/up issue list.
- `1 - 5`: Quick-change issue priority.
- `S`: Quick-change issue status.
- `Esc`: Close open modal or clear selection.
