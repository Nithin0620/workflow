"use client";

import { useEffect, useState } from "react";
import { IssueStatus, IssuePriority } from "@prisma/client";
import {
  getIssueDetails,
  updateIssueDetails,
  addIssueComment,
} from "@/actions/issues";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { formatIssueKey, formatDate } from "@/lib/utils";
import {
  X,
  MessageSquare,
  Activity,
  Send,
  Loader2,
  Minus,
  ArrowDown,
  Equal,
  ArrowUp,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface IssueDetailModalProps {
  issueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueUpdated?: (updated: {
    id: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    estimate?: number | null;
    assignee?: { id: string; name?: string | null; image?: string | null } | null;
  }) => void;
}

const PRIORITY_ICONS: Record<IssuePriority, React.ReactNode> = {
  NO_PRIORITY: <Minus className="h-4 w-4 text-neutral-400" />,
  LOW: <ArrowDown className="h-4 w-4 text-blue-600" />,
  MEDIUM: <Equal className="h-4 w-4 text-amber-600" />,
  HIGH: <ArrowUp className="h-4 w-4 text-orange-600" />,
  URGENT: <AlertCircle className="h-4 w-4 text-rose-600" />,
};

export function IssueDetailModal({
  issueId,
  isOpen,
  onClose,
  onIssueUpdated,
}: IssueDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("TODO");
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [estimate, setEstimate] = useState<number | "">("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!issueId || !isOpen) return;

    let isMounted = true;
    setLoading(true);

    getIssueDetails(issueId)
      .then((data) => {
        if (!isMounted || !data) return;
        setIssue(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
        setPriority(data.priority);
        setEstimate(data.estimate ?? "");
        setAssigneeId(data.assigneeId);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issueId, isOpen]);

  if (!isOpen || !issueId) return null;

  const handleUpdate = async (fields: Record<string, unknown>) => {
    if (!issue) return;
    const res = await updateIssueDetails(issue.id, fields);
    if (res.success && res.issue) {
      setIssue((prev: any) => ({ ...prev, ...res.issue }));
      onIssueUpdated?.({
        id: issue.id,
        title: (fields.title as string) ?? title,
        status: (fields.status as IssueStatus) ?? status,
        priority: (fields.priority as IssuePriority) ?? priority,
        estimate: (fields.estimate as number) ?? (estimate === "" ? null : Number(estimate)),
        assignee: res.issue.assignee,
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || submittingComment) return;

    setSubmittingComment(true);
    const res = await addIssueComment(issue.id, commentContent.trim());
    if (res.success && res.comment) {
      setIssue((prev: any) => ({
        ...prev,
        comments: [...prev.comments, res.comment],
      }));
      setCommentContent("");
    }
    setSubmittingComment(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const workspaceMembers = issue?.project?.workspace?.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-neutral-300 bg-white shadow-2xl text-black overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3.5 bg-neutral-50">
          <div className="flex items-center gap-3">
            {issue && (
              <span className="font-mono text-xs font-bold text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                {formatIssueKey(issue.projectKey, issue.issueNumber)}
              </span>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-black transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-black transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        ) : !issue ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500 bg-white">
            Issue not found.
          </div>
        ) : (
          <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-white">
            {/* Left Content Area (Title, Description, Comments) */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
              {/* Editable Title */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleUpdate({ title })}
                  className="w-full text-xl font-bold tracking-tight text-black bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-black focus:outline-none transition py-1"
                />
              </div>

              {/* Editable Markdown Description */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                  DESCRIPTION
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleUpdate({ description })}
                  placeholder="Add a detailed description or acceptance criteria (Markdown supported)..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Activity & Comments Tabs */}
              <div className="border-t border-neutral-200 pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                      activeTab === "comments"
                        ? "border-black text-black"
                        : "border-transparent text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Comments ({issue.comments.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                      activeTab === "activity"
                        ? "border-black text-black"
                        : "border-transparent text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Activity History ({issue.activityLogs.length})</span>
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === "comments" ? (
                  <div className="space-y-4">
                    {/* Comments list */}
                    <div className="space-y-3">
                      {issue.comments.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm">
                            {(c.author.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-black">
                                {c.author.name || c.author.email}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {formatDate(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      {issue.comments.length === 0 && (
                        <div className="py-6 text-center text-xs text-neutral-400">
                          No comments yet. Start the conversation below.
                        </div>
                      )}
                    </div>

                    {/* New Comment Input */}
                    <form onSubmit={handleCommentSubmit} className="space-y-2">
                      <textarea
                        rows={3}
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Write a comment... (supports Markdown & @mentions)"
                        className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingComment || !commentContent.trim()}
                          className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-1.5 text-xs font-bold text-white shadow transition hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {submittingComment ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Comment</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Activity Timeline */
                  <div className="space-y-3">
                    {issue.activityLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 text-xs text-neutral-700 py-1.5"
                      >
                        <div className="h-2 w-2 rounded-full bg-black shrink-0" />
                        <span className="font-bold text-black">
                          {log.actor?.name || "User"}
                        </span>
                        <span>{log.action.replace(/_/g, " ").toLowerCase()}</span>
                        <span className="text-[11px] text-neutral-400 ml-auto font-mono">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Properties Panel */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-neutral-200 bg-neutral-50/70 p-6 space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                PROPERTIES
              </h4>

              {/* Status Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as IssueStatus;
                    setStatus(newStatus);
                    handleUpdate({ status: newStatus });
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                >
                  {ISSUE_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    const newPriority = e.target.value as IssuePriority;
                    setPriority(newPriority);
                    handleUpdate({ priority: newPriority });
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                >
                  {ISSUE_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId || ""}
                  onChange={(e) => {
                    const newAssignee = e.target.value || null;
                    setAssigneeId(newAssignee);
                    handleUpdate({ assigneeId: newAssignee });
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-black focus:border-black focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {workspaceMembers.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name || m.user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Story Points
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={() => handleUpdate({ estimate: estimate === "" ? null : Number(estimate) })}
                  placeholder="0"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-bold text-black focus:border-black focus:outline-none"
                />
              </div>

              {/* Metadata */}
              <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs text-neutral-500">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-semibold text-black">
                    {formatDate(issue.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reporter:</span>
                  <span className="font-semibold text-black">
                    {issue.creator?.name || "Author"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
