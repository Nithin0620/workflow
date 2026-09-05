"use client";

import { useState } from "react";
import { IssueStatus, IssuePriority } from "@prisma/client";
import { KanbanColumn } from "./kanban-column";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueDetailModal } from "./issue-detail-modal";
import { ISSUE_STATUSES } from "@/lib/constants";
import { moveIssue } from "@/actions/issues";
import { Plus, Search } from "lucide-react";

export interface IssueItem {
  id: string;
  projectKey: string;
  issueNumber: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  estimate?: number | null;
  assignee?: { id: string; name?: string | null; image?: string | null } | null;
  _count?: { comments: number; attachments: number };
}

interface KanbanBoardProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  initialIssues: IssueItem[];
}

export function KanbanBoard({
  projectId,
  projectKey,
  projectName,
  initialIssues,
}: KanbanBoardProps) {
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>("TODO");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const filteredIssues = issues.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      `${i.projectKey}-${i.issueNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDropIssue = async (issueId: string, targetStatus: IssueStatus) => {
    // Optimistic UI update
    setIssues((prev) =>
      prev.map((item) => (item.id === issueId ? { ...item, status: targetStatus } : item))
    );

    // Call server action
    await moveIssue(issueId, targetStatus, 1000);
  };

  const handleAddIssue = (status: IssueStatus) => {
    setSelectedStatus(status);
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

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Board Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {projectName}
          </h1>
          <span className="font-mono text-xs rounded-md bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {projectKey}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter issues..."
              className="w-48 sm:w-64 rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <button
            onClick={() => handleAddIssue("TODO")}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {ISSUE_STATUSES.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id as IssueStatus}
            label={col.label}
            color={col.color}
            issues={filteredIssues.filter((i) => i.status === col.id)}
            onAddIssue={handleAddIssue}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onDropIssue={handleDropIssue}
          />
        ))}
      </div>

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        projectId={projectId}
        projectKey={projectKey}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        defaultStatus={selectedStatus}
      />

      {/* Issue Detail & Discussion Modal */}
      <IssueDetailModal
        issueId={selectedIssueId}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onIssueUpdated={handleIssueUpdated}
      />
    </div>
  );
}
