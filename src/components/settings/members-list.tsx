"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { updateMemberRole, removeMember } from "@/actions/members";
import { InviteMemberDialog } from "./invite-member-dialog";
import { formatDate } from "@/lib/utils";
import { UserPlus, Trash2, Shield, UserCheck, Eye, Crown, Loader2, AlertCircle } from "lucide-react";

export interface MemberItem {
  id: string;
  role: UserRole;
  joinedAt: Date | string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface MembersListProps {
  workspaceId: string;
  currentUserRole: UserRole;
  currentUserId: string;
  initialMembers: MemberItem[];
}

const ROLE_BADGES: Record<UserRole, { label: string; icon: any; color: string }> = {
  OWNER: {
    label: "Owner",
    icon: Crown,
    color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
  MEMBER: {
    label: "Member",
    icon: UserCheck,
    color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  VIEWER: {
    label: "Viewer",
    icon: Eye,
    color: "border-neutral-500/30 bg-neutral-500/10 text-neutral-400",
  },
};

export function MembersList({
  workspaceId,
  currentUserRole,
  currentUserId,
  initialMembers,
}: MembersListProps) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setErrorMessage(null);
    setUpdatingId(memberId);

    try {
      const res = await updateMemberRole(workspaceId, memberId, newRole);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.member) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      }
    } catch {
      setErrorMessage("Failed to update member role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveMember = async (member: MemberItem) => {
    const name = member.user.name || member.user.email || "this user";
    if (!window.confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
      return;
    }

    setErrorMessage(null);
    setUpdatingId(member.id);

    try {
      const res = await removeMember(workspaceId, member.id);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      }
    } catch {
      setErrorMessage("Failed to remove member.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <h2 className="text-sm font-bold text-white">
            Team Members ({members.length})
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Teammates with access to this workspace and all associated projects.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black shadow-lg transition hover:bg-neutral-200"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="mt-4 divide-y divide-neutral-900">
        {members.map((m) => {
          const isMe = m.userId === currentUserId;
          const Badge = ROLE_BADGES[m.role] || ROLE_BADGES.MEMBER;
          const Icon = Badge.icon;
          const isLastOwner = m.role === "OWNER" && members.filter((x) => x.role === "OWNER").length <= 1;
          const canEditThisMember =
            canManage &&
            (currentUserRole === "OWNER" || (m.role !== "OWNER" && m.role !== "ADMIN"));

          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5"
            >
              {/* Member Details */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-extrabold text-white">
                  {(m.user.name || m.user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {m.user.name || "Teammate"}
                    </span>
                    {isMe && (
                      <span className="rounded-md bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 text-[9px] font-mono font-bold text-neutral-400">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    {m.user.email}
                  </div>
                </div>
              </div>

              {/* Role & Actions */}
              <div className="flex items-center gap-3">
                {canEditThisMember && !isLastOwner ? (
                  <select
                    value={m.role}
                    disabled={updatingId === m.id}
                    onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-neutral-300 focus:border-neutral-600 focus:outline-none"
                  >
                    {currentUserRole === "OWNER" && <option value="OWNER">Owner</option>}
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <div
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${Badge.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{Badge.label}</span>
                  </div>
                )}

                {canManage && !isMe && !isLastOwner && (
                  <button
                    onClick={() => handleRemoveMember(m)}
                    disabled={updatingId === m.id}
                    title="Remove member"
                    className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:border-rose-900 hover:bg-rose-950/30 hover:text-rose-400 transition"
                  >
                    {updatingId === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      <InviteMemberDialog
        workspaceId={workspaceId}
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onMemberInvited={() => {
          // Trigger reload or state will be updated via page server action revalidation
          window.location.reload();
        }}
      />
    </div>
  );
}
