import { describe, it, expect } from "vitest";
import {
  extractRawImports,
  resolveImportPath,
} from "@/lib/github/dependency-parser";
import {
  classifyLayer,
  buildCodebaseGraph,
  getSubgraphAtDirectory,
  LAYER_COLORS,
} from "@/lib/github/graph-builder";
import { FileTreeItem } from "@/lib/github/client";

describe("Unit Tests: Dependency Parser", () => {
  it("extracts ES import statements from TypeScript files", () => {
    const code = `
      import React, { useState } from "react";
      import { Button } from "@/components/ui/button";
      import { formatTime } from "../utils/time";
      export * from './constants';
      import "./styles.css";
    `;
    const imports = extractRawImports(code, ".tsx");
    expect(imports).toContain("react");
    expect(imports).toContain("@/components/ui/button");
    expect(imports).toContain("../utils/time");
    expect(imports).toContain("./constants");
    expect(imports).toContain("./styles.css");
  });

  it("extracts CommonJS require statements", () => {
    const code = `
      const path = require("path");
      const { helper } = require("./lib/helper");
    `;
    const imports = extractRawImports(code, ".js");
    expect(imports).toContain("path");
    expect(imports).toContain("./lib/helper");
  });

  it("extracts Python imports", () => {
    const code = `
      import os
      from models import User, Project
      from .database import db
    `;
    const imports = extractRawImports(code, ".py");
    expect(imports).toContain("os");
    expect(imports).toContain("models");
    expect(imports).toContain(".database");
  });

  it("resolves aliased and relative paths correctly", () => {
    const existing = new Set([
      "src/components/ui/button.tsx",
      "src/lib/utils/time.ts",
      "src/lib/constants.ts",
      "src/app/api/auth/route.ts",
    ]);

    // Test alias resolution
    const res1 = resolveImportPath(
      "src/app/page.tsx",
      "@/components/ui/button",
      existing
    );
    expect(res1).toBe("src/components/ui/button.tsx");

    // Test relative resolution
    const res2 = resolveImportPath(
      "src/lib/helper.ts",
      "./utils/time",
      existing
    );
    expect(res2).toBe("src/lib/utils/time.ts");

    // Test non-local node_modules (should return null)
    const res3 = resolveImportPath("src/app/page.tsx", "react", existing);
    expect(res3).toBeNull();
  });
});

describe("Unit Tests: Graph Builder & Layer Classification", () => {
  it("classifies file layers appropriately", () => {
    expect(classifyLayer("src/components/button.tsx")).toBe("ui");
    expect(classifyLayer("src/app/dashboard/page.tsx")).toBe("ui");
    expect(classifyLayer("src/actions/projects.ts")).toBe("actions");
    expect(classifyLayer("src/app/api/webhooks/route.ts")).toBe("api");
    expect(classifyLayer("prisma/schema.prisma")).toBe("db");
    expect(classifyLayer("src/hooks/use-realtime.ts")).toBe("hooks");
    expect(classifyLayer("src/types/index.ts")).toBe("types");
    expect(classifyLayer("tests/unit/app.test.ts")).toBe("tests");
    expect(classifyLayer("README.md")).toBe("docs");
    expect(classifyLayer("package.json")).toBe("config");
    expect(classifyLayer("next.config.ts")).toBe("config");
  });

  it("builds a complete knowledge graph from file tree and content map", () => {
    const tree: FileTreeItem[] = [
      { path: "src", mode: "040000", type: "tree", sha: "1" },
      { path: "src/app", mode: "040000", type: "tree", sha: "2" },
      { path: "src/app/page.tsx", mode: "100644", type: "blob", size: 1024, sha: "3" },
      { path: "src/components", mode: "040000", type: "tree", sha: "4" },
      { path: "src/components/button.tsx", mode: "100644", type: "blob", size: 512, sha: "5" },
      { path: "src/actions", mode: "040000", type: "tree", sha: "6" },
      { path: "src/actions/auth.ts", mode: "100644", type: "blob", size: 2048, sha: "7" },
    ];

    const contents = new Map<string, string>();
    contents.set(
      "src/app/page.tsx",
      `import { Button } from "@/components/button";\nimport { login } from "../actions/auth";`
    );

    const graph = buildCodebaseGraph(tree, contents);

    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.stats.totalFiles).toBe(3);
    expect(graph.stats.totalDirectories).toBe(4);

    // Verify import edges
    const importEdges = graph.links.filter((l) => l.type === "import");
    expect(importEdges.length).toBe(2);
    expect(importEdges).toContainEqual({
      source: "src/app/page.tsx",
      target: "src/components/button.tsx",
      type: "import",
    });
    expect(importEdges).toContainEqual({
      source: "src/app/page.tsx",
      target: "src/actions/auth.ts",
      type: "import",
    });

    // Check node degrees
    const pageNode = graph.nodes.find((n) => n.id === "src/app/page.tsx");
    expect(pageNode?.outDegree).toBe(2);

    const btnNode = graph.nodes.find((n) => n.id === "src/components/button.tsx");
    expect(btnNode?.inDegree).toBe(1);

    // Test getSubgraphAtDirectory at Root level (should only show top-level "src")
    const rootSubgraph = getSubgraphAtDirectory(graph, "");
    expect(rootSubgraph.nodes.length).toBe(1);
    expect(rootSubgraph.nodes[0].id).toBe("src");

    // Test getSubgraphAtDirectory at "src" level (should show "src/app", "src/components", "src/actions")
    const srcSubgraph = getSubgraphAtDirectory(graph, "src");
    expect(srcSubgraph.nodes.length).toBe(3);
    expect(srcSubgraph.nodes.map((n) => n.id)).toContain("src/app");
    expect(srcSubgraph.nodes.map((n) => n.id)).toContain("src/components");
    expect(srcSubgraph.nodes.map((n) => n.id)).toContain("src/actions");

    // Test getSubgraphAtDirectory at "src/components" level (should show "src/components/button.tsx")
    const compSubgraph = getSubgraphAtDirectory(graph, "src/components");
    expect(compSubgraph.nodes.length).toBe(1);
    expect(compSubgraph.nodes[0].id).toBe("src/components/button.tsx");
  });
});
