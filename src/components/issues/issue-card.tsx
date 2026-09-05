"use client";

import { IssuePriority, IssueStatus } from "@prisma/client";
import { MessageSquare, Paperclip, ArrowUp, ArrowDown, Equal, AlertCircle, Minus } from "lucide-react";
import { formatIssueKey } from "@/lib/utils";

interface IssueCardProps {
  issue: {
    id: string;
    projectKey: string;
    issueNumber: number;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    estimate?: number | null;
    assignee?: { id: string; name?: string | null; image?: string | null } | null;
    _count?: { comments: number; attachments: number };
  };
  onSelect?: () => void;
  onStatusChange?: (newStatus: IssueStatus) => void;
}

const PRIORITY_ICONS: Record<IssuePriority, React.ReactNode> = {
  NO_PRIORITY: <Minus className="h-3.5 w-3.5 text-neutral-400" />,
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
      className="group cursor-pointer rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-black hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-neutral-500">
          {issueKey}
        </span>
        <div className="flex items-center gap-1.5">
          {issue.estimate && (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-black border border-neutral-200">
              {issue.estimate} pts
            </span>
          )}
          <div title={issue.priority}>{PRIORITY_ICONS[issue.priority]}</div>
        </div>
      </div>

      <h4 className="mt-2 line-clamp-2 text-xs font-semibold text-black group-hover:text-neutral-700 transition-colors">
        {issue.title}
      </h4>

      <div className="mt-3.5 flex items-center justify-between border-t border-neutral-100 pt-2 text-neutral-400 text-xs">
        <div className="flex items-center gap-3">
          {issue._count && issue._count.comments > 0 && (
            <div className="flex items-center gap-1 font-medium">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{issue._count.comments}</span>
            </div>
          )}
          {issue._count && issue._count.attachments > 0 && (
            <div className="flex items-center gap-1 font-medium">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{issue._count.attachments}</span>
            </div>
          )}
        </div>

        {issue.assignee ? (
          <div
            title={issue.assignee.name || "Assigned"}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm"
          >
            {(issue.assignee.name || "U").charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="h-5 w-5 rounded-full border border-dashed border-neutral-300" />
        )}
      </div>
    </div>
  );
}
