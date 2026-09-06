# AI & GitHub Automation Architecture 🤖⚡

> **Complete guide to GitHub repository integrations, Groq-powered AI issue triage, configurable autonomous cron jobs, and run history in Workflow.**

---

## 📑 Overview

Workflow integrates directly with GitHub repositories and uses **Groq's `openai/gpt-oss-120b`** model to deliver deep code intelligence right within your project boards.

```
┌───────────────────────────┐      ┌───────────────────────────┐
│     GitHub Repository     │ ◄──► │      Workflow Backend     │
│   (REST API + Tree/Files) │      │  (Next.js Server Actions) │
└───────────────────────────┘      └─────────────┬─────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │      Groq AI Engine       │
                                   │   (openai/gpt-oss-120b)   │
                                   └─────────────┬─────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
       ┌───────────────────────────┐                           ┌───────────────────────────┐
       │   On-Demand Issue Triage  │                           │   Configurable Cron Jobs  │
       │   ("Ask AI for Fix")      │                           │   (per description, repo) │
       └───────────────────────────┘                           └───────────────────────────┘
```

---

## 🌟 Core Features

1. **🔗 GitHub Repository Linking**:
   - Link public or private GitHub repositories to any project.
   - Configurable target scanning branch (e.g. `main`, `master`, `develop`).
   - Secure optional Personal Access Token (PAT) storage for private/Custom repositories.

2. **🧠 On-Demand AI Issue Triage ("Ask AI for Fix")**:
   - Directly analyze issue title, description, and comments.
   - Automatically searches project repository files and tree structure.
   - Diagnoses root causes and generates:
     - **Root Cause Analysis**
     - **Target Code Files to Edit**
     - **Unified Diff Code Patch** (formatted for quick review)
     - **Step-by-Step Verification Checklist**

3. **⏱️ Configurable Cron Jobs**:
   - A cron job is **defined by the user**: a **description** of what the job should do, run against a chosen repository, scheduled on a cron expression.
   - Every job links to **any project in the workspace** and **any repository** (the project's repo, another project's repo, or a custom GitHub URL).
   - Jobs are first-class entities (`CronJob`), superseding the old 1:1 `ProjectRepository.cronSchedule` model.
   - Runs automatically via the scheduled endpoint; can also be triggered manually per-job or workspace-wide ("Run All Jobs").
   - Scans the linked repo, prompts Groq for findings aligned with the job's instruction, and creates `[AI Bug Report]` issues on the project board (deduped across runs).

4. **📊 Centralized Cron Dashboard (`/[orgSlug]/[workspaceSlug]/cron`)**:
   - **Metrics**: Active Jobs, Total Runs, Failed Runs, Findings, Next Run.
   - **Job cards**: description, linked repo + branch, next schedule, run/failed counts, last status; per-job **Run Now**, pause/resume, delete.
   - **Combined run history** across every job in the workspace, with per-job history + filters by **cron job, project, status, and date range**.
   - Clicking any completed/failed run navigates to the run detail page.

5. **🔍 Run Detail Page (`/cron/[id]`)**:
   - Dedicated page per cron run: status, timing, findings, root cause analysis, proposed patch, and reproduction steps.
   - Reachable from `/cron` history and the project board's cron modal.

6. **🗂️ Board-Level Cron Modal**:
   - From any project board, schedule **multiple cron jobs** for that project.
   - Each job carries the user's description; recent runs are listed and link to `/cron/[id]`.

---

## ⚙️ Configuration & Environment Variables

Add the following environment variables to your [`.env`](file:///.env) or deployment environment:

```env
# Groq API Key (Required for AI Triage & Cron Jobs)
GROQ_API_KEY="gsk_your_groq_api_key_here"

# Cron Secret for securing background HTTP endpoints (Optional but recommended)
CRON_SECRET="your_secure_cron_secret_token"
```

### Obtaining a Groq API Key
1. Sign up / log in to the [Groq Cloud Console](https://console.groq.com/).
2. Navigate to **API Keys** and generate a new key.
3. Paste the key (`gsk_...`) into `.env` as `GROQ_API_KEY`.

---

## 🗄️ Database Schema

The cron system relies on two models in Prisma:

```prisma
model CronJob {
  id            String    @id @default(cuid())
  workspaceId   String
  projectId     String    // Any project in the workspace
  name          String
  description   String?   // What the user wants this job to do (drives the scan)
  schedule      String    @default("0 12 * * *") // Cron expression
  jobType       String    @default("AI_SCAN")    // Reserved for future job types
  enabled       Boolean   @default(true)
  repoOwner     String
  repoName      String    // Job can target any repo, not just the project's
  defaultBranch String    @default("main")
  accessToken   String?   // Encrypted GitHub PAT for private/custom repos
  lastStatus    String?
  lastRunAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  runs CronExecutionLog[]
}

model CronExecutionLog {
  id            String    @id @default(cuid())
  cronJobId     String?   // Present on scheduled/manual runs of a job
  projectId     String?
  workspaceId   String
  triggerSource String    // "CRON" | "MANUAL"
  status        String    // "SUCCESS" | "FAILED" | "RUNNING"
  findingsCount Int       @default(0)
  issuesCreated Int       @default(0)
  durationMs    Int       @default(0)
  summary       String    @db.Text
  error         String?   @db.Text
  rawOutput     String?   @db.Text
  createdAt     DateTime  @default(now())
}
```

> Legacy `ProjectRepository.cronSchedule` / `aiScanEnabled` fields and the old
> `src/actions/bug-hunt.ts` actions still exist for compatibility, but the
> active system reads only `CronJob`.

---

## 🚀 Setting Up Scheduled Cron Triggers

### 1. Manual / UI Triggers
- Open `/[orgSlug]/[workspaceSlug]/cron` → **New Cron Job** (project, description, schedule, repo) or **Run All Jobs**.
- From any project board, use the **Cron** button in the toolbar to manage that project's jobs.

### 2. External HTTP Cron Webhook (Vercel Cron, GitHub Actions, AWS EventBridge)
The endpoint `/api/cron/bug-hunt` supports both `GET` and `POST` requests and runs every **enabled** `CronJob`.

#### Authorization:
Pass the `CRON_SECRET` in the Authorization header:
```bash
curl -X POST https://your-domain.com/api/cron/bug-hunt \
  -H "Authorization: Bearer your_secure_cron_secret_token"
```

#### GitHub Actions Workflow Example:
Create `.github/workflows/workflow-bug-hunter.yml`:
```yaml
name: Workflow Autonomous Bug Hunter
on:
  schedule:
    - cron: '0 12 * * *' # Every day at 12:00 PM UTC
  workflow_dispatch:

jobs:
  trigger-hunt:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Workflow Bug Hunter
        run: |
          curl -X POST "${{ secrets.WORKFLOW_APP_URL }}/api/cron/bug-hunt" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 🛠️ Code Architecture & Key Files

| File | Purpose |
| :--- | :--- |
| `src/lib/github/client.ts` | GitHub REST client for verifying repos, fetching branch refs, trees, and file contents. |
| `src/lib/ai/groq.ts` | Groq AI engine implementing `openai/gpt-oss-120b` triage prompts & structured JSON parsing. |
| `src/lib/ai/bug-hunter.ts` | Scanning engine: `executeScan` runs a scan for a target repo + instruction; `runCronJobScan` runs a `CronJob` and logs a `CronExecutionLog`. |
| `src/lib/cron.ts` | `computeNextRun` — cron-expression to next-run-date helper (covered by unit tests). |
| `src/actions/cron-jobs.ts` | Server Actions: create/update/delete/toggle/run cron jobs, list jobs, run history, run detail, project/workspace queries, permission-guarded. |
| `src/actions/bug-hunt.ts` | Legacy actions (repo overview + run history) still used by the workspace AI scanner settings. |
| `src/actions/ai-triage.ts` | Server Actions for on-demand issue triage (`triageIssueWithAI`). |
| `src/app/api/cron/bug-hunt/route.ts` | Route handler for external automated cron execution (runs all enabled `CronJob`s). |
| `src/components/cron/cron-management-client.tsx` | `/cron` dashboard: metrics, job cards, combined + filtered run history. |
| `src/components/cron/create-cron-job-dialog.tsx` | Job creation UI: project picker, name, description, schedule, repo mode (project/other/custom), branch & token. |
| `src/components/cron/project-cron-dialog.tsx` | Board-level cron modal: that project's jobs + recent runs + create. |
| `src/app/(dashboard)/[orgSlug]/[workspaceSlug]/cron/[id]/page.tsx` | Run detail page: status, duration, findings, root cause, patch, reproduction. |
| `src/components/repositories/repository-settings-dialog.tsx` | Legacy repository connection modal (branch selection & AI toggles). |