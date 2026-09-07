"use client";

import { useState } from "react";
import { updateProfileName, changeUserPassword } from "@/actions/profile";
import { User, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

interface UserProfileSettingsProps {
  currentUser: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export function UserProfileSettings({ currentUser }: UserProfileSettingsProps) {
  const [name, setName] = useState(currentUser.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSavingName(true);
    setNameMessage(null);

    try {
      const res = await updateProfileName(name.trim());
      if (res.error) {
        setNameMessage({ type: "error", text: res.error });
      } else {
        setNameMessage({ type: "success", text: "Profile updated successfully." });
      }
    } catch {
      setNameMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await changeUserPassword({ currentPassword, newPassword });
      if (res.error) {
        setPasswordMessage({ type: "error", text: res.error });
      } else {
        setPasswordMessage({ type: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Failed to update password." });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Details */}
      <div className="rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-neutral-400 dark:text-neutral-600" />
          <h2 className="text-sm font-bold text-white dark:text-black">Your Profile</h2>
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
          Manage your personal account name and credentials.
        </p>

        {nameMessage && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs ${
              nameMessage.type === "error"
                ? "bg-rose-950/60 border border-rose-900 text-rose-300"
                : "bg-emerald-950/60 border border-emerald-900 text-emerald-300"
            }`}
          >
            {nameMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateName} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider font-mono mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider font-mono mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email || ""}
                className="w-full rounded-xl border border-neutral-900 dark:border-neutral-100 bg-neutral-900/50 dark:bg-neutral-100/50 px-3.5 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingName || name === currentUser.name || !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-black px-4 py-2 text-xs font-bold text-black dark:text-white hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Management */}
      <div className="rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-neutral-400 dark:text-neutral-600" />
          <h2 className="text-sm font-bold text-white dark:text-black">Security & Password</h2>
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
          Update your login password to keep your workspace safe.
        </p>

        {passwordMessage && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs ${
              passwordMessage.type === "error"
                ? "bg-rose-950/60 border border-rose-900 text-rose-300"
                : "bg-emerald-950/60 border border-emerald-900 text-emerald-300"
            }`}
          >
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider font-mono mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider font-mono mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword}
              className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-black px-4 py-2 text-xs font-bold text-black dark:text-white hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
