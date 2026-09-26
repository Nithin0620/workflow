import { FileTreeItem } from "./client";
import {
  CodeNode,
  CodeLink,
  CodeLayer,
  CodebaseGraphData,
  LinkedIssueSummary,
} from "@/types/code-graph";
import { extractRawImports, resolveImportPath } from "./dependency-parser";

export const LAYER_COLORS: Record<CodeLayer, string> = {
  ui: "#38bdf8", // Sky blue
  actions: "#a855f7", // Purple
  api: "#10b981", // Emerald
  db: "#f59e0b", // Amber
  hooks: "#ec4899", // Pink
  types: "#6366f1", // Indigo
  tests: "#14b8a6", // Teal
  docs: "#64748b", // Slate
  config: "#eab308", // Yellow
  other: "#94a3b8", // Gray
};

/**
 * Classifies a file path into an architectural layer.
 */
export function classifyLayer(path: string): CodeLayer {
  const lower = path.toLowerCase();

  if (
    lower.startsWith("tests/") ||
    lower.includes("/tests/") ||
    lower.includes("__tests__") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".spec.tsx")
  ) {
    return "tests";
  }

  if (
    lower.startsWith("docs/") ||
    lower.endsWith(".md") ||
    lower.endsWith(".mdx") ||
    lower === "license"
  ) {
    return "docs";
  }

  if (
    lower.includes("prisma/") ||
    lower.includes("/db/") ||
    lower.endsWith("schema.prisma")
  ) {
    return "db";
  }

  if (
    lower.includes("/actions/") ||
    lower.startsWith("actions/") ||
    lower.endsWith(".action.ts")
  ) {
    return "actions";
  }

  if (
    lower.includes("/api/") ||
    lower.startsWith("api/") ||
    lower.endsWith("/route.ts") ||
    lower.endsWith("/route.js")
  ) {
    return "api";
  }

  if (lower.includes("/hooks/") || lower.startsWith("hooks/")) {
    return "hooks";
  }

  if (
    lower.includes("/types/") ||
    lower.startsWith("types/") ||
    lower.endsWith(".d.ts")
  ) {
    return "types";
  }

  if (
    lower.includes("/components/") ||
    lower.startsWith("components/") ||
    lower.endsWith("/page.tsx") ||
    lower.endsWith("/page.jsx") ||
    lower.endsWith("/layout.tsx") ||
    lower.endsWith("/layout.jsx") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".vue") ||
    lower.endsWith(".svelte") ||
    lower.endsWith(".css")
  ) {
    return "ui";
  }

  if (
    lower.endsWith(".json") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".toml") ||
    lower.endsWith("config.ts") ||
    lower.endsWith("config.js") ||
    lower.endsWith("config.mjs") ||
    lower.startsWith(".env")
  ) {
    return "config";
  }

  return "other";
}

/**
 * Builds a complete Codebase Knowledge Graph from a GitHub file tree and optional file contents.
 */
export function buildCodebaseGraph(
  tree: FileTreeItem[],
  fileContents?: Map<string, string>,
  issues?: LinkedIssueSummary[]
): CodebaseGraphData {
  const nodesMap = new Map<string, CodeNode>();
  const links: CodeLink[] = [];
  const existingFilePaths = new Set<string>();

  // Filter out noisy/hidden files (.git, .husky, lockfiles, minified files)
  const filteredTree = tree.filter((item) => {
    const p = item.path;
    if (p.startsWith(".git/") || p.startsWith(".next/") || p.startsWith("node_modules/")) {
      return false;
    }
    if (p.endsWith(".lock") || p.endsWith("-lock.json") || p.endsWith(".tsbuildinfo")) {
      return false;
    }
    return true;
  });

  // Track all valid files
  for (const item of filteredTree) {
    if (item.type === "blob") {
      existingFilePaths.add(item.path);
    }
  }

  // 1. Create file & directory nodes
  for (const item of filteredTree) {
    const isBlob = item.type === "blob";
    const filename = item.path.split("/").pop() || item.path;
    const extMatch = filename.match(/\.[0-9a-z]+$/i);
    const extension = extMatch ? extMatch[0] : undefined;
    const layer = isBlob ? classifyLayer(item.path) : "other";

    // Parent path: "" for top-level root items, otherwise folder prefix
    const parentPath = item.path.includes("/")
      ? item.path.substring(0, item.path.lastIndexOf("/"))
      : "";

    const node: CodeNode = {
      id: item.path,
      name: filename,
      path: item.path,
      parentPath,
      type: isBlob
        ? layer === "ui"
          ? "component"
          : layer === "api"
          ? "api"
          : layer === "db"
          ? "db"
          : "file"
        : "directory",
      layer,
      extension,
      size: item.size || 0,
      val: isBlob ? 5 : 8,
      color: isBlob ? LAYER_COLORS[layer] : "#6366f1",
      inDegree: 0,
      outDegree: 0,
      issueCount: 0,
      issues: [],
      imports: [],
      importedBy: [],
      childFileCount: 0,
      childDirCount: 0,
      totalDescendantFiles: 0,
      isExpandable: !isBlob,
    };

    nodesMap.set(item.path, node);
  }

  // Calculate child counts & descendant counts for each directory
  for (const node of nodesMap.values()) {
    if (node.parentPath !== undefined) {
      const parentNode = nodesMap.get(node.parentPath);
      if (parentNode) {
        if (node.type === "directory") {
          parentNode.childDirCount = (parentNode.childDirCount || 0) + 1;
        } else {
          parentNode.childFileCount = (parentNode.childFileCount || 0) + 1;
        }
      }
    }

    // Count descendants for directory nodes
    if (node.type !== "directory") {
      let currentParent = node.parentPath;
      while (currentParent) {
        const pNode = nodesMap.get(currentParent);
        if (pNode) {
          pNode.totalDescendantFiles = (pNode.totalDescendantFiles || 0) + 1;
          currentParent = pNode.parentPath;
        } else {
          break;
        }
      }
    }
  }

  // 2. Extract and resolve import dependencies if file contents are available
  const linkSet = new Set<string>();

  if (fileContents) {
    for (const [filePath, content] of fileContents.entries()) {
      const sourceNode = nodesMap.get(filePath);
      if (!sourceNode) continue;

      const ext = sourceNode.extension || "";
      const rawImports = extractRawImports(content, ext);

      for (const rawImport of rawImports) {
        const resolvedPath = resolveImportPath(filePath, rawImport, existingFilePaths);
        if (resolvedPath && resolvedPath !== filePath && nodesMap.has(resolvedPath)) {
          const linkKey = `${filePath}->${resolvedPath}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);

            links.push({
              source: filePath,
              target: resolvedPath,
              type: "import",
            });

            sourceNode.outDegree = (sourceNode.outDegree || 0) + 1;
            sourceNode.imports?.push(resolvedPath);

            const targetNode = nodesMap.get(resolvedPath);
            if (targetNode) {
              targetNode.inDegree = (targetNode.inDegree || 0) + 1;
              targetNode.importedBy?.push(filePath);
            }
          }
        }
      }
    }
  }

  // 3. Hierarchy links
  for (const item of filteredTree) {
    if (item.path.includes("/")) {
      const parentDir = item.path.substring(0, item.path.lastIndexOf("/"));
      if (nodesMap.has(parentDir)) {
        const hierKey = `hier:${parentDir}->${item.path}`;
        if (!linkSet.has(hierKey)) {
          linkSet.add(hierKey);
          links.push({
            source: parentDir,
            target: item.path,
            type: "hierarchy",
          });
        }
      }
    }
  }

  // 4. Cross-reference issues
  if (issues && issues.length > 0) {
    for (const issue of issues) {
      const lowerKey = issue.key.toLowerCase();
      for (const node of nodesMap.values()) {
        if (
          node.path.toLowerCase().includes(lowerKey) ||
          node.name.toLowerCase().includes(lowerKey)
        ) {
          node.issues = node.issues || [];
          node.issues.push(issue);
          node.issueCount = (node.issueCount || 0) + 1;
          node.val += 2;
        }
      }
    }
  }

  const nodes = Array.from(nodesMap.values());

  // 5. Aggregate stats
  const layerBreakdown: Record<CodeLayer, number> = {
    ui: 0,
    actions: 0,
    api: 0,
    db: 0,
    hooks: 0,
    types: 0,
    tests: 0,
    docs: 0,
    config: 0,
    other: 0,
  };

  let totalFiles = 0;
  let totalDirectories = 0;

  for (const node of nodes) {
    if (node.type === "directory") {
      totalDirectories++;
    } else {
      totalFiles++;
      layerBreakdown[node.layer] = (layerBreakdown[node.layer] || 0) + 1;
    }
  }

  return {
    nodes,
    links,
    stats: {
      totalFiles,
      totalDirectories,
      totalDependencies: links.filter((l) => l.type === "import").length,
      layerBreakdown,
    },
  };
}

/**
 * Extracts a clean, focused sub-graph containing only the direct children of the target directory.
 * When directoryPath is "" (Root), it only shows root directories & root files.
 */
export function getSubgraphAtDirectory(
  fullGraph: CodebaseGraphData,
  directoryPath: string
): CodebaseGraphData {
  const normTarget = directoryPath.trim().replace(/^\/+|\/+$/g, "");

  // Direct children matching parentPath
  const visibleNodes = fullGraph.nodes.filter((n) => {
    const parent = (n.parentPath || "").trim().replace(/^\/+|\/+$/g, "");
    return parent === normTarget;
  });

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  // Map links between visible direct children or aggregated between modules
  const visibleLinks: CodeLink[] = [];
  const linkKeySet = new Set<string>();

  for (const link of fullGraph.links) {
    const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
    const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;

    // Direct link between visible items
    if (visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId) && srcId !== tgtId) {
      const key = `${srcId}->${tgtId}`;
      if (!linkKeySet.has(key)) {
        linkKeySet.add(key);
        visibleLinks.push({
          source: srcId,
          target: tgtId,
          type: link.type,
        });
      }
    } else if (link.type === "import") {
      // Find which visible directory owns srcId and tgtId
      let visibleSrc: string | null = null;
      let visibleTgt: string | null = null;

      for (const node of visibleNodes) {
        if (srcId === node.id || srcId.startsWith(`${node.path}/`)) {
          visibleSrc = node.id;
        }
        if (tgtId === node.id || tgtId.startsWith(`${node.path}/`)) {
          visibleTgt = node.id;
        }
      }

      if (visibleSrc && visibleTgt && visibleSrc !== visibleTgt) {
        const key = `macro:${visibleSrc}->${visibleTgt}`;
        if (!linkKeySet.has(key)) {
          linkKeySet.add(key);
          visibleLinks.push({
            source: visibleSrc,
            target: visibleTgt,
            type: "import",
            label: "Dependency",
          });
        }
      }
    }
  }

  // Aggregate layer breakdown for this directory view
  const layerBreakdown: Record<CodeLayer, number> = {
    ui: 0,
    actions: 0,
    api: 0,
    db: 0,
    hooks: 0,
    types: 0,
    tests: 0,
    docs: 0,
    config: 0,
    other: 0,
  };

  let totalFiles = 0;
  let totalDirectories = 0;

  for (const node of visibleNodes) {
    if (node.type === "directory") {
      totalDirectories++;
    } else {
      totalFiles++;
      layerBreakdown[node.layer] = (layerBreakdown[node.layer] || 0) + 1;
    }
  }

  return {
    nodes: visibleNodes,
    links: visibleLinks,
    stats: {
      totalFiles,
      totalDirectories,
      totalDependencies: visibleLinks.length,
      layerBreakdown,
    },
  };
}
