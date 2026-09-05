"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceDetails, deleteWorkspace, leaveWorkspace } from "@/actions/members";
import { Trash2, LogOut, Edit3, Loader2, AlertTriangle } from "lucide-react";

interface WorkspaceDangerZoneProps {
  workspaceId: string;
  initialWorkspaceName: string;
  currentUserRole: string; // "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
}

export function WorkspaceDangerZone({
  workspaceId,
  initialWorkspaceName,
  currentUserRole,
}: WorkspaceDangerZoneProps) {
  const router = useRouter();
  const [name, setName] = useState(initialWorkspaceName);
  const [renaming, setRenaming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN" || isOwner;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setRenaming(true);
    setMessage(null);

    try {
      const res = await updateWorkspaceDetails(workspaceId, name.trim());
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Workspace renamed successfully." });
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to rename workspace." });
    } finally {
      setRenaming(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this workspace? You will lose access to its projects and issues.")) {
      return;
    }

    setLeaving(true);
    setMessage(null);

    try {
      const res = await leaveWorkspace(workspaceId);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
        setLeaving(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to leave workspace." });
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    const prompt = window.prompt(`This action is irreversible. Type "${initialWorkspaceName}" to permanently delete this workspace and all its data:`);
    if (prompt !== initialWorkspaceName) {
      if (prompt !== null) alert("Name did not match. Deletion cancelled.");
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const res = await deleteWorkspace(workspaceId);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
        setDeleting(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete workspace." });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rename Workspace (Owners & Admins) */}
      {isAdmin && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-neutral-400" />
            <span>Rename Workspace</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Change the display name of your team workspace.
          </p>

          <form onSubmit={handleRename} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-neutral-800 bg-black px-3.5 py-2 text-xs font-semibold text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={renaming || name === initialWorkspaceName || !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {renaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Name"}
            </button>
          </form>
        </div>
      )}

      {/* Danger Zone Box */}
      <div className="rounded-2xl border border-rose-950 bg-neutral-950 p-6 shadow-lg">
        <div className="flex items-center gap-2 text-rose-500">
          <AlertTriangle className="h-4 w-4" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono">
            Danger Zone
          </h2>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs ${
              message.type === "error"
                ? "bg-rose-950/60 border border-rose-900 text-rose-300"
                : "bg-emerald-950/60 border border-emerald-900 text-emerald-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-4 divide-y divide-neutral-900">
          {/* Leave Workspace */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <h3 className="text-xs font-bold text-white">Leave Workspace</h3>
              <p className="text-[11px] text-neutral-400">
                Revoke your access to this workspace and its projects.
              </p>
            </div>
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-neutral-300 hover:border-rose-900 hover:bg-rose-950/40 hover:text-rose-400 transition disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{leaving ? "Leaving..." : "Leave Workspace"}</span>
            </button>
          </div>

          {/* Delete Workspace (Owner Only) */}
          {isOwner && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div>
                <h3 className="text-xs font-bold text-rose-400">Delete this workspace</h3>
                <p className="text-[11px] text-neutral-500">
                  Permanently remove this workspace, its projects, and all contained issues.
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-lg shadow-rose-950"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? "Deleting..." : "Delete Workspace"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
