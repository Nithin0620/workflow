# GitHub Codebase Knowledge Graph Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive 2D Force-Directed Knowledge & Architecture Graph Explorer (inspired by GraphIQ) for connected GitHub repositories in Workflow projects, visualizing file hierarchies, module dependencies, API routes, and linking to project issues.

**Architecture:** 
1. **GitHub Ingestion & Dependency Extraction**: Fetch repository tree via official GitHub REST API (`/git/trees/{tree_sha}?recursive=1`) and parse imports/dependencies into nodes and directed edges with layer classification.
2. **Graph Data Engine & Cache**: Store & cache graph structures in PostgreSQL/memory for fast retrieval and offline exploration.
3. **Interactive 2D Force Graph Canvas**: Render physics-simulated node-link graph with clustering, filtering by layer/folder, search, node inspector drawer, and Kanban issue cross-referencing.
4. **Natural Language / Subgraph Filter**: Query the graph with natural language keywords or dependency tracing.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, `react-force-graph-2d` / HTML5 Canvas / D3-force, Tailwind CSS, Lucide Icons, Prisma 6, Vitest.

**Spec:** GitHub Knowledge Graph Explorer within Project Dashboard.

## Global Constraints
- Only use official GitHub REST API (`api.github.com`) using existing project PAT or public access.
- No paid third-party graph or parsing SaaS needed; 100% self-contained in Next.js.
- Ensure performant 60fps canvas rendering for repos with 1,000+ files.
- All server actions must respect multi-tenant project RBAC via `requireProjectAccess(projectId)`.

---

## Architecture & API Overview

### GitHub API Usage
- **Repository Tree Endpoint**: `GET https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1`
  - Fetches the entire repository structure in a single request.
- **Rate Limits & Auth**:
  - Uses `accessToken` from `ProjectRepository` (5,000 req/hr).
  - Fallback to unauthenticated rate limits for public repositories (60 req/hr).
- **Data Extracted**:
  - Files, directories, file sizes, file extensions, paths.
  - Dependency connections (via lightweight import/export parsing).

---

## File Structure

```
src/
├── types/
│   └── code-graph.ts                         # Node, Edge, GraphFilter, Cluster types
├── lib/
│   └── github/
│       ├── graph-builder.ts                  # Transforms GitHub tree into graph nodes & edges
│       └── dependency-parser.ts              # Extracts imports/relations between files
├── actions/
│   └── code-graph.ts                         # Server action to generate/fetch project repo graph
└── components/
    └── code-graph/
        ├── codebase-graph-view.tsx           # Main container with toolbar, search, canvas, inspector
        ├── force-graph-canvas.tsx            # 2D Canvas force-directed renderer (with dynamic import)
        ├── graph-controls.tsx                # Zoom, physics reset, clustering, layer filters
        ├── graph-node-inspector.tsx          # Slide-over sidebar showing file details, imports, issues
        └── graph-search-bar.tsx              # Quick filter / NLP highlight search
```

---

## Tasks

### Task 1: Core Types and Graph Builder Engine
**Files:**
- Create: `src/types/code-graph.ts`
- Create: `src/lib/github/dependency-parser.ts`
- Create: `src/lib/github/graph-builder.ts`
- Test: `tests/unit/code-graph-builder.test.ts`

**Interfaces:**
- `GraphNode`: `{ id: string, name: string, path: string, type: 'file' | 'directory' | 'issue', layer: string, size?: number, val: number, color?: string }`
- `GraphEdge`: `{ source: string, target: string, type: 'import' | 'contains' | 'references' }`
- `buildCodebaseGraph(tree: GithubTreeItem[], fileContents?: Map<string, string>): CodebaseGraphData`

- [ ] **Step 1: Write the failing unit tests for graph builder and dependency parser**
- [ ] **Step 2: Implement `src/types/code-graph.ts`**
- [ ] **Step 3: Implement `src/lib/github/dependency-parser.ts`** (regex parser for JS/TS/Python/Prisma imports)
- [ ] **Step 4: Implement `src/lib/github/graph-builder.ts`** (tree traversal, directory hierarchy, layer categorization)
- [ ] **Step 5: Run tests and verify they pass**

---

### Task 2: Server Actions & GitHub Tree Fetcher
**Files:**
- Create: `src/actions/code-graph.ts`
- Modify: `src/lib/github/client.ts`
- Test: `tests/unit/code-graph-actions.test.ts`

**Interfaces:**
- `fetchRepositoryTree(owner: string, repo: string, branch: string, token?: string): Promise<GithubTreeResponse>`
- `getProjectCodebaseGraph(projectId: string): Promise<{ success: boolean, graph?: CodebaseGraphData, error?: string }>`

- [ ] **Step 1: Add `fetchRepositoryTree` to `src/lib/github/client.ts`**
- [ ] **Step 2: Write failing tests for `getProjectCodebaseGraph`**
- [ ] **Step 3: Implement `src/actions/code-graph.ts`** with authentication, RBAC, and issue cross-referencing
- [ ] **Step 4: Run tests and verify they pass**

---

### Task 3: Interactive 2D Force Graph Component
**Files:**
- Create: `src/components/code-graph/force-graph-canvas.tsx`
- Create: `src/components/code-graph/graph-controls.tsx`
- Create: `src/components/code-graph/graph-node-inspector.tsx`
- Create: `src/components/code-graph/graph-search-bar.tsx`
- Create: `src/components/code-graph/codebase-graph-view.tsx`
- Test: `tests/unit/codebase-graph-view.test.tsx`

**Features:**
- HTML5 Canvas dynamic force simulation (zoom, pan, drag nodes, auto-center).
- Color coding by layer (Components, Actions, API Routes, DB/Prisma, Config, Docs).
- Node click opens Inspector Drawer with file path, connected edges, size, and linked Kanban issues.
- Search input to filter and highlight matching nodes in real time.

- [ ] **Step 1: Install `force-graph` or build custom canvas / SVG force layout with D3**
- [ ] **Step 2: Create `force-graph-canvas.tsx` with dynamic client-side SSR disabling**
- [ ] **Step 3: Create `graph-node-inspector.tsx` and `graph-controls.tsx`**
- [ ] **Step 4: Create `codebase-graph-view.tsx` combining canvas, toolbar, search, and inspector**
- [ ] **Step 5: Write unit tests for `codebase-graph-view.tsx` and verify**

---

### Task 4: Project Dashboard Integration & Tab Navigation
**Files:**
- Modify: `src/app/(dashboard)/workspaces/[workspaceSlug]/projects/[projectKey]/page.tsx` (or project tabs layout)
- Modify: `src/components/projects/project-header.tsx`
- Test: `tests/smoke/code-graph-smoke.test.tsx`

**Features:**
- Add "Code Graph" / "Architecture" tab in project header navigation.
- Render graph explorer when repository is connected, or prompt to connect repo if not configured yet.

- [ ] **Step 1: Add "Code Graph" tab to project view / tabs**
- [ ] **Step 2: Integrate `CodebaseGraphView` into project dashboard page**
- [ ] **Step 3: Run smoke tests and full test suite (`pnpm test`)**
- [ ] **Step 4: Verify end-to-end responsiveness and build check**
