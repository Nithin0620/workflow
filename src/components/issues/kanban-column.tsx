"use client";

import { IssueStatus, IssuePriority } from "@prisma/client";
import { IssueCard } from "./issue-card";
import { Plus } from "lucide-react";

interface IssueItem {
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

interface KanbanColumnProps {
  id: IssueStatus;
  label: string;
  color: string;
  issues: IssueItem[];
  onAddIssue: (status: IssueStatus) => void;
  onSelectIssue: (issue: IssueItem) => void;
  onDropIssue: (issueId: string, targetStatus: IssueStatus) => void;
}

export function KanbanColumn({
  id,
  label,
  color,
  issues,
  onAddIssue,
  onSelectIssue,
  onDropIssue,
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("text/plain");
    if (issueId) {
      onDropIssue(issueId, id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex h-full min-w-[280px] max-w-[320px] flex-1 flex-col rounded-2xl bg-neutral-100/70 p-3 border border-neutral-200"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-black" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-black">
            {label}
          </h3>
          <span className="rounded-full bg-white border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-700 font-mono">
            {issues.length}
          </span>
        </div>

        <button
          onClick={() => onAddIssue(id)}
          className="rounded-lg p-1 text-neutral-500 hover:bg-white hover:text-black hover:shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards container */}
      <div className="mt-2.5 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {issues.map((issue) => (
          <div
            key={issue.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", issue.id);
            }}
          >
            <IssueCard issue={issue} onSelect={() => onSelectIssue(issue)} />
          </div>
        ))}

        {issues.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-400">
            No issues in {label}
          </div>
        )}
      </div>
    </div>
  );
}
