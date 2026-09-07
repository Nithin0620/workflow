"use client";

import { useEffect, useState } from "react";
import { ProjectRole } from "@prisma/client";
import {
  getProjectTeamAndSettings,
  addOrUpdateProjectMember,
  removeProjectMember,
  toggleProjectPrivacy,
  deleteProject,
} from "@/actions/projects";
import {
  X,
  Shield,
  Crown,
  UserCheck,
  Eye,
  Lock,
  Globe,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectPermissionsDialogProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  workspaceSlug: string;
}

const PROJECT_ROLE_META: Record<
  ProjectRole,
  { label: string; icon: any; color: string; desc: string }
> = {
  OWNER: {
    label: "Project Co-Owner / Lead",
    icon: Crown,
    color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    desc: "Full management access: settings, members, issue deletions, and configuration.",
  },
  EDITOR: {
    label: "Write / Editor",
    icon: UserCheck,
    color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    desc: "Can create, move, edit, and comment on issues.",
  },
  VIEWER: {
    label: "Read-Only / Viewer",
    icon: Eye,
    color: "border-neutral-500/30 dark:border-neutral-500/30 bg-neutral-500/10 dark:bg-neutral-500/10 text-neutral-400",
    desc: "Can view issues, boards, and comments with no edit permissions.",
  },
};

export function ProjectPermissionsDialog({
  projectId,
  projectKey,
  projectName,
  isOpen,
  onClose,
  orgSlug,
  workspaceSlug,
}: ProjectPermissionsDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole>("VIEWER");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState("");
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<ProjectRole>("EDITOR");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getProjectTeamAndSettings(projectId);
      setProjectData(data.project);
      setCurrentUserRole(data.currentUserRole);
      setCurrentUserId(data.currentUserId);
      setIsPrivate(data.project?.isPrivate || false);
    } catch (err: any) {
      setError(err.message || "Failed to load project permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const isOwner = currentUserRole === "OWNER";

  const handleTogglePrivacy = async () => {
    if (!isOwner) return;
    const nextPrivacy = !isPrivate;
    setIsPrivate(nextPrivacy);
    try {
      await toggleProjectPrivacy(projectId, nextPrivacy);
      setSuccess(`Project is now ${nextPrivacy ? "Private (Restricted to team)" : "Public (Open to workspace)"}.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setIsPrivate(!nextPrivacy);
      setError("Failed to update project privacy.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserIdToAdd || !isOwner) return;

    setSavingId("adding");
    setError(null);

    try {
      const res = await addOrUpdateProjectMember(projectId, selectedUserIdToAdd, selectedRoleToAdd);
      if (res && "error" in res && res.error) {
        setError(res.error as string);
      } else {
        setSelectedUserIdToAdd("");
        await fetchSettings();
        setSuccess("Member access updated.");
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch {
      setError("Failed to add member to project.");
    } finally {
      setSavingId(null);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: ProjectRole) => {
    if (!isOwner) return;
    setSavingId(targetUserId);

    try {
      const res = await addOrUpdateProjectMember(projectId, targetUserId, newRole);
      if (res && "error" in res && res.error) {
        setError(res.error as string);
      } else {
        await fetchSettings();
      }
    } catch {
      setError("Failed to update member role.");
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner) return;
    if (!window.confirm("Remove member from this project?")) return;

    setSavingId(memberId);
    try {
      await removeProjectMember(projectId, memberId);
      await fetchSettings();
    } catch {
      setError("Failed to remove member.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!isOwner) return;
    const confirmName = window.prompt(`Type '${projectKey}' to permanently delete this project and all its issues:`);
    if (confirmName !== projectKey) return;

    try {
      await deleteProject(projectId);
      router.push(`/${orgSlug}/${workspaceSlug}/projects`);
    } catch {
      setError("Failed to delete project.");
    }
  };

  // Find workspace members who are NOT yet assigned explicitly
  const existingMemberUserIds = new Set(projectData?.members?.map((m: any) => m.userId) || []);
  const availableWorkspaceUsers = projectData?.workspace?.members?.filter(
    (wm: any) => !existingMemberUserIds.has(wm.userId)
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-2xl text-white dark:text-black max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 dark:border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-black text-black font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white dark:text-black">{projectName}</h2>
                <span className="font-mono text-xs rounded bg-neutral-900 dark:bg-neutral-100 border border-neutral-800 px-1.5 py-0.5 text-neutral-400 dark:text-neutral-600">
                  {projectKey}
                </span>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-600">
                Project-Level Access Control (RBAC) & Permissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-600" />
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Project Access Mode / Privacy Switch */}
            <div className="rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-300">
                    {isPrivate ? <Lock className="h-4 w-4 text-amber-400" /> : <Globe className="h-4 w-4 text-blue-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white dark:text-black">
                      {isPrivate ? "Private Project (Restricted)" : "Public Project (Workspace Wide)"}
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-600">
                      {isPrivate
                        ? "Only explicitly assigned project members and workspace admins can access this board."
                        : "All workspace members can view or edit based on default workspace roles."}
                    </p>
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={handleTogglePrivacy}
                    className="cursor-pointer rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition"
                  >
                    {isPrivate ? "Make Public" : "Make Private"}
                  </button>
                )}
              </div>
            </div>

            {/* Add Team Member to Project */}
            {isOwner && availableWorkspaceUsers.length > 0 && (
              <form onSubmit={handleAddMember} className="rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-4">
                <h3 className="text-xs font-bold text-white dark:text-black mb-2 flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Grant Project Access to Workspace Member</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedUserIdToAdd}
                    onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3 py-2 text-xs text-white dark:text-black focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="">Select a teammate...</option>
                    {availableWorkspaceUsers.map((wm: any) => (
                      <option key={wm.user.id} value={wm.user.id}>
                        {wm.user.name || wm.user.email} ({wm.user.email})
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedRoleToAdd}
                    onChange={(e) => setSelectedRoleToAdd(e.target.value as ProjectRole)}
                    className="rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3 py-2 text-xs text-neutral-300 dark:text-neutral-700 focus:border-neutral-600 focus:outline-none font-bold"
                  >
                    <option value="EDITOR">Write / Editor</option>
                    <option value="VIEWER">Read-Only / Viewer</option>
                    <option value="OWNER">Project Co-Owner</option>
                  </select>

                  <button
                    type="submit"
                    disabled={!selectedUserIdToAdd || savingId === "adding"}
                    className="cursor-pointer rounded-xl bg-white dark:bg-black px-4 py-2 text-xs font-bold text-black dark:text-white hover:bg-neutral-200 transition disabled:opacity-50"
                  >
                    Add to Project
                  </button>
                </div>
              </form>
            )}

            {/* Assigned Project Members Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-3">
                Assigned Project Members ({projectData?.members?.length || 0})
              </h3>

              <div className="divide-y divide-neutral-900 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white/40">
                {projectData?.members?.map((pm: any) => {
                  const roleMeta = PROJECT_ROLE_META[pm.role as ProjectRole] || PROJECT_ROLE_META.EDITOR;
                  const Icon = roleMeta.icon;
                  const isMe = pm.userId === currentUserId;

                  return (
                    <div
                      key={pm.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 border border-neutral-800 text-xs font-extrabold text-white dark:text-black">
                          {(pm.user.name || pm.user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white dark:text-black">
                              {pm.user.name || "Teammate"}
                            </span>
                            {isMe && (
                              <span className="rounded bg-neutral-900 dark:bg-neutral-100 border border-neutral-800 px-1.5 py-0.2 text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-600">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-500 font-mono">
                            {pm.user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <select
                            value={pm.role}
                            disabled={savingId === pm.userId}
                            onChange={(e) => handleRoleChange(pm.userId, e.target.value as ProjectRole)}
                            className="rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-2.5 py-1.5 text-xs font-bold text-neutral-300 dark:text-neutral-700 focus:border-neutral-600 focus:outline-none"
                          >
                            <option value="OWNER">👑 Project Co-Owner</option>
                            <option value="EDITOR">✏️ Write / Editor</option>
                            <option value="VIEWER">👁️ Read-Only / Viewer</option>
                          </select>
                        ) : (
                          <div
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${roleMeta.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{roleMeta.label}</span>
                          </div>
                        )}

                        {isOwner && (
                          <button
                            onClick={() => handleRemoveMember(pm.id)}
                            disabled={savingId === pm.id}
                            title="Remove from project"
                            className="cursor-pointer rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 p-2 text-neutral-400 hover:border-rose-900 hover:bg-rose-950/30 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone for Project Owners */}
            {isOwner && (
              <div className="rounded-xl border border-rose-950/50 bg-rose-950/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-300">Danger Zone</h4>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-600">
                      Permanently delete this project, all its issues, and activity logs.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteProject}
                    className="cursor-pointer rounded-xl border border-rose-900/60 bg-rose-950/60 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 hover:text-white dark:text-black transition"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
