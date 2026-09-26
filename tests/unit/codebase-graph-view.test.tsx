import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GraphControls } from "@/components/code-graph/graph-controls";
import { GraphSearchBar } from "@/components/code-graph/graph-search-bar";
import { GraphNodeInspector } from "@/components/code-graph/graph-node-inspector";
import { CodeNode, GraphFilterState } from "@/types/code-graph";

describe("Unit Tests: Graph UI Components", () => {
  describe("GraphSearchBar", () => {
    it("renders search query and match counter", () => {
      const onSearchChange = vi.fn();
      render(
        <GraphSearchBar
          searchQuery="auth"
          onSearchChange={onSearchChange}
          matchCount={5}
          totalNodes={50}
        />
      );

      expect(screen.getByPlaceholderText(/Search files/i)).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText(/50/i)).toBeInTheDocument();

      const input = screen.getByPlaceholderText(/Search files/i);
      fireEvent.change(input, { target: { value: "components" } });
      expect(onSearchChange).toHaveBeenCalledWith("components");
    });
  });

  describe("GraphControls", () => {
    it("renders layer chips and handles toggling", () => {
      const onFilterChange = vi.fn();
      const onZoomIn = vi.fn();
      const onZoomOut = vi.fn();
      const onResetView = vi.fn();

      const filter: GraphFilterState = {
        search: "",
        selectedLayers: ["ui", "actions"],
        hideDirectories: false,
        minConnections: 0,
        showIssuesOnly: false,
      };

      const layerCounts = {
        ui: 10,
        actions: 4,
        api: 2,
        db: 1,
        hooks: 3,
        types: 5,
        tests: 12,
        config: 2,
        docs: 1,
        other: 0,
      };

      render(
        <GraphControls
          filter={filter}
          onFilterChange={onFilterChange}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetView={onResetView}
          layerCounts={layerCounts}
        />
      );

      expect(screen.getByText("UI & Components")).toBeInTheDocument();
      expect(screen.getByText("Server Actions")).toBeInTheDocument();

      // Click "Show Folders" toggle
      const folderBtn = screen.getByTitle(/Toggle directory folder nodes/i);
      fireEvent.click(folderBtn);
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ hideDirectories: true })
      );

      // Click Zoom In
      const zoomInBtn = screen.getByTitle("Zoom In");
      fireEvent.click(zoomInBtn);
      expect(onZoomIn).toHaveBeenCalled();
    });
  });

  describe("GraphNodeInspector", () => {
    it("renders node metadata, imports, and linked issues", () => {
      const mockNode: CodeNode = {
        id: "src/app/api/auth/route.ts",
        name: "route.ts",
        path: "src/app/api/auth/route.ts",
        type: "api",
        layer: "api",
        extension: ".ts",
        size: 1540,
        val: 8,
        inDegree: 2,
        outDegree: 3,
        imports: ["src/lib/auth/session.ts", "src/lib/db/prisma.ts"],
        importedBy: ["src/components/auth/login-form.tsx"],
        issues: [
          {
            id: "iss_1",
            key: "AUTH-12",
            title: "Fix session cookie expiry",
            status: "IN_PROGRESS",
            priority: "HIGH",
          },
        ],
      };

      const onClose = vi.fn();
      const onSelectNode = vi.fn();

      render(
        <GraphNodeInspector
          node={mockNode}
          repoUrl="https://github.com/myorg/myrepo"
          defaultBranch="main"
          onClose={onClose}
          onSelectNode={onSelectNode}
        />
      );

      expect(screen.getByText("route.ts")).toBeInTheDocument();
      expect(screen.getByText("src/app/api/auth/route.ts")).toBeInTheDocument();
      expect(screen.getByText("AUTH-12")).toBeInTheDocument();
      expect(screen.getByText("Fix session cookie expiry")).toBeInTheDocument();

      // Click imported node link
      const importItem = screen.getByText("session.ts");
      fireEvent.click(importItem);
      expect(onSelectNode).toHaveBeenCalledWith("src/lib/auth/session.ts");

      // Verify View on GitHub link
      const ghLink = screen.getByText("View on GitHub").closest("a");
      expect(ghLink).toHaveAttribute(
        "href",
        "https://github.com/myorg/myrepo/blob/main/src/app/api/auth/route.ts"
      );
    });
  });
});
