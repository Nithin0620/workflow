# Real-Time Synchronization & Live Presence

Workflow is designed with an event-driven real-time pipeline to provide immediate collaborative updates between engineers.

---

## 1. Real-Time Event Architecture

1. **Scoped Channels**:
   * `workspace:{workspaceId}` — Workspace-level events (member joined, project created).
   * `project:{projectId}` — Kanban board events (issue created, moved, deleted).
   * `issue:{issueId}` — Issue-level events (comments, description edits, typing presence).

2. **Optimistic UI Updates**:
   * When an issue is dragged from *To Do* to *In Progress*, local state updates in `0ms`.
   * The mutation is dispatched asynchronously to `moveIssue()`.
   * If the network fails, the UI rolls back gracefully to the previous state.

3. **Presence Indicators**:
   * Live avatars show which engineers are currently viewing a board or editing an issue.
