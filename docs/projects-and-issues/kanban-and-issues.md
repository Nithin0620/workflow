# Project Management & Kanban Engine

The issue management engine in Workflow is optimized for high velocity, minimal click fatigue, and instant optimistic feedback.

---

## 1. Project Keys & Atomic Sequence Numbering

Each project has a short, unique alphanumeric key (e.g. `TRIP`, `DEV`, `APP`).
* When an issue is created, the server executes an atomic database increment on `project.issueSequence`.
* This guarantees that concurrent issue creations never produce duplicate issue numbers (`TRIP-101`, `TRIP-102`).

---

## 2. Kanban Stages & Statuses

Workflow supports 6 standard engineering stages defined in [`src/lib/constants.ts`](file:///home/nithin/Projects/workflow/src/lib/constants.ts):

1. **`BACKLOG`** (Grey) — Triage and long-term ideas.
2. **`TODO`** (Slate) — Ready for current sprint development.
3. **`IN_PROGRESS`** (Blue) — Actively being worked on by an assignee.
4. **`IN_REVIEW`** (Amber) — Pull Request / Code review stage.
5. **`DONE`** (Emerald) — Completed and verified.
6. **`CANCELED`** (Rose) — Obsolete or rejected task.

---

## 3. Fractional Indexing for Drag & Drop

Rather than updating every issue's integer index on drag-and-drop:
* Each issue has a `Float` column `order`.
* When moving an issue between two cards with order `A` and `B`, the new order is calculated as `(A + B) / 2`.
* This ensures that every card drag requires updating **only 1 database row**.
