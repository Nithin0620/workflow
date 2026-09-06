# Workflow Documentation Hub 📚

Welcome to the centralized documentation directory for **Workflow**.

---

## 📑 Documentation Index

| Module | Document | Description |
| :--- | :--- | :--- |
| **Authentication** | [Authentication Architecture](./auth/authentication.md) | Google, GitHub, and Email/Password auth, session guards, and bcrypt hashing. |
| **Database** | [Database Schema & Models](./database/schema-and-models.md) | PostgreSQL ER diagrams, Prisma models, relations, and indexes. |
| **Workspaces** | [Hierarchy & RBAC](./workspaces/hierarchy-and-rbac.md) | 4-tier domain hierarchy (`Org ➔ Workspace ➔ Project ➔ Issue`) and role permissions. |
| **Projects & Issues** | [Kanban & Issues](./projects-and-issues/kanban-and-issues.md) | Project key generation, atomic issue numbering, and fractional indexing. |
| **API & Actions** | [Server Actions & Routes](./api-and-actions/server-actions-and-routes.md) | Server Action mutation signatures and NextAuth API route handlers. |
| **UI Components** | [Component Architecture](./components-and-ui/component-architecture.md) | Atomic UI primitives, application shell, and Kanban board components. |
| **Real-Time** | [Realtime & Live Sync](./realtime/realtime-architecture.md) | Scoped channels, presence indicators, and optimistic updates. |
| **AI & Automation** | [AI & GitHub Automation](./ai-and-automation/ai-and-cron-automation.md) | GitHub integration, Groq `openai/gpt-oss-120b` triage, configurable Cron Jobs, and run history. |
| **Testing** | [Testing Strategy & Suites](./testing/test-strategy.md) | Unit, Sanity, Smoke, Integration, Regression, and E2E Playwright test guide. |
