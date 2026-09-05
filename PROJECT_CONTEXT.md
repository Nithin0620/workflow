# Workflow — AI & Developer Project Context

> **Workflow** is a real-time engineering & project management platform built for modern product teams, combining the speed and keyboard-first UX of Linear with the structural power of Jira and collaborative nature of GitHub Issues.

---

## 🧠 Memory & Continuity Context

When working on this repository across AI sessions or developer handoffs, use this document as the single source of truth for design patterns, domain logic, and architecture.

### 🏢 Domain Model & Hierarchy

```
Organization (e.g. Acme Corp)
   │
   └── Workspace (e.g. Engineering)
          │
          ├── Project (e.g. Web App, Mobile App, API Gateway)
          │      │
          │      ├── Sprint (optional timeboxed cycle)
          │      │
          │      └── Issue #101, Issue #102, Issue #103...
          │             │
          │             ├── Comments (Markdown & @mentions)
          │             ├── Attachments (Files & Images)
          │             ├── Labels & Story Points
          │             └── Activity History / Audit Trail
          │
          └── Workspace Members & Roles
                 ├── OWNER (Full system & billing control)
                 ├── ADMIN (Project creation, team management)
                 ├── MEMBER (Create, update issues & comments)
                 └── VIEWER (Read-only observation)
```

---

## 🛠 Tech Stack & Theme

- **Frontend & Meta-Framework**: Next.js (App Router), React 19, TypeScript
- **Theme & Design**: Pure Black (`#000000`) and Pure White (`#ffffff`) high-contrast monochrome aesthetic
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, class-variance-authority, clsx, tailwind-merge
- **Authentication**: NextAuth.js / Auth.js (Google OAuth, GitHub OAuth, and Email/Password with bcrypt)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Validation**: Zod (shared client/server schemas)
- **Testing**: Vitest, React Testing Library, JSDOM, Playwright (Unit, Sanity, Smoke, Integration, Regression, E2E)
- **Real-time Layer**: WebSockets / SSE / Pusher / Supabase Realtime
- **Keyboard & Productivity**: Global Command Palette (`⌘K`), quick-action shortcuts (`C` for create issue, `J`/`K` navigation)

---

## 📁 Repository Layout & Centralized Documentation

All technical documentation is centralized in [`docs/`](file:///home/nithin/Projects/workflow/docs/):

```
/workflow
├── docs/                                          # Centralized Documentation
│   ├── README.md                                  # Documentation directory hub
│   ├── auth/authentication.md                     # OAuth & Credentials auth
│   ├── database/schema-and-models.md              # PostgreSQL schema & Prisma models
│   ├── workspaces/hierarchy-and-rbac.md           # Org -> Workspace -> Project hierarchy & RBAC
│   ├── projects-and-issues/kanban-and-issues.md   # Kanban engine & fractional indexing
│   ├── api-and-actions/server-actions-and-routes.md # Server actions & API routes
│   ├── components-and-ui/component-architecture.md # UI primitives & layout components
│   ├── realtime/realtime-architecture.md          # Live sync & presence indicators
│   └── testing/test-strategy.md                   # Full testing strategy across all 6 tiers
├── prisma/
│   └── schema.prisma                              # Normalized PostgreSQL schema
├── tests/                                         # Multi-Tier Test Suites
│   ├── unit/                                      # Unit tests (validators, utils, password, constants, comments)
│   ├── sanity/                                    # Sanity tests (Prisma singleton, Auth options)
│   ├── smoke/                                     # Smoke tests (Components, route callbacks)
│   ├── integration/                               # Integration tests (Complete lifecycle simulation)
│   ├── regression/                                # Regression tests (Edge cases & boundary constraints)
│   ├── e2e/                                       # Playwright E2E browser tests
│   └── setup.ts                                   # Test setup & DOM matchers
├── src/
│   ├── app/                                       # Next.js App Router (public landing, how-it-works, auth & dashboard)
│   ├── components/                                # UI, Kanban, Project, and Layout components
│   ├── lib/                                       # DB, Auth, Validators, Constants, Utils
│   ├── hooks/                                     # Custom React hooks
│   ├── actions/                                   # Server Actions (auth, workspaces, projects, issues)
│   ├── stores/                                    # Client state stores
│   └── types/                                     # TypeScript domain types & next-auth augmentations
├── ARCHITECTURE.md                                # System architecture overview
├── ROADMAP.md                                     # Milestone progress & development phases
├── PROJECT_CONTEXT.md                             # AI context & memory ledger (this file)
└── README.md                                      # Primary project overview
```

---

## 🔄 Current Project State & Completed Modules

- [x] Initial Next.js App Router + TypeScript + Tailwind CSS v4 setup.
- [x] Pure Black & Pure White modern aesthetic.
- [x] Public Landing Page (`src/app/page.tsx`) with hero, live Kanban mockup, domain hierarchy, and feature breakdown.
- [x] Public Step-by-Step User Guide (`src/app/how-it-works/page.tsx`).
- [x] Full scalable directory hierarchy.
- [x] Prisma PostgreSQL Schema configured (`Account`, `Session`, `User`, `Organization`, `Workspace`, `WorkspaceMember`, `Project`, `Issue`, `Comment`, `Attachment`, `ActivityLog`).
- [x] Authentication layer configured for **Google OAuth**, **GitHub OAuth**, and **Email + Password (bcrypt)**.
- [x] Server Actions implemented for User Registration, Workspace Management, Project Management, and Issue Management.
- [x] Multi-tenant Dashboard UI built:
  - Responsive Sidebar & Top Header with User Menu & Sign Out.
  - Workspace Switcher dropdown.
  - Workspace Overview Dashboard with live metrics.
  - Projects Directory & Project Creation Modal.
  - Interactive Kanban Board with status columns (`Backlog`, `To Do`, `In Progress`, `In Review`, `Done`), drag-and-drop moves, priority badges, and issue creation.
  - Slide-over / Modal Issue Detail view with Markdown description editing, inline status/priority pickers, and threaded comments.
  - Workspace Settings & Team Member Directory.
  - Analytics & Throughput dashboard.
- [x] Global Command Palette modal (`⌘K`).
- [x] Centralized modular documentation in `docs/` (`auth/`, `database/`, `workspaces/`, `projects-and-issues/`, `api-and-actions/`, `components-and-ui/`, `realtime/`, `testing/`).
- [x] Complete multi-tier test infrastructure implemented: **Unit, Sanity, Smoke, Integration, Regression, and E2E** test suites passing 100%.
- [ ] Real-time WebSocket event broadcaster & presence indicators (Phase 4).
