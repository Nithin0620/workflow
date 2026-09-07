"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface WorkspaceLayoutShellProps {
  children: React.ReactNode;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  projects: Array<{ id: string; name: string; key: string; color?: string | null }>;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    organization: { name: string; slug: string };
  }>;
  workspaceChannels?: Array<{
    id: string;
    name: string;
    topic?: string | null;
    type: "TEXT" | "ANNOUNCEMENT";
    unreadCount?: number;
  }>;
  projectChannelGroups?: Array<{
    project: {
      id: string;
      name: string;
      key: string;
      color?: string | null;
    };
    channels: Array<{
      id: string;
      name: string;
      topic?: string | null;
      type: "TEXT" | "ANNOUNCEMENT";
      unreadCount?: number;
    }>;
  }>;
}

export function WorkspaceLayoutShell({
  children,
  orgSlug,
  workspaceSlug,
  workspaceId,
  projects,
  workspaces,
  workspaceChannels = [],
  projectChannelGroups = [],
}: WorkspaceLayoutShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("workflow_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("workflow_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="flex h-full w-full bg-black dark:bg-white text-white dark:text-black selection:bg-white dark:selection:bg-black selection:text-black dark:selection:text-white">
      <Sidebar
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapsed}
        projects={projects}
        workspaces={workspaces}
        workspaceChannels={workspaceChannels}
        projectChannelGroups={projectChannelGroups}
      />
      <div className="flex flex-1 flex-col overflow-hidden bg-black dark:bg-white">
        <Header
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
        />
        <main
          className="flex-1 overflow-y-auto p-6 bg-black dark:bg-white text-white"
          data-lenis-prevent
        >
          {children}
        </main>
      </div>
    </div>
  );
}
