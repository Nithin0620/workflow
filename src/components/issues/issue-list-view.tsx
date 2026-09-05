"use client";

import { useState } from "react";
import { IssuePriority } from "@prisma/client";
import { IssueItem } from "./kanban-board";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { formatIssueKey } from "@/lib/utils";
import {
  Minus,
  ArrowDown,
  Equal,
  ArrowUp,
  AlertCircle,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Circle,
  Clock,
  ArrowUpDown,
} from "lucide-react";

interface IssueListViewProps {
  issues: IssueItem[];
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange?: (issueId: string, newStatus: string) => void;
}

const PRIORITY_CONFIG: Record<
  IssuePriority,
  { label: string; icon: any; color: string }
> = {
  NO_PRIORITY: { label: "No Priority", icon: Minus, color: "text-neutral-500" },
  LOW: { label: "Low", icon: ArrowDown, color: "text-blue-400" },
  MEDIUM: { label: "Medium", icon: Equal, color: "text-amber-400" },
  HIGH: { label: "High", icon: ArrowUp, color: "text-orange-400" },
  URGENT: { label: "Urgent", icon: AlertCircle, color: "text-rose-400" },
};

export function IssueListView({
  issues,
  onSelectIssue,
  onStatusChange,
}: IssueListViewProps) {
  const [sortField, setSortField] = useState<"key" | "title" | "status" | "priority">("key");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: "key" | "title" | "status" | "priority") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    let comp = 0;
    if (sortField === "key") {
      comp = a.issueNumber - b.issueNumber;
    } else if (sortField === "title") {
      comp = a.title.localeCompare(b.title);
    } else if (sortField === "status") {
      comp = a.status.localeCompare(b.status);
    } else if (sortField === "priority") {
      const priorityOrder: Record<IssuePriority, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        NO_PRIORITY: 0,
      };
      comp = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
    }
    return sortAsc ? comp : -comp;
  });

  if (issues.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-8 text-center">
        <p className="text-sm font-semibold text-neutral-400">No issues found matching your filters</p>
        <p className="text-xs text-neutral-600 mt-1">Try resetting filters or create a new issue.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="border-b border-neutral-800 bg-black text-neutral-400">
            <tr>
              <th
                onClick={() => handleSort("key")}
                className="cursor-pointer py-3.5 pl-4 pr-3 font-mono font-bold uppercase tracking-wider hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Key</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("title")}
                className="cursor-pointer px-3 py-3.5 font-bold uppercase tracking-wider hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Title</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="cursor-pointer px-3 py-3.5 font-bold uppercase tracking-wider hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("priority")}
                className="cursor-pointer px-3 py-3.5 font-bold uppercase tracking-wider hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-3.5 font-bold uppercase tracking-wider">Assignee</th>
              <th className="px-3 py-3.5 font-bold uppercase tracking-wider text-right pr-4">Details</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-900 bg-neutral-950">
            {sortedIssues.map((issue) => {
              const priority = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.NO_PRIORITY;
              const PriorityIcon = priority.icon;
              const statusMeta = ISSUE_STATUSES.find((s) => s.id === issue.status);

              return (
                <tr
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="group cursor-pointer transition hover:bg-neutral-900/60"
                >
                  {/* Issue Key */}
                  <td className="whitespace-nowrap py-3.5 pl-4 pr-3 font-mono font-bold text-neutral-400 group-hover:text-white">
                    {formatIssueKey(issue.projectKey, issue.issueNumber)}
                  </td>

                  {/* Title */}
                  <td className="px-3 py-3.5">
                    <span className="font-semibold text-white group-hover:underline">
                      {issue.title}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: statusMeta?.color?.replace("bg-", "#") || "#737373" }}
                      />
                      <span className="font-medium text-neutral-300">
                        {statusMeta?.label || issue.status}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <div className={`flex items-center gap-1.5 font-medium ${priority.color}`}>
                      <PriorityIcon className="h-3.5 w-3.5" />
                      <span>{priority.label}</span>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="whitespace-nowrap px-3 py-3.5">
                    {issue.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-bold text-white">
                          {(issue.assignee.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-neutral-300 font-medium truncate max-w-[120px]">
                          {issue.assignee.name || "Assigned"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-neutral-600 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Points & Counts */}
                  <td className="whitespace-nowrap px-3 py-3.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-3 text-neutral-500">
                      {issue.estimate !== undefined && issue.estimate !== null && (
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-neutral-400">
                          {issue.estimate} pts
                        </span>
                      )}
                      {(issue._count?.comments ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <MessageSquare className="h-3 w-3" />
                          <span>{issue._count?.comments}</span>
                        </div>
                      )}
                      {(issue._count?.attachments ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Paperclip className="h-3 w-3" />
                          <span>{issue._count?.attachments}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
