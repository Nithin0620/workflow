# Workflow ⚡

> **A real-time engineering & project management platform built for speed, clarity, and collaboration.**

Workflow brings together the high-velocity, keyboard-first user experience of Linear with the rich issue-tracking capabilities of Jira and the collaborative features of modern SaaS applications.

---

## 🌟 Key Features

- **🏢 Multi-Tenant Workspace Hierarchy**: Organizations ➔ Workspaces ➔ Projects ➔ Sprints ➔ Issues.
- **🔐 Multi-Provider Authentication**: Google OAuth, GitHub OAuth, and traditional Email + Password with bcrypt.
- **⚡ Interactive Kanban Engine**: 6 stages (`Backlog`, `To Do`, `In Progress`, `In Review`, `Done`, `Canceled`) with fractional indexing.
- **🎯 Issue & Task Management**: Priority levels, custom statuses, assignees, labels, story points, and due dates.
- **💬 Discussions & Audit Trail**: Threaded Markdown comments, user @mentions, and immutable activity logs.
- **⌨️ Keyboard-First Productivity**: Global Command Palette (`⌘K`), quick-action shortcuts (`C` for create, `J`/`K` navigation).
- **🔒 Role-Based Access Control (RBAC)**: Fine-grained permissions for Owners, Admins, Members, and Viewers.
- **📊 Analytics & Dashboards**: Team velocity, burn-down metrics, and sprint progress tracking.

---

## 🏗 Hierarchy Overview

```
Organization (e.g. Acme Corp)
   │
   └── Workspace (e.g. Engineering)
          │
          ├── Project: TripTally [TRIP]
          │      ├── Issue #101 — Fix login bug
          │      ├── Issue #102 — Add payment gateway
          │      └── Issue #103 — Improve dashboard
          │
          └── Project: Mobile App [APP]
                 ├── Issue #201 — Push notification setup
                 └── Issue #202 — Offline sync support
```

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Lucide Icons
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js / Auth.js](https://next-auth.js.org/) (Google, GitHub, Credentials)
- **Validation**: [Zod](https://zod.dev/)

---

## 📚 Centralized Documentation

All architecture and technical specifications are organized within the [`docs/`](./docs/) directory:

- 📖 **[`docs/README.md`](./docs/README.md)** — Master documentation index
- 🔐 **[`docs/auth/authentication.md`](./docs/auth/authentication.md)** — Google, GitHub & Credentials Auth + RBAC guards
- 🗄️ **[`docs/database/schema-and-models.md`](./docs/database/schema-and-models.md)** — PostgreSQL ER models & Prisma schema
- 🏢 **[`docs/workspaces/hierarchy-and-rbac.md`](./docs/workspaces/hierarchy-and-rbac.md)** — 4-Tier domain hierarchy & permissions
- 📋 **[`docs/projects-and-issues/kanban-and-issues.md`](./docs/projects-and-issues/kanban-and-issues.md)** — Issue numbering & Kanban engine
- ⚡ **[`docs/api-and-actions/server-actions-and-routes.md`](./docs/api-and-actions/server-actions-and-routes.md)** — Server Action mutations & routes
- 🎨 **[`docs/components-and-ui/component-architecture.md`](./docs/components-and-ui/component-architecture.md)** — UI components & layout system
- 📡 **[`docs/realtime/realtime-architecture.md`](./docs/realtime/realtime-architecture.md)** — Real-time event bus & optimistic UI

---

## 🧠 AI Session Continuity & Developer Context

- **[`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md)**: Master context ledger detailing current progress, architectural decisions, and coding standards.
- **[`ROADMAP.md`](./ROADMAP.md)**: Tracks active and upcoming milestone phases.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**: High-level architectural overview.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- `pnpm` (recommended), `npm`, or `yarn`

### Installation
```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Generate Prisma client
pnpm prisma generate

# 4. Run development server (when ready)
pnpm dev
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
