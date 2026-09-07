"use client";

import { IssuePriority } from "@prisma/client";
import { MessageSquare, Paperclip, ArrowUp, ArrowDown, Equal, AlertCircle, Minus } from "lucide-react";
import { formatIssueKey } from "@/lib/utils";

interface IssueCardProps {
  issue: {
    id: string;
    projectKey: string;
    issueNumber: number;
    title: string;
    status: string;
    priority: IssuePriority;
    estimate?: number | null;
    assignee?: { id: string; name?: string | null; image?: string | null } | null;
    _count?: { comments: number; attachments: number };
  };
  onSelect?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

const PRIORITY_ICONS: Record<IssuePriority, React.ReactNode> = {
  NO_PRIORITY: <Minus className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />,
  LOW: <ArrowDown className="h-3.5 w-3.5 text-blue-600" />,
  MEDIUM: <Equal className="h-3.5 w-3.5 text-amber-600" />,
  HIGH: <ArrowUp className="h-3.5 w-3.5 text-orange-600" />,
  URGENT: <AlertCircle className="h-3.5 w-3.5 text-rose-600" />,
};

export function IssueCard({ issue, onSelect }: IssueCardProps) {
  const issueKey = formatIssueKey(issue.projectKey, issue.issueNumber);

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900/80 dark:bg-neutral-100/80 p-3.5 shadow-md transition hover:border-neutral-500 dark:hover:border-neutral-500 hover:bg-neutral-900 dark:hover:bg-neutral-100"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-600">
          {issueKey}
        </span>
        <div className="flex items-center gap-1.5">
          {issue.estimate && (
            <span className="rounded bg-neutral-800 dark:bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200 dark:text-neutral-800 border border-neutral-700 font-mono">
              {issue.estimate} pts
            </span>
          )}
          <div title={issue.priority}>{PRIORITY_ICONS[issue.priority]}</div>
        </div>
      </div>

      <h4 className="mt-2 line-clamp-2 text-xs font-semibold text-neutral-100 dark:text-neutral-900 group-hover:text-white dark:text-black transition-colors">
        {issue.title}
      </h4>

      <div className="mt-3.5 flex items-center justify-between border-t border-neutral-800/80 dark:border-neutral-200/80 pt-2 text-neutral-400 dark:text-neutral-600 text-xs">
        <div className="flex items-center gap-3">
          {issue._count && issue._count.comments > 0 && (
            <div className="flex items-center gap-1 font-medium text-neutral-400 dark:text-neutral-600">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{issue._count.comments}</span>
            </div>
          )}
          {issue._count && issue._count.attachments > 0 && (
            <div className="flex items-center gap-1 font-medium text-neutral-400 dark:text-neutral-600">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{issue._count.attachments}</span>
            </div>
          )}
        </div>

        {issue.assignee ? (
          <div
            title={issue.assignee.name || "Assigned"}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black text-[10px] font-bold text-black dark:text-white shadow-sm"
          >
            {(issue.assignee.name || "U").charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="h-5 w-5 rounded-full border border-dashed border-neutral-700 dark:border-neutral-300" />
        )}
      </div>
    </div>
  );
}
