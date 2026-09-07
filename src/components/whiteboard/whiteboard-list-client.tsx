"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { CreateWhiteboardDialog } from "./create-whiteboard-dialog";

interface WhiteboardListClientProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
  projects: Array<{ id: string; name: string; key: string; color?: string | null }>;
}

export function WhiteboardListClient({
  workspaceId,
  orgSlug,
  workspaceSlug,
  projects,
}: WhiteboardListClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        New Whiteboard
      </button>

      <CreateWhiteboardDialog
        workspaceId={workspaceId}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        projects={projects}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
