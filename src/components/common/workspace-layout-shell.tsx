"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BackgroundVideo } from "./background-video";

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const isFullBleed = /\/whiteboards\/[^/]+$/.test(pathname);

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

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      if (media.matches) setIsMobileNavOpen(false);
    };
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
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
      {isMobileNavOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}
      <Sidebar
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapsed}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        projects={projects}
        workspaces={workspaces}
        workspaceChannels={workspaceChannels}
        projectChannelGroups={projectChannelGroups}
      />
      <div className="flex flex-1 flex-col overflow-hidden bg-black">
        <Header
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="relative flex-1 overflow-hidden bg-black text-white">
          <BackgroundVideo src="/tech-bg-2.mp4" overlayClassName="bg-black/60" />
          <div
            className={
              isFullBleed
                ? "relative z-10 h-full overflow-hidden"
                : "relative z-10 h-full overflow-y-auto p-6"
            }
            data-lenis-prevent
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
