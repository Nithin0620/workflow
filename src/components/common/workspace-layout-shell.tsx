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
}

export function WorkspaceLayoutShell({
  children,
  orgSlug,
  workspaceSlug,
  workspaceId,
  projects,
  workspaces,
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
    <div className="flex h-full w-full bg-black text-white selection:bg-white selection:text-black">
      <Sidebar
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapsed}
        projects={projects}
        workspaces={workspaces}
      />
      <div className="flex flex-1 flex-col overflow-hidden bg-black">
        <Header
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
        />
        <main
          className="flex-1 overflow-y-auto p-6 bg-black text-white"
          data-lenis-prevent
        >
          {children}
        </main>
      </div>
    </div>
  );
}
