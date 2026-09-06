# AI & GitHub Automation Architecture 🤖⚡

> **Complete guide to GitHub repository integrations, Groq-powered AI issue triage, autonomous scheduled bug hunting, and cron execution management in Workflow.**

---

## 📑 Overview

Workflow integrates directly with GitHub repositories and uses **Groq's Llama 3.3 70B** model to deliver deep code intelligence right within your project boards.

```
┌───────────────────────────┐      ┌───────────────────────────┐
│     GitHub Repository     │ ◄──► │      Workflow Backend     │
│   (REST API + Tree/Files) │      │  (Next.js Server Actions) │
└───────────────────────────┘      └─────────────┬─────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │      Groq AI Engine       │
                                   │  (openai/gpt-oss-120b)│
                                   └─────────────┬─────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
       ┌───────────────────────────┐                           ┌───────────────────────────┐
       │   On-Demand Issue Triage  │                           │   Autonomous Bug Hunter   │
       │   ("Ask AI for Fix")      │                           │   (Scheduled Cron Jobs)   │
       └───────────────────────────┘                           └───────────────────────────┘
```

---

## 🌟 Core Features

1. **🔗 GitHub Repository Linking**:
   - Link public or private GitHub repositories to any project.
   - Configurable target scanning branch (e.g. `main`, `master`, `develop`).
   - Secure Optional Personal Access Token (PAT) storage for private repositories.
   - Real-time connection testing & branch validation.

2. **🧠 On-Demand AI Issue Triage ("Ask AI for Fix")**:
   - Directly analyze issue title, description, and comments.
   - Automatically searches project repository files and tree structure.
   - Diagnoses root causes and generates:
     - **Root Cause Analysis**
     - **Target Code Files to Edit**
     - **Unified Diff Code Patch** (formatted for quick review)
     - **Step-by-Step Verification Checklist**

3. **Autonomous Scheduled Bug Hunter**:
   - Periodically scans repository source files for security vulnerabilities, logic flaws, memory leaks, and unhandled edge cases.
   - Assigns severity scores (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Automatically creates structured issues on your Kanban board tagged with `[AI Bug Report]` under the `Backlog` column.
   - Prevents duplicate bug creation across repeated scan runs.

4. **⏱️ Centralized Cron Jobs & AI Management Dashboard**:
   - Dedicated route at `/[orgSlug]/[workspaceSlug]/cron`.
   - **Metrics Overview**: Connected Repos, Total Runs, Bugs Discovered, Issues Auto-Created.
   - **Project Job Controls**: Per-project triggers (**"Run Hunt"**), schedule config dialogs, and workspace-wide **"Run All Scans"**.
   - **Audit Trail & Execution Logs**: Full history with status filters (`ALL`, `COMPLETED`, `FAILED`, `IN_PROGRESS`) and slide-over deep inspection drawers showing patch diffs.

---

## ⚙️ Configuration & Environment Variables

Add the following environment variables to your [`.env`](file:///.env) or deployment environment:

```env
# Groq API Key (Required for AI Triage & Bug Hunter)
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

The automation system utilizes three models in Prisma:

```prisma
model ProjectRepository {
  id              String         @id @default(cuid())
  projectId       String         @unique
  project         Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  repoOwner       String
  repoName        String
  defaultBranch   String         @default("main")
  accessToken     String?        // Encrypted / secured PAT
  isPrivate       Boolean        @default(false)
  aiEnabled       Boolean        @default(true)
  bugHuntSchedule String         @default("0 12 * * *") // Daily 12:00 PM
  lastScannedAt   DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  cronRuns        CronExecution[]

  @@index([projectId])
}

model CronExecution {
  id                  String             @id @default(cuid())
  projectRepositoryId String
  projectRepository   ProjectRepository  @relation(fields: [projectRepositoryId], references: [id], onDelete: Cascade)
  status              CronRunStatus      @default(IN_PROGRESS) // IN_PROGRESS | COMPLETED | FAILED
  findingsCount       Int                @default(0)
  issuesCreated       Int                @default(0)
  findingsPayload     Json?
  errorMessage        String?
  startedAt           DateTime           @default(now())
  completedAt         DateTime?

  @@index([projectRepositoryId])
  @@index([startedAt])
}
```

---

## 🚀 Setting Up Scheduled Cron Triggers

### 1. Internal Manual Trigger
- Navigate to **"Cron Jobs & AI"** from the sidebar (`/[orgSlug]/[workspaceSlug]/cron`).
- Click **"Run Hunt"** on any project card or **"Run All Scans"** at the top.

### 2. External HTTP Cron Webhook (Vercel Cron, GitHub Actions, AWS EventBridge)
The endpoint `/api/cron/bug-hunt` supports both `GET` and `POST` requests.

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
| `src/lib/ai/bug-hunter.ts` | Autonomous scanning engine: downloads repo sample files, prompts Groq for bugs, and creates board issues. |
| `src/actions/repository.ts` | Server Actions for linking/unlinking repositories and updating branch & AI configurations. |
| `src/actions/ai-triage.ts` | Server Actions for on-demand issue triage (`triageIssueWithAI`). |
| `src/actions/bug-hunt.ts` | Server Actions for manual run triggers, statistics aggregation, and execution logs query. |
| `src/app/api/cron/bug-hunt/route.ts` | Next.js Route Handler for external automated cron execution. |
| `src/components/repositories/repository-settings-dialog.tsx` | Repository connection modal with branch selection & AI toggles. |
| `src/components/cron/cron-management-client.tsx` | Interactive dashboard for managing cron jobs, inspecting runs, and viewing patches. |
