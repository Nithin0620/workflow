"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Kanban,
  List,
  Shield,
  LayoutGrid,
  UserCheck,
  AlertCircle,
  X,
  Flag,
  Clock,
  Plus,
  MessageSquare,
  Paperclip,
  ArrowUp,
  ArrowDown,
  Equal,
  Minus,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MoreHorizontal,
  GripVertical,
} from "lucide-react";
import { IssuePriority } from "@prisma/client";

type DemoCard = {
  id: string;
  projectKey: string;
  issueNumber: number;
  title: string;
  status: string;
  priority: IssuePriority;
  estimate?: number | null;
  assignee?: { id: string; name: string } | null;
  _count?: { comments: number; attachments: number };
  tag?: "ai" | "cron";
};

type DemoColumn = {
  id: string;
  key: string;
  name: string;
  color: string;
};

const DEMO_COLUMNS: DemoColumn[] = [
  { id: "col-backlog", key: "BACKLOG", name: "Backlog", color: "#737373" },
  { id: "col-todo", key: "TODO", name: "To Do", color: "#64748b" },
  { id: "col-in-progress", key: "IN_PROGRESS", name: "In Progress", color: "#3b82f6" },
  { id: "col-in-review", key: "IN_REVIEW", name: "In Review", color: "#f59e0b" },
  { id: "col-done", key: "DONE", name: "Done", color: "#10b981" },
  { id: "col-canceled", key: "CANCELED", name: "Canceled", color: "#f43f5e" },
];

const INITIAL_ISSUES: DemoCard[] = [
  {
    id: "demo-1",
    projectKey: "TRIP",
    issueNumber: 103,
    title: "Improve dashboard performance and query latency",
    status: "BACKLOG",
    priority: "MEDIUM",
    estimate: 5,
    assignee: { id: "u1", name: "Jules" },
    _count: { comments: 3, attachments: 1 },
  },
  {
    id: "demo-2",
    projectKey: "TRIP",
    issueNumber: 104,
    title: "Train AI triage engine for inbound GitHub bug reports",
    status: "BACKLOG",
    priority: "HIGH",
    estimate: 4,
    assignee: { id: "u2", name: "Alice" },
    _count: { comments: 5, attachments: 0 },
    tag: "ai",
  },
  {
    id: "demo-3",
    projectKey: "TRIP",
    issueNumber: 105,
    title: "Nightly standup digest cron automation worker",
    status: "TODO",
    priority: "LOW",
    estimate: 1,
    assignee: { id: "u3", name: "Sam" },
    _count: { comments: 2, attachments: 0 },
    tag: "cron",
  },
  {
    id: "demo-4",
    projectKey: "TRIP",
    issueNumber: 108,
    title: "Import legacy Jira and Trello CSV workspace data",
    status: "TODO",
    priority: "MEDIUM",
    estimate: 2,
    assignee: { id: "u2", name: "Alice" },
    _count: { comments: 1, attachments: 2 },
  },
  {
    id: "demo-5",
    projectKey: "TRIP",
    issueNumber: 102,
    title: "Add Stripe payment gateway & webhook idempotency",
    status: "IN_PROGRESS",
    priority: "URGENT",
    estimate: 8,
    assignee: { id: "u2", name: "Alice" },
    _count: { comments: 7, attachments: 3 },
  },
  {
    id: "demo-6",
    projectKey: "TRIP",
    issueNumber: 101,
    title: "Fix OAuth session refresh cookie on mobile Safari",
    status: "IN_PROGRESS",
    priority: "HIGH",
    estimate: 3,
    assignee: { id: "u1", name: "Jules" },
    _count: { comments: 4, attachments: 0 },
  },
  {
    id: "demo-7",
    projectKey: "TRIP",
    issueNumber: 106,
    title: "Security audit & code review for checkout webhooks",
    status: "IN_REVIEW",
    priority: "HIGH",
    estimate: 6,
    assignee: { id: "u3", name: "Sam" },
    _count: { comments: 2, attachments: 1 },
  },
  {
    id: "demo-8",
    projectKey: "TRIP",
    issueNumber: 99,
    title: "Set up PostgreSQL schema & fractional index migrations",
    status: "DONE",
    priority: "MEDIUM",
    estimate: 5,
    assignee: { id: "u1", name: "Jules" },
    _count: { comments: 12, attachments: 4 },
  },
  {
    id: "demo-9",
    projectKey: "TRIP",
    issueNumber: 107,
    title: "Decommission legacy FTP sync background process",
    status: "CANCELED",
    priority: "LOW",
    estimate: 1,
    assignee: null,
    _count: { comments: 0, attachments: 0 },
    tag: "cron",
  },
];

const PRIORITY_ICONS: Record<IssuePriority, React.ReactNode> = {
  NO_PRIORITY: <Minus className="h-3.5 w-3.5 text-neutral-400" />,
  LOW: <ArrowDown className="h-3.5 w-3.5 text-blue-500" />,
  MEDIUM: <Equal className="h-3.5 w-3.5 text-amber-500" />,
  HIGH: <ArrowUp className="h-3.5 w-3.5 text-orange-500" />,
  URGENT: <AlertCircle className="h-3.5 w-3.5 text-rose-500" />,
};

const BANNERS = [
  "https://picsum.photos/seed/bw-trip-0/1600/400?grayscale",
  "https://picsum.photos/seed/bw-trip-1/1600/400?grayscale",
  "https://picsum.photos/seed/bw-trip-2/1600/400?grayscale",
];

export function LiveKanbanDemo() {
  const [issues, setIssues] = useState<DemoCard[]>(INITIAL_ISSUES);
  const [columns] = useState<DemoColumn[]>(DEMO_COLUMNS);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);

  // Filters and search identical to /board
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [filterTag, setFilterTag] = useState<"all" | "ai" | "cron">("all");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Inline issue creation
  const [addingToStatus, setAddingToStatus] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [nextSeq, setNextSeq] = useState(110);

  // Custom Modal Popup for Features (Sprints, Cron, Access RBAC)
  const [activeNoteModal, setActiveNoteModal] = useState<{
    title: string;
    badge: string;
    icon: React.ReactNode;
    badgeColor: string;
    description: string;
    points: string[];
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const filteredIssues = issues.filter((i) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      i.title.toLowerCase().includes(q) ||
      `${i.projectKey}-${i.issueNumber}`.toLowerCase().includes(q);

    const matchesAssignee = !onlyMyIssues || i.assignee?.name === "Jules";
    const matchesUrgent = !onlyUrgent || i.priority === "URGENT" || i.priority === "HIGH";
    const matchesTag = filterTag === "all" || i.tag === filterTag;

    return matchesSearch && matchesAssignee && matchesUrgent && matchesTag;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.setData("type", "issue");
    e.dataTransfer.effectAllowed = "move";
    setDraggedIssueId(id);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverColumnKey(null);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnKey !== colKey) {
      setDragOverColumnKey(colKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colKey: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverColumnKey === colKey) {
        setDragOverColumnKey(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatusKey: string) => {
    e.preventDefault();
    setDragOverColumnKey(null);
    const id = e.dataTransfer.getData("text/plain") || draggedIssueId;
    if (!id) return;

    setIssues((prev) =>
      prev.map((card) => (card.id === id ? { ...card, status: targetStatusKey } : card))
    );
    setDraggedIssueId(null);
  };

  const createIssue = (statusKey: string) => {
    const title = draftTitle.trim();
    if (!title) return;
    const num = nextSeq;
    setNextSeq((n) => n + 1);

    const newIssue: DemoCard = {
      id: `custom-${num}`,
      projectKey: "TRIP",
      issueNumber: num,
      title,
      status: statusKey,
      priority: "MEDIUM",
      estimate: ((num * 3) % 8) + 1,
      assignee: { id: "u1", name: "Jules" },
      _count: { comments: 0, attachments: 0 },
    };

    setIssues((prev) => [...prev, newIssue]);
    setDraftTitle("");
    setAddingToStatus(null);
  };

  return (
    <section className="relative px-3 sm:px-6 pb-24 pt-6 overflow-hidden">
      {/* Background layer: 2% from top down to 75% is Pure Black (#000000), remainder is White */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: "2%",
          height: "73%",
          backgroundColor: "#000000",
        }}
      />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/90 px-3 py-1 text-xs font-mono text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>INTERACTIVE /board DEMO</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Try the real workspace board right now.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto px-4">
            Drag cards across columns, search tickets, apply live filters, or create new issues with the exact same UI as the production board.
          </p>
        </div>

        {/* Board Container */}
        <div
          ref={containerRef}
          className="rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/10"
        >
          {/* Mac Window Title Bar */}
          <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <div className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <div className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>

            <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-2">
              <span className="font-mono bg-neutral-800/50 px-2 py-0.5 rounded border border-neutral-700/50 text-white">
                TripTally [TRIP]
              </span>
              <span>— Sprint 12</span>
            </div>

            <div className="w-12 text-right">
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Demo</span>
            </div>
          </div>

          {/* App Body */}
          <div className="p-3 sm:p-5 bg-black space-y-4">
            {/* Top Toolbar matching /board */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-xl">
              {/* Ambient B&W Backdrop Images with Smooth Cross-fade Transition */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {BANNERS.map((bannerUrl, idx) => (
                  <img
                    key={idx}
                    src={bannerUrl}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover object-center grayscale contrast-110 brightness-105 transition-opacity duration-1000 ease-in-out ${
                      idx === activeBannerIndex ? "opacity-75" : "opacity-0"
                    }`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/40 to-neutral-950/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/20" />
              </div>

              <div className="relative z-10 space-y-4">
                {/* Title, Key, Realtime Status & Banners */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      TripTally
                    </h1>
                    <span className="font-mono text-xs rounded-md bg-neutral-900/90 border border-neutral-800 px-2 py-0.5 font-bold text-neutral-300">
                      TRIP
                    </span>
                    <div className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/90 px-2.5 py-0.5 text-[11px] font-medium text-neutral-400 select-none backdrop-blur-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                      <span className="text-[10px] tracking-wide uppercase font-semibold text-neutral-300">
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Banners Trigger & Cycle Controls */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/80 px-2 py-1 backdrop-blur-sm shadow-sm">
                      <button
                        onClick={() =>
                          setActiveBannerIndex(
                            (prev) => (prev - 1 + BANNERS.length) % BANNERS.length
                          )
                        }
                        title="Previous banner image"
                        className="text-neutral-400 hover:text-white transition p-0.5"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-neutral-400 select-none px-0.5">
                        {activeBannerIndex + 1}/{BANNERS.length}
                      </span>
                      <button
                        onClick={() =>
                          setActiveBannerIndex((prev) => (prev + 1) % BANNERS.length)
                        }
                        title="Next banner image"
                        className="text-neutral-400 hover:text-white transition p-0.5"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-neutral-300 backdrop-blur-sm shadow-sm">
                      <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Banners</span>
                    </div>
                  </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 pt-1">
                  {/* Left filter grouping with generous spacing */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search issues..."
                        className="w-32 sm:w-48 rounded-xl border border-neutral-800 bg-neutral-950 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                      />
                    </div>

                    {/* Quick Filter Pills */}
                    <button
                      onClick={() => setOnlyMyIssues((prev) => !prev)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        onlyMyIssues
                          ? "border-white bg-white text-black shadow-md"
                          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Assigned to Me</span>
                      <span className="sm:hidden">My Issues</span>
                    </button>

                    <button
                      onClick={() => setOnlyUrgent((prev) => !prev)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        onlyUrgent
                          ? "border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-950"
                          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Urgent</span>
                    </button>

                    {/* AI Tag Filter Badge */}
                    <div className="flex items-center border-l border-neutral-800/80 pl-3">
                      <button
                        onClick={() => setFilterTag(filterTag === "ai" ? "all" : "ai")}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          filterTag === "ai"
                            ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-950"
                            : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        <span>AI Issues</span>
                      </button>
                    </div>

                    {(onlyMyIssues || onlyUrgent || search || filterTag !== "all") && (
                      <button
                        onClick={() => {
                          setOnlyMyIssues(false);
                          setOnlyUrgent(false);
                          setSearch("");
                          setFilterTag("all");
                        }}
                        title="Reset all filters"
                        className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  {/* Right side tools with distinct separation */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 ml-auto">
                    {/* Demo Dialog Buttons with Custom Rich Note Popups */}
                    <div className="hidden md:flex items-center gap-3">
                      <button
                        onClick={() => {
                          setActiveNoteModal({
                            title: "Sprint Planning & Backlog",
                            badge: "SPRINT MANAGEMENT",
                            badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                            icon: <Flag className="h-5 w-5 text-blue-400" />,
                            description: "Organize, commit, and deliver sprints with automatic burndown velocity tracking.",
                            points: [
                              "Start and complete sprints with target milestone dates",
                              "Automatic rollover of incomplete issues to the next cycle",
                              "Velocity and story point estimation analytics per engineer",
                            ],
                          });
                        }}
                        className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
                      >
                        <Flag className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Sprints</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveNoteModal({
                            title: "Scheduled Cron Automations",
                            badge: "BACKGROUND AUTOMATION",
                            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                            icon: <Clock className="h-5 w-5 text-amber-400" />,
                            description: "Configure background workers with standard 5-part cron syntax to automate team rituals.",
                            points: [
                              "Daily standup digests pushed directly to Slack/Discord",
                              "Automated stale issue triage and blocker notifications",
                              "Scheduled AI repository reviews and dependency audits",
                            ],
                          });
                        }}
                        className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
                      >
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Cron</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveNoteModal({
                            title: "Granular RBAC Security & Boundary Validation",
                            badge: "SECURITY & ACCESS CONTROL",
                            badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                            icon: <Shield className="h-5 w-5 text-emerald-400" />,
                            description: "Strict server-side validation guarantees team members only access projects they are authorized for.",
                            points: [
                              "Role hierarchy: Organization Owner, Workspace Admin, Project Member, Viewer",
                              "Granular column reordering and issue creation policies",
                              "Encrypted session cookies with 12-round salted bcrypt passwords",
                            ],
                          });
                        }}
                        className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
                      >
                        <Shield className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Access</span>
                      </button>
                    </div>

                    {/* New Issue Button */}
                    <button
                      onClick={() => {
                        setAddingToStatus("TODO");
                      }}
                      className="flex items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-black shadow-lg transition hover:bg-neutral-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Issue</span>
                    </button>

                    {/* View Mode Toggle */}
                    <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1">
                      <button
                        onClick={() => setViewMode("board")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                          viewMode === "board"
                            ? "bg-white text-black shadow-sm"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        <Kanban className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Board</span>
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                          viewMode === "list"
                            ? "bg-white text-black shadow-sm"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        <List className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">List</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Board Columns View */}
            {viewMode === "board" ? (
              <div className="relative">
                {/* Floating Note for Drag & Drop */}
                <div className="hidden xl:flex absolute -left-6 top-1/2 -translate-y-1/2 -translate-x-full z-30 pointer-events-none items-center">
                  <div className="w-48 rounded-xl bg-white text-black p-3 shadow-2xl border border-neutral-200 relative">
                    <h4 className="font-extrabold text-xs mb-0.5">Instant Drag & Drop</h4>
                    <p className="text-[10px] text-neutral-600 leading-tight">
                      Grab a card and drop it into any column — exactly how it works in the real board.
                    </p>
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-3 w-3 rotate-45 bg-white border-r border-t border-neutral-200" />
                  </div>
                </div>

                {/* Floating Note for It's Actually Real */}
                <div className="hidden xl:flex absolute -right-6 top-1/3 -translate-y-1/2 translate-x-full z-30 pointer-events-none items-center">
                  <div className="w-48 rounded-xl bg-emerald-500 text-white p-3 shadow-2xl shadow-emerald-950/40 relative">
                    <h4 className="font-extrabold text-xs mb-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      It&apos;s Actually Real
                    </h4>
                    <p className="text-[10px] text-emerald-50 leading-tight">
                      Drag, drop, search, filter and create issues — nothing is mocked.
                    </p>
                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3 w-3 rotate-45 bg-emerald-500" />
                  </div>
                </div>

                <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 pt-2 items-start scrollbar-thin scrollbar-thumb-neutral-800">
                  {columns.map((col) => {
                    const colIssues = filteredIssues.filter((i) => i.status === col.key);
                    const isDragTarget = dragOverColumnKey === col.key;

                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => handleDragOver(e, col.key)}
                        onDragLeave={(e) => handleDragLeave(e, col.key)}
                        onDrop={(e) => handleDrop(e, col.key)}
                        className={`flex h-full min-w-[270px] sm:min-w-[280px] max-w-[320px] flex-1 flex-col rounded-2xl bg-neutral-950 p-3.5 border transition-all duration-200 select-none ${
                          isDragTarget
                            ? "border-blue-500 bg-neutral-900/90 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/50"
                            : "border-neutral-800 shadow-xl"
                        }`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-1 py-1">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: col.color }}
                            />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-[130px]">
                              {col.name}
                            </h3>
                            <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300 font-mono">
                              {colIssues.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setAddingToStatus(col.key);
                                setDraftTitle("");
                              }}
                              title={`Add issue to ${col.name}`}
                              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline create input form */}
                        {addingToStatus === col.key && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              createIssue(col.key);
                            }}
                            className="mt-2.5 flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 p-2 shadow-inner"
                          >
                            <input
                              autoFocus
                              value={draftTitle}
                              onChange={(e) => setDraftTitle(e.target.value)}
                              placeholder="What needs to be done?"
                              className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="shrink-0 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-black hover:bg-neutral-200"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingToStatus(null)}
                              className="text-neutral-400 hover:text-white text-xs px-1"
                            >
                              ✕
                            </button>
                          </form>
                        )}

                        {/* Cards Container */}
                        <div className="mt-3 flex-1 space-y-2.5 min-h-[140px] overflow-y-auto pr-0.5">
                          {colIssues.map((issue) => (
                            <div
                              key={issue.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, issue.id)}
                              onDragEnd={handleDragEnd}
                              className={`group relative cursor-grab active:cursor-grabbing select-none rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5 shadow-md transition hover:border-neutral-500 hover:bg-neutral-900 ${
                                draggedIssueId === issue.id ? "opacity-40 ring-2 ring-blue-500" : ""
                              }`}
                            >
                              {/* Floating AI Callout note attached uniquely to AI issue card */}
                              {issue.tag === "ai" && (
                                <div className="hidden lg:flex absolute -top-12 right-0 z-30 pointer-events-none items-center">
                                  <div className="rounded-lg bg-purple-600/95 backdrop-blur-md px-2.5 py-1 text-white shadow-xl shadow-purple-950/60 border border-purple-400/40 whitespace-nowrap">
                                    <p className="text-[10px] font-bold flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                      AI Repo
                                    </p>
                                    <p className="text-[9px] text-purple-100">
                                      Auto-triage incoming bugs & tag issues
                                    </p>
                                    <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-purple-600 border-r border-b border-purple-400/40" />
                                  </div>
                                </div>
                              )}

                              {/* Floating Cron Callout note attached uniquely to Cron issue card */}
                              {issue.tag === "cron" && issue.status === "TODO" && (
                                <div className="hidden lg:flex absolute -top-12 right-0 z-30 pointer-events-none items-center">
                                  <div className="rounded-lg bg-amber-500/95 backdrop-blur-md px-2.5 py-1 text-neutral-950 shadow-xl shadow-amber-950/60 border border-amber-300/40 whitespace-nowrap">
                                    <p className="text-[10px] font-extrabold flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Cron Jobs
                                    </p>
                                    <p className="text-[9px] text-neutral-900 font-medium">
                                      Schedule nightly standups & digests
                                    </p>
                                    <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-amber-500 border-r border-b border-amber-300/40" />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-neutral-400">
                                  {issue.projectKey}-{issue.issueNumber}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {issue.tag && (
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                                        issue.tag === "ai"
                                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      }`}
                                    >
                                      {issue.tag.toUpperCase()}
                                    </span>
                                  )}
                                  {issue.estimate && (
                                    <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200 border border-neutral-700 font-mono">
                                      {issue.estimate} pts
                                    </span>
                                  )}
                                  <div title={issue.priority}>{PRIORITY_ICONS[issue.priority]}</div>
                                  <GripVertical className="h-3.5 w-3.5 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>

                              <h4 className="mt-2 line-clamp-2 text-xs font-semibold text-neutral-100 group-hover:text-white transition-colors">
                                {issue.title}
                              </h4>

                              <div className="mt-3.5 flex items-center justify-between border-t border-neutral-800/80 pt-2 text-neutral-400 text-xs">
                                <div className="flex items-center gap-3">
                                  {issue._count && issue._count.comments > 0 && (
                                    <div className="flex items-center gap-1 font-medium text-neutral-400">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span>{issue._count.comments}</span>
                                    </div>
                                  )}
                                  {issue._count && issue._count.attachments > 0 && (
                                    <div className="flex items-center gap-1 font-medium text-neutral-400">
                                      <Paperclip className="h-3.5 w-3.5" />
                                      <span>{issue._count.attachments}</span>
                                    </div>
                                  )}
                                </div>

                                {issue.assignee ? (
                                  <div
                                    title={`Assigned to ${issue.assignee.name}`}
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black shadow-sm"
                                  >
                                    {issue.assignee.name.charAt(0).toUpperCase()}
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 rounded-full border border-dashed border-neutral-700" />
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Drop Target indicator */}
                          {isDragTarget && draggedIssueId && (
                            <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-blue-500/80 bg-blue-500/10 text-xs font-semibold text-blue-400 animate-pulse">
                              Drop issue into {col.name}
                            </div>
                          )}

                          {colIssues.length === 0 && !isDragTarget && (
                            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-500">
                              No issues in {col.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* List View Mode */
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                <div className="grid grid-cols-12 text-[11px] font-mono font-bold uppercase text-neutral-500 pb-2 border-b border-neutral-800 px-3">
                  <span className="col-span-2">Key</span>
                  <span className="col-span-5">Title</span>
                  <span className="col-span-2">Status</span>
                  <span className="col-span-1">Priority</span>
                  <span className="col-span-2 text-right">Assignee</span>
                </div>
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="grid grid-cols-12 items-center text-xs py-2 px-3 rounded-xl border border-neutral-800/60 bg-neutral-900/40 hover:bg-neutral-900 transition"
                  >
                    <span className="col-span-2 font-mono font-bold text-neutral-400">
                      {issue.projectKey}-{issue.issueNumber}
                    </span>
                    <span className="col-span-5 font-semibold text-white truncate pr-4">
                      {issue.title}
                    </span>
                    <div className="col-span-2">
                      <select
                        value={issue.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setIssues((prev) =>
                            prev.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i))
                          );
                        }}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-300 font-medium focus:outline-none"
                      >
                        {columns.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex items-center gap-1">
                      {PRIORITY_ICONS[issue.priority]}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {issue.assignee ? (
                        <span className="text-[11px] text-neutral-300 font-medium">
                          {issue.assignee.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Unassigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 font-mono">
              <span>{filteredIssues.length} issues in board · Fully interactive demo</span>
              <span className="hidden sm:inline">Try dragging any card across columns</span>
            </div>
          </div>
        </div>

        {/* Custom Feature Note & Warning Popup Modal */}
        {activeNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 ring-1 ring-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                    {activeNoteModal.icon}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${activeNoteModal.badgeColor}`}
                    >
                      {activeNoteModal.badge}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {activeNoteModal.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setActiveNoteModal(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {activeNoteModal.description}
              </p>

              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                  Key Capabilities
                </p>
                <ul className="space-y-1.5 text-xs text-neutral-300">
                  {activeNoteModal.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveNoteModal(null)}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition shadow-lg"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}