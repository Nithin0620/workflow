"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { inviteOrAddMember } from "@/actions/members";
import { X, Mail, Shield, UserCheck, Eye, Loader2, UserPlus } from "lucide-react";

interface InviteMemberDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberInvited?: () => void;
}

const ROLES: { role: "ADMIN" | "MEMBER" | "VIEWER"; label: string; description: string; icon: any }[] = [
  {
    role: "MEMBER",
    label: "Member",
    description: "Can create, update, comment, and move issues across all projects.",
    icon: UserCheck,
  },
  {
    role: "ADMIN",
    label: "Admin",
    description: "Full access to manage workspace settings, invite members, and configure projects.",
    icon: Shield,
  },
  {
    role: "VIEWER",
    label: "Viewer",
    description: "Read-only access to view boards, issues, comments, and analytics.",
    icon: Eye,
  },
];

export function InviteMemberDialog({
  workspaceId,
  isOpen,
  onClose,
  onMemberInvited,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await inviteOrAddMember(workspaceId, {
        email: email.trim(),
        role,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Successfully added ${email.trim()} as a ${role}.`);
        setEmail("");
        onMemberInvited?.();
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1200);
      }
    } catch {
      setError("An unexpected error occurred while adding the member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Invite Team Member</h2>
              <p className="text-xs text-neutral-400">Add a teammate to collaborate in this workspace.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Teammate Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-neutral-800 bg-black py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-2">
              Select Role
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => setRole(r.role)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-white bg-neutral-900 shadow-md"
                        : "border-neutral-800 bg-black/40 hover:border-neutral-700 hover:bg-neutral-900/40"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                        isSelected ? "bg-white text-black" : "bg-neutral-900 text-neutral-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{r.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400">Selected</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-400 leading-relaxed">{r.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-lg hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Inviting...</span>
                </>
              ) : (
                <span>Send Invite</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
