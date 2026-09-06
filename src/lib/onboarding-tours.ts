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
        desc: "Projects, team members, and DB connection status — rolled up across all your workspaces.",
      },
      {
        element: "[data-tour='create-workspace']",
        title: "Create a workspace",
        desc: "Spin up a new space for a team (engineering, product, design) any time.",
      },
      {
        element: "[data-tour='workspaces-grid']",
        title: "Your workspaces",
        desc: "Each card shows the workspace banner, project & member counts, and one click takes you inside.",
      },
      {
        element: "[data-tour='infra']",
        title: "Infrastructure hub",
        desc: "Connect servers, CI/CD pipelines, and database resources here — coming soon.",
      },
    ],
  },
  workspace: {
    id: "workspace",
    steps: [
      {
        element: "[data-tour='ws-banner']",
        title: "Workspace banner",
        desc: "This auto-attached banner slides through images. Hover to pause; use the pencil to add or remove images.",
      },
      {
        element: "[data-tour='ws-metrics']",
        title: "Live metrics",
        desc: "Active projects, total issues, in-progress work, and completed tickets across this workspace.",
      },
      {
        element: "[data-tour='ws-projects']",
        title: "Your projects",
        desc: "Each project card previews its banner. Clicking one opens its Kanban board.",
      },
      {
        element: "[data-tour='ws-view-all']",
        title: "View all projects",
        desc: "Jump to the full projects list to see every project in this workspace.",
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
        title: "Search issues",
        desc: "Find any issue by title or key (e.g. DEV-102). Works in both Board and List views.",
      },
      {
        element: "[data-tour='board-sprints']",
        title: "Sprint planning",
        desc: "Create sprints, set dates, and move backlog issues into an active sprint with milestones.",
      },
      {
        element: "[data-tour='board-banners']",
        title: "Project banner",
        desc: "The toolbar backdrop slides through your project's banner images. Use this button to view, add, or remove images.",
      },
      {
        element: "[data-tour='board-repo']",
        title: "GitHub integration",
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
        desc: "Opens the new-issue dialog — title, description, attachments, sprint, labels, and more.",
      },
      {
        element: "[data-tour='view-toggle']",
        title: "Board ⇄ List view",
        desc: "Flip between visual Kanban columns and a compact table listing.",
      },
      {
        element: "[data-tour='board-columns']",
        title: "Drag & drop columns",
        desc: "Cards snap between status columns, and column order is saved live over the realtime bus.",
      },
    ],
  },
  analytics: {
    id: "analytics",
    steps: [
      {
        element: "[data-tour='analytics-header']",
        title: "Analytics & velocity",
        desc: "Engineering throughput and delivery metrics across this workspace.",
      },
      {
        element: "[data-tour='analytics-cards']",
        title: "Delivery metrics",
        desc: "Completion rate, resolved tickets, active sprint load, and urgent items — computed from live issue data.",
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