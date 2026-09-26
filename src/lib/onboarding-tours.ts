import type { Driver } from "driver.js";
import { driver } from "driver.js";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

export interface TourStepDef {
  /** CSS selector of the element to spotlight, e.g. "[data-tour='new-issue']" */
  element: string;
  title: string;
  desc: string;
  side?: Side;
  align?: Align;
}

export interface TourDef {
  id: string;
  steps: TourStepDef[];
}

/**
 * All guided tours, keyed by page. Steps target stable `[data-tour]`
 * attributes — when the UI changes, move the attribute, not the whole config.
 */
export const TOURS: Record<string, TourDef> = {
  dashboard: {
    id: "dashboard",
    steps: [
      {
        element: "[data-tour='dash-stats']",
        title: "Your workspace at a glance",
        desc: "Projects, team members, live discussions, and database connection status — rolled up across all your workspaces.",
      },
      {
        element: "[data-tour='create-workspace']",
        title: "Create a workspace",
        desc: "Spin up a new space for an engineering, product, or design team anytime.",
      },
      {
        element: "[data-tour='workspaces-grid']",
        title: "Your workspaces",
        desc: "Each card shows workspace banners, project & member counts, and one click takes you inside.",
      },
      {
        element: "[data-tour='dash-discussions']",
        title: "Active discussions hub",
        desc: "Jump into real-time channels and team threads synchronized across all workspaces.",
      },
      {
        element: "[data-tour='infra']",
        title: "Platform Capabilities & Planned Journeys",
        desc: "Explore what's live in your workspace today and discover upcoming capabilities on our planned roadmap.",
      },
    ],
  },
  workspace: {
    id: "workspace",
    steps: [
      {
        element: "[data-tour='ws-banner']",
        title: "Workspace banner",
        desc: "Auto-attached banner slides through custom images. Hover to pause, or edit images anytime.",
      },
      {
        element: "[data-tour='ws-metrics']",
        title: "Live metrics",
        desc: "Active projects, total issues, in-progress work, and completed tickets across this workspace.",
      },
      {
        element: "[data-tour='ws-projects']",
        title: "Your projects",
        desc: "Project cards with live banners and issue counts. Clicking one opens its Kanban board.",
      },
      {
        element: "[data-tour='ws-discussions']",
        title: "Discussions & Collaboration",
        desc: "Real-time channels, thread discussions, and instant issue generation.",
      },
      {
        element: "[data-tour='ws-view-all']",
        title: "View all projects",
        desc: "Jump to the full projects catalog to see every project in this workspace.",
      },
    ],
  },
  projects: {
    id: "projects",
    steps: [
      {
        element: "[data-tour='projects-header']",
        title: "Projects Directory",
        desc: "Manage all codebases, initiatives, and teams within this workspace.",
      },
      {
        element: "[data-tour='projects-grid']",
        title: "Project Cards & Banners",
        desc: "Inspect project keys, descriptions, customizable banners, and live issue counts.",
      },
    ],
  },
  board: {
    id: "board",
    steps: [
      {
        element: "[data-tour='board-toolbar']",
        title: "Your board toolbar",
        desc: "Everything you need lives here — live sync badge, project key, search, filters, and actions.",
      },
      {
        element: "[data-tour='board-search']",
        title: "Search & filter issues",
        desc: "Find any issue by title or key (e.g. DEV-102). Works across both Board and List views.",
      },
      {
        element: "[data-tour='board-sprints']",
        title: "Sprint planning",
        desc: "Create sprints, set dates, and move backlog issues into active sprints with milestone tracking.",
      },
      {
        element: "[data-tour='board-banners']",
        title: "Project banner customizer",
        desc: "The toolbar backdrop slides through your project's banner images. Add or remove images anytime.",
      },
      {
        element: "[data-tour='board-repo']",
        title: "GitHub & AI integration",
        desc: "Link this project to a GitHub repo to enable AI triage, autonomous bug hunting, and scheduled scans.",
      },
      {
        element: "[data-tour='board-access']",
        title: "Access & permissions",
        desc: "Control who can view or edit the project — Public vs Private, with Owner / Editor / Viewer roles.",
      },
      {
        element: "[data-tour='new-issue']",
        title: "Create issues fast",
        desc: "Opens the new-issue dialog — markdown descriptions, attachments, priority, and assignees.",
      },
      {
        element: "[data-tour='view-toggle']",
        title: "Board ⇄ List view",
        desc: "Flip between visual Kanban columns and a compact table listing.",
      },
      {
        element: "[data-tour='board-columns']",
        title: "Drag & drop columns",
        desc: "Cards snap smoothly between status columns with fractional float indexing and realtime sync.",
      },
    ],
  },
  discussions: {
    id: "discussions",
    steps: [
      {
        element: "[data-tour='disc-sidebar']",
        title: "Workspace Channels & Groups",
        desc: "Browse workspace-wide channels (#general, #announcements) and project-specific groups.",
      },
      {
        element: "[data-tour='disc-search']",
        title: "Search Discussions",
        desc: "Instantly search messages, channel topics, and discussions across the entire workspace (⌘K).",
      },
      {
        element: "[data-tour='disc-header']",
        title: "Channel & Live Sync",
        desc: "View current channel details, linked projects, and real-time SSE connection status.",
      },
      {
        element: "[data-tour='disc-feed']",
        title: "Real-time Message Stream",
        desc: "Chat with teammates, add emoji reactions, reply in threaded discussions, or tag issues.",
      },
      {
        element: "[data-tour='disc-composer']",
        title: "Rich Markdown Composer",
        desc: "Write messages with rich formatting, code blocks, @mentions, and live typing indicators.",
      },
    ],
  },
  whiteboards: {
    id: "whiteboards",
    steps: [
      {
        element: "[data-tour='whiteboards-header']",
        title: "Collaborative Whiteboards",
        desc: "Infinite visual canvas for system architecture, ER diagrams, flowcharts, and team brainstorming.",
      },
      {
        element: "[data-tour='create-whiteboard-btn']",
        title: "Create New Canvas",
        desc: "Create workspace-wide or project-linked whiteboards with real-time multi-cursor collaboration.",
      },
      {
        element: "[data-tour='whiteboards-grid']",
        title: "Whiteboards Grid",
        desc: "Quickly browse, search, and jump into any collaborative canvas in your workspace.",
      },
    ],
  },
  "whiteboard-canvas": {
    id: "whiteboard-canvas",
    steps: [
      {
        element: "[data-tour='wb-header']",
        title: "Whiteboard Canvas & Live Sync",
        desc: "Interactive visual board with instant cloud saving, real-time multi-user sync, and linked workspace projects.",
      },
      {
        element: "[data-tour='wb-tools']",
        title: "Drawing & Diagramming Tools",
        desc: "Shapes, arrows, lines, freehand pencil, rich text, sticky notes, hand pan, and eraser.",
      },
      {
        element: "[data-tour='wb-styling']",
        title: "Colors & Stroke Thickness",
        desc: "Customize stroke colors, line thickness, and sticky note palette for diagrams and notes.",
      },
      {
        element: "[data-tour='wb-theme']",
        title: "Themes & Canvas Backgrounds",
        desc: "Switch between Void, Azure, Aurora, Emerald, Rose, and Paper themes with plain, dot, or grid patterns.",
      },
      {
        element: "[data-tour='wb-pages']",
        title: "Multi-page Canvases",
        desc: "Create and switch between multiple canvas pages inside a single whiteboard document.",
      },
      {
        element: "[data-tour='wb-export']",
        title: "Zoom & Vector Export",
        desc: "Zoom in/out, download your artwork as vector SVG, or import and export raw JSON states.",
      },
      {
        element: "[data-tour='wb-canvas-area']",
        title: "Collaborative Canvas Area",
        desc: "Infinite workspace for brainstorming, architecture maps, ER diagrams, and converting stickies into tracked issues.",
      },
    ],
  },
  analytics: {
    id: "analytics",
    steps: [
      {
        element: "[data-tour='analytics-header']",
        title: "Analytics & Velocity",
        desc: "Engineering throughput, cycle times, and delivery metrics across this workspace.",
      },
      {
        element: "[data-tour='analytics-cards']",
        title: "Delivery & Sprint Metrics",
        desc: "Live completion rate, resolved tickets, active sprint load, and urgent bottlenecks.",
      },
    ],
  },
  cron: {
    id: "cron",
    steps: [
      {
        element: "[data-tour='cron-header']",
        title: "Scheduled Automation & Cron",
        desc: "Schedule automated AI jobs, codebase bug scans, and maintenance tasks.",
      },
      {
        element: "[data-tour='create-cron-btn']",
        title: "Create Cron Job",
        desc: "Configure recurring jobs with cron syntax (e.g. daily, hourly) and target endpoints.",
      },
      {
        element: "[data-tour='cron-jobs-list']",
        title: "Active Scheduled Jobs",
        desc: "Manage, pause, or manually trigger jobs on demand with live status indicators.",
      },
      {
        element: "[data-tour='cron-history']",
        title: "Execution Run History",
        desc: "Inspect past execution logs, duration, findings, and error statuses.",
      },
    ],
  },
  settings: {
    id: "settings",
    steps: [
      {
        element: "[data-tour='settings-general']",
        title: "Workspace General Details",
        desc: "View and configure workspace name, slug identifier, and organization branding.",
      },
      {
        element: "[data-tour='settings-ai-scanner']",
        title: "Autonomous AI Scanner",
        desc: "Configure automated daily scans for codebase bugs, PR reviews, and security issues.",
      },
      {
        element: "[data-tour='settings-members']",
        title: "Team Members & Permissions",
        desc: "Invite teammates, assign Owner/Admin/Member/Viewer roles, and manage workspace access.",
      },
      {
        element: "[data-tour='settings-profile']",
        title: "Profile & Credentials",
        desc: "Update personal profile, change passwords, and manage account security.",
      },
      {
        element: "[data-tour='settings-danger']",
        title: "Workspace Governance",
        desc: "Administrative actions including renaming, leaving, or deleting this workspace.",
      },
    ],
  },
};

/**
 * Builds a configured, themed Driver instance for a tour id.
 */
export function buildTourDriver(tourId: string, opts: { onFinish?: () => void } = {}): Driver | null {
  const tour = TOURS[tourId];
  if (!tour) return null;

  return driver({
    animate: true,
    smoothScroll: true,
    overlayColor: "#000000",
    overlayOpacity: 0.8,
    showProgress: true,
    progressText: "{{current}} / {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    skipMissingElement: true,
    popoverClass: "workflow-tour-popover",
    onDestroyed: () => opts.onFinish?.(),
    steps: tour.steps.map((s) => ({
      element: s.element,
      skipMissingElement: true,
      popover: {
        title: s.title,
        description: s.desc,
        side: s.side ?? "bottom",
        align: s.align ?? "center",
      },
    })),
  });
}

export const isTour = (tourId: string): tourId is keyof typeof TOURS => tourId in TOURS;