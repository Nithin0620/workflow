# Component Architecture & UI System

Workflow follows a modern, modular design system built with Tailwind CSS v4 and Lucide Icons.

---

## 1. Directory Structure

* **[`src/components/ui/`](file:///home/nithin/Projects/workflow/src/components/ui/)**: Atomic UI building blocks:
  * `button.tsx`: Variant-driven button (`default`, `outline`, `secondary`, `destructive`, `ghost`).
  * `badge.tsx`: Status and priority indicator pills.
  * `card.tsx`: Surface containers with `CardHeader`, `CardTitle`, and `CardContent`.
* **[`src/components/common/`](file:///home/nithin/Projects/workflow/src/components/common/)**: Application shell components:
  * `sidebar.tsx`: Responsive navigation sidebar with workspace switcher and project list.
  * `header.tsx`: Top application bar with `⌘K` trigger and user menu.
  * `command-palette.tsx`: Global search and shortcut executor.
  * `session-provider.tsx`: Client-side NextAuth context wrapper.
* **[`src/components/workspaces/`](file:///home/nithin/Projects/workflow/src/components/workspaces/)**:
  * `workspace-switcher.tsx`: Fast dropdown for switching between organizations and workspaces.
* **[`src/components/projects/`](file:///home/nithin/Projects/workflow/src/components/projects/)**:
  * `create-project-dialog.tsx`: Modal for creating projects with automatic key generator.
* **[`src/components/issues/`](file:///home/nithin/Projects/workflow/src/components/issues/)**:
  * `kanban-board.tsx`: Top-level board container with search filtering and column orchestration.
  * `kanban-column.tsx`: Droppable column container with stage badge and add issue trigger.
  * `issue-card.tsx`: Draggable issue ticket with key, priority icon, story points, and assignee avatar.
  * `create-issue-dialog.tsx`: Comprehensive modal for fast issue creation.
