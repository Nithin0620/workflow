export type CodeLayer =
  | "ui"
  | "actions"
  | "api"
  | "db"
  | "hooks"
  | "config"
  | "types"
  | "tests"
  | "docs"
  | "other";

export type CodeNodeType = "file" | "directory" | "issue" | "api" | "component" | "db";

export type CodeLinkType = "import" | "hierarchy" | "issue_touch";

export interface LinkedIssueSummary {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
}

export interface CodeNode {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  type: CodeNodeType;
  layer: CodeLayer;
  extension?: string;
  size?: number;
  val: number; // Node size/weight in force graph
  color?: string;
  inDegree?: number;
  outDegree?: number;
  issueCount?: number;
  issues?: LinkedIssueSummary[];
  imports?: string[];
  importedBy?: string[];
  childFileCount?: number;
  childDirCount?: number;
  totalDescendantFiles?: number;
  isExpandable?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface CodeLink {
  source: string | CodeNode;
  target: string | CodeNode;
  type: CodeLinkType;
  label?: string;
}

export interface CodebaseGraphStats {
  totalFiles: number;
  totalDirectories: number;
  totalDependencies: number;
  layerBreakdown: Record<CodeLayer, number>;
}

export interface CodebaseGraphData {
  nodes: CodeNode[];
  links: CodeLink[];
  stats: CodebaseGraphStats;
}

export interface GraphFilterState {
  search: string;
  selectedLayers: CodeLayer[];
  hideDirectories: boolean;
  minConnections: number;
  showIssuesOnly: boolean;
}
