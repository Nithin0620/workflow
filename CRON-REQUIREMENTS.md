# Cron Jobs — Feature Requirements (source of truth)

> Context captured from product conversation. Do not lose. Any implementation
> of the cron system must satisfy ALL items below.

## 1. Configurable jobs
- A cron job must be **configurable**: the user decides what the job does,
  not a hardcoded "bug fix" behavior.
- Each job should support a **description** of what it should do (written by
  the user).

## 2. Repo linking
- In the **/cron** tab, when creating a new cron job the user can link it to
  the same repository OR a **different repository**.

## 3. Project linking
- Every cron job created from **/cron** must be linkable to **any project in
  the workspace** (not just one default project).

## 4. Project-level cron scheduling (board)
- The cron scheduling surface reachable from a **project (board)** must allow
  creating **multiple cron jobs**.
- Users can write a **description** of what that cron job should do.

## 5. Results page `/cron/[id]`
- A dedicated page at **/cron/[id]** shows the details of a **single cron run**
  (its result, patches, logs, status, timing).

## 6. History visibility
- On the **/cron** page and on the **cron modal in /board**, the user can see
  run history: **how many ran**, **how many failed**, and the **future
  schedule**.
- Clicking a **failed** or **completed** run navigates to **/cron/[id]**.

## 7. Combined + individual history with filters on /cron
- The **/cron** page shows the **combined history of every cron job** in the
  workspace.
- It also supports viewing **individual** cron history.
- History should be filterable (status, cron job, date, etc.).

---

## Current implementation knowns (as of this prompt)
- Cron is currently tied 1:1 to a repository via `ProjectRepository.cronSchedule`
  and only runs the bug-hunt job (`/api/cron/bug-hunt`).
- `CronExecutionLog` exists in Prisma and holds per-run logs.
- `/cron` page + `cron-management-client.tsx` exist.
- See `docs/ai-and-automation/ai-and-cron-automation.md` for existing behavior.