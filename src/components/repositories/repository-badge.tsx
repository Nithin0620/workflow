"use client";

import { useState } from "react";
import { GitBranch, Bot, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { RepositorySettingsDialog } from "./repository-settings-dialog";
import { ProjectRepoDetails } from "@/actions/repositories";

interface RepositoryBadgeProps {
  projectId: string;
  projectName: string;
  projectKey: string;
  repository?: ProjectRepoDetails | null;
  canManage?: boolean;
}

export function RepositoryBadge({
  projectId,
  projectName,
  projectKey,
  repository,
  canManage = true,
}: RepositoryBadgeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        title={
          repository
            ? `Linked to ${repository.repoOwner}/${repository.repoName} (${repository.defaultBranch}) • Click to configure`
            : "Connect GitHub repository for AI codebase fixes"
        }
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition backdrop-blur-sm shadow-sm ${
          repository
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/20"
            : "border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white"
        }`}
      >
        <Bot className={`h-3.5 w-3.5 ${repository ? "text-emerald-400" : "text-neutral-400"}`} />
        <span className="hidden sm:inline">
          {repository ? `${repository.repoName}` : "AI Repo"}
        </span>
        {repository && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400/80">
            <GitBranch className="h-3 w-3" />
            {repository.defaultBranch}
          </span>
        )}
      </button>

      <RepositorySettingsDialog
        projectId={projectId}
        projectName={projectName}
        projectKey={projectKey}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        canManage={canManage}
      />
    </>
  );
}
