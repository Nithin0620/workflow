"use client";

import { useEffect, useState } from "react";
import { IssueStatus, IssuePriority } from "@prisma/client";
import {
  getIssueDetails,
  updateIssueDetails,
  addIssueComment,
} from "@/actions/issues";
import { attachFileToComment, deleteAttachment } from "@/actions/attachments";
import { triggerAiIssueTriage } from "@/actions/ai-triage";
import { uploadFileToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary-client";
import { ATTACHMENT_MAX_BYTES } from "@/lib/validators";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { formatIssueKey, formatDate } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import { AttachmentSection, AttachmentGrid, type AttachmentItem } from "./attachment-section";
import Link from "next/link";
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
  Trash2,
  Paperclip,
  ImagePlus,
  Bot,
  Sparkles,
  ExternalLink,
  Hash,
} from "lucide-react";

interface IssueDetailModalProps {
  issueId: string | null;
  initialData?: Partial<IssueDetailData> | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueDeleted?: (deletedIssueId: string) => void;
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

import { useProjectRealtime } from "@/hooks/use-project-realtime";

interface IssueCommentDetail {
  id: string;
  content: string;
  createdAt: string | Date;
  author?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  attachments?: AttachmentItem[];
}

interface IssueDetailData {
  id: string;
  projectId: string;
  projectKey: string;
  issueNumber: number;
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  estimate?: number | null;
  assigneeId?: string | null;
  sprintId?: string | null;
  createdAt: string | Date;
  creator?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  project?: {
    workspace?: {
      members?: Array<{
        user: { id: string; name?: string | null; email?: string | null; image?: string | null };
      }>;
    };
    sprints?: Array<{
      id: string;
      name: string;
      number: number;
      goal?: string | null;
      startDate: string | Date;
      endDate: string | Date;
      isActive: boolean;
    }>;
  } | null;
  attachments?: AttachmentItem[];
  comments?: IssueCommentDetail[];
  activityLogs?: Array<{
    id: string;
    action: string;
    createdAt: string | Date;
    actor?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  }>;
  discussionLinks?: Array<{
    id: string;
    message: {
      id: string;
      content: string;
      createdAt: string | Date;
      author: { id: string; name?: string | null; email?: string | null; image?: string | null };
      channel: {
        id: string;
        name: string;
        workspace: {
          slug: string;
          organization: { slug: string };
        };
      };
    };
    creator?: { id: string; name?: string | null } | null;
  }>;
}

function deduplicateById<T extends { id?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item) continue;
    const id = item.id;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    result.push(item);
  }
  return result;
}

export function IssueDetailModal({
  issueId,
  initialData,
  isOpen,
  onClose,
  onIssueDeleted,
  onIssueUpdated,
}: IssueDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [issue, setIssue] = useState<IssueDetailData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionMode, setDescriptionMode] = useState<"edit" | "preview">("edit");
  const [status, setStatus] = useState<IssueStatus>("TODO");
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [estimate, setEstimate] = useState<number | "">("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<CloudinaryUploadResult[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [customGroqKey, setCustomGroqKey] = useState("");

  const issueAttachments: AttachmentItem[] = deduplicateById(
    Array.isArray(issue?.attachments) ? issue.attachments.filter((a) => !a.commentId) : []
  );

  const commentsList: IssueCommentDetail[] = deduplicateById(
    Array.isArray(issue?.comments) ? issue.comments : []
  );
  const activityList: IssueDetailData["activityLogs"] = deduplicateById(
    Array.isArray(issue?.activityLogs) ? issue.activityLogs : []
  );

  // Real-time synchronization for this issue's project channel
  useProjectRealtime({
    projectId: issue?.projectId || "",
    enabled: isOpen && !!issue?.projectId,
    onEvent: (event) => {
      if (event.type === "COMMENT_ADDED" && event.data.issueId === issueId && event.data.comment) {
        setIssue((prev) => {
          if (!prev) return prev;
          const currentComments = Array.isArray(prev.comments) ? prev.comments : [];
          if (currentComments.some((c) => c?.id === event.data.comment?.id)) return prev;
          return {
            ...prev,
            comments: deduplicateById([...currentComments, event.data.comment as IssueCommentDetail]),
          };
        });
      } else if (event.type === "ISSUE_UPDATED" && event.data.issueId === issueId && event.data.issue) {
        const updated = event.data.issue;
        setTitle(updated.title);
        setStatus(updated.status);
        setPriority(updated.priority);
        setEstimate(updated.estimate ?? "");
        if (updated.sprintId !== undefined) setSprintId(updated.sprintId ?? null);
        setIssue((prev) =>
          prev
            ? {
                ...prev,
                ...updated,
                comments: Array.isArray(prev.comments) ? prev.comments : [],
                activityLogs: Array.isArray(prev.activityLogs) ? prev.activityLogs : [],
              }
            : prev
        );
      } else if (event.type === "ISSUE_DELETED" && event.data.issueId === issueId) {
        onClose();
      } else if (event.type === "ATTACHMENT_ADDED" && event.data.issueId === issueId && event.data.attachment) {
        setIssue((prev) => {
          if (!prev) return prev;
          const att = event.data.attachment as AttachmentItem;
          if (att.commentId) {
            return {
              ...prev,
              comments: (prev.comments || []).map((c) =>
                c.id === att.commentId
                  ? { ...c, attachments: deduplicateById([...(c.attachments || []), att]) }
                  : c
              ),
            };
          }
          const current = Array.isArray(prev.attachments) ? prev.attachments : [];
          if (current.some((a) => a?.id === att.id)) return prev;
          return { ...prev, attachments: [...current, att] };
        });
      } else if (event.type === "ATTACHMENT_DELETED" && event.data.issueId === issueId && event.data.attachmentId) {
        const id = event.data.attachmentId;
        setIssue((prev) =>
          prev
            ? {
                ...prev,
                attachments: (Array.isArray(prev.attachments) ? prev.attachments : []).filter(
                  (a) => a?.id !== id
                ),
                comments: (prev.comments || []).map((c) => ({
                  ...c,
                  attachments: (c.attachments || []).filter((a) => a?.id !== id),
                })),
              }
            : prev
        );
      }
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (initialData && (!issue || issue.id !== initialData.id)) {
      setIssue(initialData as IssueDetailData);
      if (initialData.title) setTitle(initialData.title);
      if (initialData.description !== undefined) setDescription(initialData.description || "");
      if (initialData.status) setStatus(initialData.status as IssueStatus);
      if (initialData.priority) setPriority(initialData.priority as IssuePriority);
      if (initialData.estimate !== undefined) setEstimate(initialData.estimate ?? "");
      if (initialData.assigneeId !== undefined) setAssigneeId(initialData.assigneeId);
      if (initialData.sprintId !== undefined) setSprintId(initialData.sprintId ?? null);
    }

    if (!issueId) return;

    let isMounted = true;
    setLoading(true);

    getIssueDetails(issueId)
      .then((data) => {
        if (!isMounted || !data) return;
        setIssue({
          ...data,
          comments: Array.isArray(data.comments) ? data.comments : [],
          activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : [],
        });
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
        setPriority(data.priority);
        setEstimate(data.estimate ?? "");
        setAssigneeId(data.assigneeId);
        setSprintId(data.sprintId ?? null);
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
      setIssue((prev) => ({
        ...prev,
        ...res.issue,
        comments: Array.isArray(prev?.comments) ? prev.comments : [],
        activityLogs: Array.isArray(prev?.activityLogs) ? prev.activityLogs : [],
      }));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("workflow_notification_updated"));
      }
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

  const handleDeleteIssue = async () => {
    if (!issueId) return;
    if (!window.confirm("Are you sure you want to delete this issue?")) return;

    setDeleting(true);
    const { deleteIssue } = await import("@/actions/issues");
    const res = await deleteIssue(issueId);

    if (res?.success) {
      onIssueDeleted?.(issueId);
      onClose();
    } else {
      alert(res?.error || "Could not delete issue.");
    }
    setDeleting(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!commentContent.trim() && pendingAttachments.length === 0) || submittingComment) return;

    setSubmittingComment(true);
    const res = await addIssueComment(issue!.id, commentContent.trim() || " ");
    if (res.success && res.comment) {
      setIssue((prev) => {
        if (!prev) return prev;
        const currentComments = Array.isArray(prev.comments) ? prev.comments : [];
        if (currentComments.some((c) => c?.id === res.comment.id)) return prev;
        return {
          ...prev,
          comments: deduplicateById([...currentComments, { ...res.comment, attachments: [] }]),
        };
      });

      if (pendingAttachments.length > 0) {
        const attached: AttachmentItem[] = [];
        for (const meta of pendingAttachments) {
          const r = await attachFileToComment(issue!.id, res.comment.id, meta);
          if (r.success && r.attachment) attached.push(r.attachment as AttachmentItem);
        }
        if (attached.length > 0) {
          setIssue((prev) =>
            prev
              ? {
                  ...prev,
                  comments: (prev.comments || []).map((c) =>
                    c.id === res.comment.id
                      ? { ...c, attachments: deduplicateById([...(c.attachments || []), ...attached]) }
                      : c
                  ),
                }
              : prev
          );
        }
      }

      setCommentContent("");
      setPendingAttachments([]);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("workflow_notification_updated"));
      }
    }
    setSubmittingComment(false);
  };

  const handleCommentFileUpload = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (file.size > ATTACHMENT_MAX_BYTES) {
        alert(`${file.name} exceeds the 10MB limit and was skipped.`);
        continue;
      }
      try {
        const meta = await uploadFileToCloudinary(file);
        setPendingAttachments((prev) => [...prev, meta]);
      } catch {
        alert(`Failed to upload ${file.name}. Check your Cloudinary configuration.`);
      }
    }
  };

  const handleDeleteCommentAttachment = async (attachmentId: string) => {
    if (!window.confirm("Delete this attachment?")) return;
    const res = await deleteAttachment(attachmentId);
    if (res.success) {
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).map((c) => ({
                ...c,
                attachments: (c.attachments || []).filter((a) => a?.id !== attachmentId),
              })),
            }
          : prev
      );
    } else {
      alert(res.error || "Could not delete attachment.");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerAiFix = async (apiKeyOverride?: string) => {
    if (!issue || aiScanning) return;
    setAiScanning(true);
    const res = await triggerAiIssueTriage(issue.id, apiKeyOverride || customGroqKey || undefined);
    setAiScanning(false);

    if (res.success && res.comment) {
      setIssue((prev) => {
        if (!prev) return prev;
        const currentComments = Array.isArray(prev.comments) ? prev.comments : [];
        return {
          ...prev,
          comments: deduplicateById([...currentComments, { ...res.comment, isAi: true, attachments: [] }]),
        };
      });
      setActiveTab("comments");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("workflow_notification_updated"));
      }
    } else {
      if (res.error && res.error.includes("GROQ_API_KEY")) {
        const key = prompt("Enter your Groq API Key (gsk_...) to generate the autonomous AI fix:");
        if (key && key.trim()) {
          setCustomGroqKey(key.trim());
          handleTriggerAiFix(key.trim());
          return;
        }
      }
      alert(res.error || "Failed to generate AI fix.");
    }
  };

  const workspaceMembers = issue?.project?.workspace?.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-neutral-800 bg-[#0a0a0a] shadow-2xl text-white overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3.5 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            {issue && (
              <div className="flex items-center gap-1 group/key">
                <span className="font-mono text-xs font-bold text-neutral-300 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded-md">
                  {formatIssueKey(issue.projectKey, issue.issueNumber)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formatIssueKey(issue.projectKey, issue.issueNumber));
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 2000);
                  }}
                  className="opacity-0 group-hover/key:opacity-100 transition-opacity p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  title="Copy Issue Key"
                >
                  {keyCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            <button
              onClick={copyLink}
              className="cursor-pointer flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy link</span>
                </>
              )}
            </button>

            {/* Ask AI for Fix Button */}
            <button
              onClick={() => handleTriggerAiFix()}
              disabled={aiScanning}
              title="Autonomous Codebase Scan & Recommended Patch via Groq AI"
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:border-emerald-500/70 hover:bg-emerald-500/20 transition shadow-sm disabled:opacity-50"
            >
              {aiScanning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>{aiScanning ? "AI Scanning Code..." : "Ask AI for Fix"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteIssue}
              disabled={deleting}
              title="Delete issue"
              className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-rose-950/50 hover:text-rose-400 transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : !issue ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500 bg-[#0a0a0a]">
            Issue not found.
          </div>
        ) : (
          <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-[#0a0a0a]">
            {/* Left Content Area (Title, Description, Comments) */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
              {/* Editable Title */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleUpdate({ title })}
                  className="w-full text-xl font-bold tracking-tight text-white bg-transparent border-b border-transparent hover:border-neutral-800 focus:border-neutral-500 focus:outline-none transition py-1"
                />
              </div>

              {/* Originating Discussion Card */}
              {issue.discussionLinks && issue.discussionLinks.length > 0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                        <Hash className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white font-mono">
                        Started in #{issue.discussionLinks[0].message.channel.name}
                      </span>
                    </div>
                    {issue.discussionLinks[0].message.channel.workspace?.organization?.slug && (
                      <Link
                        href={`/${issue.discussionLinks[0].message.channel.workspace.organization.slug}/${issue.discussionLinks[0].message.channel.workspace.slug}/discussions/${issue.discussionLinks[0].message.channel.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition"
                      >
                        <span>Open Discussion</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <div className="rounded-xl border border-neutral-800/80 bg-black/60 p-3 text-xs text-neutral-300">
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-neutral-400">
                      <span className="font-semibold text-white">
                        {issue.discussionLinks[0].message.author.name || "Teammate"}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        {new Date(issue.discussionLinks[0].message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-neutral-300 italic font-mono text-[11px]">
                      "{issue.discussionLinks[0].message.content}"
                    </p>
                  </div>
                </div>
              )}

              {/* Editable Markdown Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    DESCRIPTION
                  </label>
                  <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setDescriptionMode("edit")}
                      className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                        descriptionMode === "edit" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescriptionMode("preview")}
                      className={`cursor-pointer rounded-md px-2.5 py-1 transition ${
                        descriptionMode === "preview" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                {descriptionMode === "edit" ? (
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => handleUpdate({ description })}
                    placeholder="Add a detailed description or acceptance criteria (Markdown supported)..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600 focus:bg-neutral-900 focus:outline-none transition resize-y"
                  />
                ) : (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5">
                    <Markdown content={description || "_No description yet._"} />
                  </div>
                )}
              </div>

              {/* Attachments */}
              <AttachmentSection
                issueId={issue.id}
                attachments={issueAttachments}
                onAdded={(att) =>
                  setIssue((prev) =>
                    prev
                      ? { ...prev, attachments: deduplicateById([...(prev.attachments || []), att]) }
                      : prev
                  )
                }
                onDeleted={(attId) =>
                  setIssue((prev) =>
                    prev
                      ? {
                          ...prev,
                          attachments: (Array.isArray(prev.attachments) ? prev.attachments : []).filter(
                            (a) => a?.id !== attId
                          ),
                        }
                      : prev
                  )
                }
              />

              {/* Activity & Comments Tabs */}
              <div className="border-t border-neutral-800 pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`cursor-pointer flex items-center gap-1.5 pb-2 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                      activeTab === "comments"
                        ? "border-white text-white"
                        : "border-transparent text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Comments ({commentsList.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`cursor-pointer flex items-center gap-1.5 pb-2 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                      activeTab === "activity"
                        ? "border-white text-white"
                        : "border-transparent text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Activity History ({activityList.length})</span>
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === "comments" ? (
                  <div className="space-y-4">
                    {/* Comments list */}
                    <div className="space-y-3">
                      {commentsList
                        .filter(Boolean)
                        .map((c: any, index: number) => {
                          const isAiComment = !!c.isAi || (typeof c.content === "string" && c.content.includes("Autonomous AI"));
                          const authorName = isAiComment ? "Workflow AI Assistant" : (c.author?.name || c.author?.email || "Teammate");
                          const initial = isAiComment ? "AI" : (authorName.charAt(0).toUpperCase() || "U");

                          return (
                            <div
                              key={c.id || `comment-${index}`}
                              className={`flex gap-3 rounded-xl p-3.5 border transition ${
                                isAiComment
                                  ? "border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-950/10"
                                  : "border-neutral-800 bg-neutral-900/50"
                              }`}
                            >
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border shadow-sm ${
                                  isAiComment
                                    ? "bg-emerald-900 border-emerald-500/50 text-emerald-300"
                                    : "bg-neutral-800 text-white border-neutral-700"
                                }`}
                              >
                                {isAiComment ? <Bot className="h-4 w-4" /> : initial}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-bold ${isAiComment ? "text-emerald-300" : "text-neutral-200"}`}>
                                      {authorName}
                                    </span>
                                    {isAiComment && (
                                      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-300 uppercase">
                                        Groq AI
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-neutral-400">
                                    {formatDate(c.createdAt)}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans">
                                  <Markdown content={c.content || ""} />
                                </div>
                                {c.attachments?.length > 0 && (
                                  <div className="pt-2">
                                    <AttachmentGrid
                                      attachments={c.attachments}
                                      onDelete={handleDeleteCommentAttachment}
                                      compact
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {commentsList.length === 0 && (
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
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600 focus:bg-neutral-900 focus:outline-none transition resize-none"
                      />

                      {pendingAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pendingAttachments.map((meta, idx) =>
                            meta.fileType.startsWith("image/") ? (
                              <div key={idx} className="group relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={meta.fileUrl}
                                  alt={meta.fileName}
                                  className="h-12 w-12 rounded-lg border border-neutral-800 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="cursor-pointer absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-rose-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <span
                                key={idx}
                                className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300"
                              >
                                <Paperclip className="h-3 w-3 text-neutral-400" />
                                <span className="max-w-[120px] truncate">{meta.fileName}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="cursor-pointer text-neutral-500 hover:text-rose-400"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="cursor-pointer rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
                          <ImagePlus className="h-4 w-4" />
                          <input
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => {
                              if (e.target.files) handleCommentFileUpload(e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={
                            submittingComment || (!commentContent.trim() && pendingAttachments.length === 0)
                          }
                          className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow transition hover:bg-neutral-200 disabled:opacity-50"
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
                    {activityList
                      .filter(Boolean)
                      .map((log: any, index: number) => {
                        const isDiscussionAction =
                          log.action === "CREATED_FROM_DISCUSSION" ||
                          log.action === "LINKED_DISCUSSION";
                        const channelName = log.details?.channelName;

                        return (
                          <div
                            key={log.id || `log-${index}`}
                            className={`flex items-center gap-3 text-xs py-2 border-b border-neutral-800/40 last:border-b-0 ${
                              isDiscussionAction ? "text-amber-300 font-medium" : "text-neutral-300"
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isDiscussionAction ? "bg-amber-400" : "bg-neutral-400"
                              }`}
                            />
                            <span className="font-bold text-white">
                              {log.actor?.name || log.actor?.email || "User"}
                            </span>
                            <span>
                              {log.action === "CREATED_FROM_DISCUSSION"
                                ? `created this issue from discussion in #${channelName || "channel"}`
                                : log.action === "LINKED_DISCUSSION"
                                ? `linked this issue to discussion in #${channelName || "channel"}`
                                : log.action
                                ? String(log.action).replace(/_/g, " ").toLowerCase()
                                : "updated"}
                            </span>
                            <span className="text-[11px] text-neutral-400 ml-auto font-mono">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                    {activityList.length === 0 && (
                      <div className="py-6 text-center text-xs text-neutral-400">
                        No activity recorded yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Properties Panel */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-950 p-6 space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                PROPERTIES
              </h4>

              {/* Status Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as IssueStatus;
                    setStatus(newStatus);
                    handleUpdate({ status: newStatus });
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 focus:border-neutral-600 focus:outline-none transition"
                >
                  {ISSUE_STATUSES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    const newPriority = e.target.value as IssuePriority;
                    setPriority(newPriority);
                    handleUpdate({ priority: newPriority });
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 focus:border-neutral-600 focus:outline-none transition"
                >
                  {ISSUE_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId || ""}
                  onChange={(e) => {
                    const newAssignee = e.target.value || null;
                    setAssigneeId(newAssignee);
                    handleUpdate({ assigneeId: newAssignee });
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 focus:border-neutral-600 focus:outline-none transition"
                >
                  <option value="" className="bg-neutral-900 text-white">Unassigned</option>
                  {workspaceMembers.map((m: any) => (
                    <option key={m.user.id} value={m.user.id} className="bg-neutral-900 text-white">
                      {m.user.name || m.user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Sprint
                </label>
                <select
                  value={sprintId || ""}
                  onChange={(e) => {
                    const newSprint = e.target.value || null;
                    setSprintId(newSprint);
                    handleUpdate({ sprintId: newSprint });
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 focus:border-neutral-600 focus:outline-none transition"
                >
                  <option value="" className="bg-neutral-900 text-white">No sprint</option>
                  {(issue?.project?.sprints || []).map((s) => (
                    <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                      {s.isActive ? "● " : ""}Sprint {s.number} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
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
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none transition"
                />
              </div>

              {/* Metadata */}
              <div className="border-t border-neutral-800 pt-4 space-y-2 text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-semibold text-neutral-300">
                    {formatDate(issue.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reporter:</span>
                  <span className="font-semibold text-neutral-300">
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
