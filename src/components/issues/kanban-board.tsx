"use client";

import { useState, useEffect, useMemo } from "react";
import { IssueStatus, IssuePriority } from "@prisma/client";
import { KanbanColumn } from "./kanban-column";
import { IssueListView } from "./issue-list-view";
import { CreateIssueDialog } from "./create-issue-dialog";
import { CreateColumnDialog } from "./create-column-dialog";
import { EditColumnDialog } from "./edit-column-dialog";
import { IssueDetailModal } from "./issue-detail-modal";
import { SprintManagementDialog } from "./sprints-dialog";
import { ProjectPermissionsDialog } from "@/components/projects/project-permissions-dialog";
import { ProjectCronDialog } from "@/components/cron/project-cron-dialog";
import { BannerDialog } from "@/components/banners/banner-dialog";
import { RepositoryBadge } from "@/components/repositories/repository-badge";
import { ProjectRepoDetails } from "@/actions/repositories";
import { ISSUE_STATUSES } from "@/lib/constants";
import { moveIssue } from "@/actions/issues";
import { reorderBoardColumns } from "@/actions/columns";
import { exportProjectIssues } from "@/actions/export";
import { useProjectRealtime } from "@/hooks/use-project-realtime";
import { TourReplayButton } from "@/components/onboarding/onboarding-tour";
import {
  Plus,
  Search,
  Kanban,
  List,
  Shield,
  LayoutGrid,
  Download,
  UserCheck,
  AlertCircle,
  X,
  Flag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

export interface BoardColumnItem {
  id: string;
  name: string;
  key: string;
  color: string;
  order: number;
}

export interface IssueItem {
  id: string;
  projectKey: string;
  issueNumber: number;
  title: string;
  status: string; // supports default or custom list keys
  priority: IssuePriority;
  estimate?: number | null;
  assignee?: { id: string; name?: string | null; image?: string | null } | null;
  _count?: { comments: number; attachments: number };
}

interface KanbanBoardProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  orgSlug?: string;
  workspaceSlug?: string;
  userRole?: string; // "OWNER", "EDITOR", "VIEWER"
  currentUserId?: string;
  initialColumns?: BoardColumnItem[];
  initialIssues: IssueItem[];
  banners?: { id: string; imageUrl: string }[];
  initialRepository?: ProjectRepoDetails | null;
}

export function KanbanBoard({
  projectId,
  projectKey,
  projectName,
  orgSlug = "",
  workspaceSlug = "",
  userRole = "EDITOR",
  currentUserId = "",
  initialColumns = [],
  initialIssues,
  banners = [],
  initialRepository = null,
}: KanbanBoardProps) {
  // Ensure default 6 columns fallback if initialColumns is empty
  const defaultCols: BoardColumnItem[] = ISSUE_STATUSES.map((s, idx) => ({
    id: `default_${s.id}`,
    name: s.label,
    key: s.id,
    color: "#737373",
    order: idx * 1000,
  }));

  const [columns, setColumns] = useState<BoardColumnItem[]>(
    initialColumns.length > 0 ? initialColumns : defaultCols
  );
  const [draggedOverColumnId, setDraggedOverColumnId] = useState<string | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createColumnDialogOpen, setCreateColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumnItem | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [sprintsDialogOpen, setSprintsDialogOpen] = useState(false);
  const [cronDialogOpen, setCronDialogOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("TODO");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const displayBanners = useMemo(() => {
    if (banners.length > 0) return banners;
    return [
      { id: "default-bw-0", imageUrl: `https://picsum.photos/seed/bw-${projectKey.toLowerCase()}-0/1600/400?grayscale` },
      { id: "default-bw-1", imageUrl: `https://picsum.photos/seed/bw-${projectKey.toLowerCase()}-1/1600/400?grayscale` },
      { id: "default-bw-2", imageUrl: `https://picsum.photos/seed/bw-${projectKey.toLowerCase()}-2/1600/400?grayscale` },
      { id: "default-bw-3", imageUrl: `https://picsum.photos/seed/bw-${projectKey.toLowerCase()}-3/1600/400?grayscale` },
    ];
  }, [banners, projectKey]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const canManageBoard = userRole === "OWNER";

  // Connect to real-time live synchronization (SSE)
  const { isConnected } = useProjectRealtime({
    projectId,
    onEvent: (event) => {
      if (event.type === "ISSUE_CREATED" && event.data.issue) {
        const newIssue = event.data.issue as IssueItem;
        setIssues((prev) => {
          if (prev.some((i) => i.id === newIssue.id)) return prev;
          return [...prev, newIssue];
        });
      } else if (event.type === "ISSUE_MOVED" && event.data.issueId && event.data.targetStatus) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === event.data.issueId
              ? { ...i, status: event.data.targetStatus as string }
              : i
          )
        );
      } else if (event.type === "ISSUE_UPDATED" && event.data.issue) {
        const updated = event.data.issue;
        setIssues((prev) =>
          prev.map((i) =>
            i.id === updated.id
              ? {
                  ...i,
                  title: updated.title,
                  status: updated.status,
                  priority: updated.priority,
                  estimate: updated.estimate,
                  assignee: updated.assignee,
                }
              : i
          )
        );
      } else if (event.type === "ISSUE_DELETED" && event.data.issueId) {
        setIssues((prev) => prev.filter((i) => i.id !== event.data.issueId));
      } else if (event.type === "COMMENT_ADDED" && event.data.issueId) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === event.data.issueId
              ? {
                  ...i,
                  _count: {
                    comments: (i._count?.comments || 0) + 1,
                    attachments: i._count?.attachments || 0,
                  },
                }
              : i
          )
        );
      } else if (event.type === "COLUMN_CREATED" && event.data.column) {
        const newCol = event.data.column as BoardColumnItem;
        setColumns((prev) => {
          if (prev.some((c) => c.id === newCol.id || c.key === newCol.key)) return prev;
          return [...prev, newCol].sort((a, b) => a.order - b.order);
        });
      } else if (event.type === "COLUMN_UPDATED") {
        if (event.data.column) {
          const updatedCol = event.data.column as BoardColumnItem;
          setColumns((prev) =>
            prev
              .map((c) => (c.id === updatedCol.id ? { ...c, ...updatedCol } : c))
              .sort((a, b) => a.order - b.order)
          );
        } else if (event.data.reorderedIds) {
          const idOrder = event.data.reorderedIds as string[];
          setColumns((prev) => {
            const map = new Map(prev.map((c) => [c.id, c]));
            return idOrder.map((id) => map.get(id)!).filter(Boolean);
          });
        }
      } else if (event.type === "COLUMN_DELETED" && event.data.columnId) {
        setColumns((prev) => prev.filter((c) => c.id !== event.data.columnId));
      } else if (event.type === "ATTACHMENT_ADDED" && event.data.issueId) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === event.data.issueId
              ? { ...i, _count: { comments: i._count?.comments || 0, attachments: (i._count?.attachments || 0) + 1 } }
              : i
          )
        );
      } else if (event.type === "ATTACHMENT_DELETED" && event.data.issueId) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === event.data.issueId
              ? { ...i, _count: { comments: i._count?.comments || 0, attachments: Math.max(0, (i._count?.attachments || 0) - 1) } }
              : i
          )
        );
      }
    },
  });

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      `${i.projectKey}-${i.issueNumber}`.toLowerCase().includes(search.toLowerCase());

    const matchesPriority =
      selectedPriority === "ALL" || i.priority === selectedPriority;

    const matchesStatus =
      selectedStatusFilter === "ALL" || i.status === selectedStatusFilter;

    const matchesAssignee = !onlyMyIssues || (currentUserId && i.assignee?.id === currentUserId);

    const matchesUrgent = !onlyUrgent || (i.priority === "URGENT" || i.priority === "HIGH");

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesUrgent;
  });

  const handleDropIssue = async (issueId: string, targetStatusKey: string) => {
    // Optimistic UI update
    setIssues((prev) =>
      prev.map((item) => (item.id === issueId ? { ...item, status: targetStatusKey } : item))
    );

    // Call server action
    await moveIssue(issueId, targetStatusKey as any, 1000);
  };

  const handleAddIssue = (statusKey: string) => {
    setSelectedStatus(statusKey);
    setCreateDialogOpen(true);
  };

  const handleIssueUpdated = (updated: {
    id: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    estimate?: number | null;
    assignee?: { id: string; name?: string | null; image?: string | null } | null;
  }) => {
    setIssues((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
  };

  // Drag-and-drop column reordering (Owner & Co-owner only)
  const handleColumnDrop = async (e: React.DragEvent, targetColumnId: string) => {
    setDraggedOverColumnId(null);
    if (!canManageBoard) return;
    const sourceColumnId = e.dataTransfer.getData("columnId");
    if (!sourceColumnId || sourceColumnId === targetColumnId) return;

    const sourceIdx = columns.findIndex((c) => c.id === sourceColumnId);
    const targetIdx = columns.findIndex((c) => c.id === targetColumnId);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const newCols = [...columns];
    const [moved] = newCols.splice(sourceIdx, 1);
    newCols.splice(targetIdx, 0, moved);

    // Optimistic update
    setColumns(newCols);

    // Persist to database
    await reorderBoardColumns(
      projectId,
      newCols.map((c) => c.id)
    );
  };

  // Handle Export (CSV / JSON)
  const handleExport = async (format: "csv" | "json") => {
    setExporting(format);
    try {
      const res = await exportProjectIssues(projectId, format);
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: res.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      alert("Failed to export issues.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Board Top Toolbar with Ambient Pure B&W Backdrop */}
      <div
        className="relative overflow-hidden rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-4 shadow-xl"
        data-tour="board-toolbar"
      >
        {/* Ambient B&W Backdrop Images with Smooth Cross-fade Transition */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {displayBanners.map((banner, idx) => (
            <img
              key={banner.id}
              src={banner.imageUrl}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center grayscale contrast-110 brightness-105 transition-opacity duration-1000 ease-in-out ${
                idx === activeBannerIndex % displayBanners.length ? "opacity-80" : "opacity-0"
              }`}
            />
          ))}
          {/* Gentle vignette to ensure text contrast while keeping photo bright and clear */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/25 to-neutral-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-neutral-950/10" />
        </div>

        <div className="relative z-10 space-y-4">
          {/* Title, Key, Realtime Status & Banners */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-white dark:text-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {projectName}
              </h1>
              <span className="font-mono text-xs rounded-md bg-neutral-900/90 dark:bg-neutral-100/90 border border-neutral-800 px-2 py-0.5 font-bold text-neutral-300 dark:text-neutral-700">
                {projectKey}
              </span>
              <div
                title={isConnected ? "Live real-time sync active" : "Attempting real-time connection..."}
                className="flex items-center gap-1.5 rounded-full border border-neutral-800 dark:border-neutral-200 bg-neutral-950/90 dark:bg-neutral-50/90 px-2.5 py-0.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-600 select-none backdrop-blur-sm"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                      : "bg-neutral-600 dark:bg-neutral-400"
                  }`}
                />
                <span className="text-[10px] tracking-wide uppercase font-semibold text-neutral-300 dark:text-neutral-700">
                  {isConnected ? "Live" : "Connecting"}
                </span>
              </div>
            </div>

            {/* Banners Trigger & Cycle Controls */}
            <div className="flex items-center gap-1.5">
              {displayBanners.length > 1 && (
                <div className="flex items-center gap-1 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900/80 dark:bg-neutral-100/80 px-2 py-1 backdrop-blur-sm shadow-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
                    }}
                    title="Previous banner image"
                    className="cursor-pointer text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black transition p-0.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600 select-none px-0.5">
                    {(activeBannerIndex % displayBanners.length) + 1}/{displayBanners.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex((prev) => (prev + 1) % displayBanners.length);
                    }}
                    title="Next banner image"
                    className="cursor-pointer text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black transition p-0.5"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setBannerModalOpen(true)}
                title="View & manage project banner images"
                data-tour="board-banners"
                className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900/80 dark:bg-neutral-100/80 px-2.5 py-1 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition backdrop-blur-sm shadow-sm"
              >
                <ImageIcon className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
                <span className="hidden sm:inline">Banners</span>
              </button>
              <TourReplayButton tourId="board" />
            </div>
          </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative" data-tour="board-search">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500 dark:text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="w-32 sm:w-44 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
            />
          </div>

          {/* Quick Filter Pills */}
          <button
            onClick={() => setOnlyMyIssues((prev) => !prev)}
            className={`cursor-pointer flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
              onlyMyIssues
                ? "border-white dark:border-black bg-white dark:bg-black text-black shadow-md"
                : "border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 text-neutral-400 hover:border-neutral-700 dark:hover:border-neutral-300 hover:text-white dark:text-black"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Assigned to Me</span>
          </button>

          <button
            onClick={() => setOnlyUrgent((prev) => !prev)}
            className={`cursor-pointer flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
              onlyUrgent
                ? "border-rose-500 bg-rose-500 text-white dark:text-black shadow-md shadow-rose-950"
                : "border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 text-neutral-400 hover:border-neutral-700 dark:hover:border-neutral-300 hover:text-white dark:text-black"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Urgent / High</span>
          </button>

          {(onlyMyIssues || onlyUrgent || search || selectedPriority !== "ALL" || selectedStatusFilter !== "ALL") && (
            <button
              onClick={() => {
                setOnlyMyIssues(false);
                setOnlyUrgent(false);
                setSearch("");
                setSelectedPriority("ALL");
                setSelectedStatusFilter("ALL");
              }}
              title="Reset all filters"
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black transition"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Export Menu */}
          <div className="ml-auto flex items-center rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-0.5">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              title="Export issues to CSV"
              className="cursor-pointer px-2 py-1 text-[11px] font-bold text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black transition"
            >
              {exporting === "csv" ? "..." : "CSV"}
            </button>
            <span className="text-neutral-800 dark:text-neutral-200">|</span>
            <button
              onClick={() => handleExport("json")}
              disabled={exporting !== null}
              title="Export issues to JSON"
              className="cursor-pointer px-2 py-1 text-[11px] font-bold text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black transition"
            >
              {exporting === "json" ? "..." : "JSON"}
            </button>
          </div>

          {/* Add List / Column Button for Owner/Co-owner */}
          {canManageBoard && (
            <button
              onClick={() => setCreateColumnDialogOpen(true)}
              title="Add a new custom list/column"
              className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
              <span className="hidden sm:inline">Add List</span>
            </button>
          )}

{/* Sprint Planning */}
          <button
            onClick={() => setSprintsDialogOpen(true)}
            title="Plan sprints & manage the backlog"
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition"
          >
            <Flag className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
            <span className="hidden sm:inline">Sprints</span>
          </button>

          {/* Cron Jobs / Automation */}
          <button
            onClick={() => setCronDialogOpen(true)}
            title="Scheduled AI cron jobs for this project"
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition"
          >
            <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
            <span className="hidden sm:inline">Cron</span>
          </button>

          {/* AI Repository Integration */}
          <div data-tour="board-repo">
            <RepositoryBadge
              projectId={projectId}
              projectName={projectName}
              projectKey={projectKey}
              repository={initialRepository}
              canManage={userRole !== "VIEWER"}
            />
          </div>

          {/* Project Access & Permissions */}
          <button
            onClick={() => setPermissionsDialogOpen(true)}
            title="Manage Project Access & Granular Permissions"
            data-tour="board-access"
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition"
          >
            <Shield className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
            <span className="hidden sm:inline">Access</span>
          </button>

          <button
            onClick={() => handleAddIssue(columns[0]?.key || "TODO")}
            data-tour="new-issue"
            className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-white dark:bg-black px-3.5 py-1.5 text-xs font-bold text-black dark:text-white shadow-lg transition hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            <span>New Issue</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-1" data-tour="view-toggle">
            <button
              onClick={() => setViewMode("board")}
              className={`cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "board"
                  ? "bg-white dark:bg-black text-black shadow-sm"
                  : "text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-black text-black shadow-sm"
                  : "text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Main Content Area: Board or List */}
      {viewMode === "board" ? (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-start" data-tour="board-columns">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              id={col.key}
              label={col.name}
              color={col.color}
              canManage={canManageBoard}
              isColumnDragOver={draggedOverColumnId === col.id}
              issues={filteredIssues.filter((i) => i.status === col.key)}
              onAddIssue={handleAddIssue}
              onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
              onDropIssue={handleDropIssue}
              onEditColumn={() => setEditingColumn(col)}
              onColumnDragStart={(_, colId) => {
                // drag start
              }}
              onColumnDragOver={(_, targetColId) => {
                setDraggedOverColumnId(targetColId);
              }}
              onColumnDragLeave={() => {
                setDraggedOverColumnId(null);
              }}
              onColumnDrop={handleColumnDrop}
            />
          ))}

          {/* Add Column Tile for Owners/Co-owners at the end of the board */}
          {canManageBoard && (
            <button
              onClick={() => setCreateColumnDialogOpen(true)}
              className="cursor-pointer flex h-36 min-w-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-800 dark:border-neutral-200 bg-neutral-950/40 dark:bg-neutral-50/40 text-neutral-400 transition hover:border-neutral-600 dark:hover:border-neutral-400 hover:bg-neutral-900/60 dark:hover:bg-neutral-100/60 hover:text-white dark:text-black"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">New List</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 pb-4">
          <IssueListView
            issues={filteredIssues}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onStatusChange={(id, status) => handleDropIssue(id, status)}
          />
        </div>
      )}

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        projectId={projectId}
        projectKey={projectKey}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        defaultStatus={selectedStatus}
        columns={columns}
      />

      {/* Create Column Dialog */}
      <CreateColumnDialog
        projectId={projectId}
        isOpen={createColumnDialogOpen}
        onClose={() => setCreateColumnDialogOpen(false)}
        onColumnCreated={(newCol) => {
          setColumns((prev) => [...prev, newCol].sort((a, b) => a.order - b.order));
        }}
      />

      {/* Edit Column Dialog */}
      {editingColumn && (
        <EditColumnDialog
          column={editingColumn}
          isOpen={!!editingColumn}
          onClose={() => setEditingColumn(null)}
          onColumnUpdated={(updated) => {
            setColumns((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
          }}
          onColumnDeleted={(deletedId) => {
            setColumns((prev) => prev.filter((c) => c.id !== deletedId));
          }}
        />
      )}

      {/* Project Permissions & RBAC Dialog */}
      <ProjectPermissionsDialog
        projectId={projectId}
        projectKey={projectKey}
        projectName={projectName}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        isOpen={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
      />

      {/* Sprint Planning Dialog */}
      <SprintManagementDialog
        projectId={projectId}
        projectKey={projectKey}
        isOpen={sprintsDialogOpen}
        onClose={() => setSprintsDialogOpen(false)}
      />

      {/* Cron Jobs & Automation Dialog */}
      <ProjectCronDialog
        projectId={projectId}
        projectKey={projectKey}
        projectName={projectName}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        isOpen={cronDialogOpen}
        onClose={() => setCronDialogOpen(false)}
        canManage={canManageBoard}
      />

      {/* Issue Detail & Discussion Modal */}
      <IssueDetailModal
        issueId={selectedIssueId}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onIssueDeleted={(deletedId) => {
          setIssues((prev) => prev.filter((i) => i.id !== deletedId));
        }}
        onIssueUpdated={handleIssueUpdated}
      />

      {/* Project Banners Modal */}
      <BannerDialog
        banners={displayBanners}
        isOpen={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        canEdit={userRole !== "VIEWER"}
        projectId={projectId}
      />
    </div>
  );
}
