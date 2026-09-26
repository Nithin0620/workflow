/**
 * Dependency parser for extracting intra-codebase relationships from code contents.
 */

// Regex patterns to capture import/require/export-from statements
const TS_JS_IMPORT_REGEX =
  /(?:import\s+(?:[\w*\s{},$]+\s+from\s+)?|export\s+(?:[\w*\s{},$]+\s+from\s+)|require\s*\(\s*)['"]([^'"]+)['"]/g;

const PYTHON_IMPORT_REGEX = /(?:from\s+([.\w]+)\s+import|import\s+([.\w]+))/g;

/**
 * Extracts raw module specifiers imported or required by a file.
 */
export function extractRawImports(content: string, extension = ""): string[] {
  if (!content || typeof content !== "string") return [];

  const ext = extension.toLowerCase();
  const rawImports: string[] = [];
  const seen = new Set<string>();

  if (
    ext === ".ts" ||
    ext === ".tsx" ||
    ext === ".js" ||
    ext === ".jsx" ||
    ext === ".mjs" ||
    ext === ".cjs" ||
    ext === ".vue" ||
    ext === ".svelte"
  ) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(TS_JS_IMPORT_REGEX);
    while ((match = regex.exec(content)) !== null) {
      const target = match[1]?.trim();
      if (target && !seen.has(target)) {
        seen.add(target);
        rawImports.push(target);
      }
    }
  } else if (ext === ".py") {
    let match: RegExpExecArray | null;
    const regex = new RegExp(PYTHON_IMPORT_REGEX);
    while ((match = regex.exec(content)) !== null) {
      const target = (match[1] || match[2])?.trim();
      if (target && !seen.has(target)) {
        seen.add(target);
        rawImports.push(target);
      }
    }
  }

  return rawImports;
}

/**
 * Normalizes and resolves a relative or aliased path to an actual file in the repo.
 */
export function resolveImportPath(
  sourceFilePath: string,
  rawImport: string,
  existingFilePaths: Set<string>
): string | null {
  if (!rawImport || typeof rawImport !== "string") return null;

  // Ignore 3rd-party node_modules (e.g. "react", "next/navigation", "lucide-react")
  // Keep relative imports ("./foo", "../bar") and project aliases ("@/...", "~/...")
  const isRelative = rawImport.startsWith("./") || rawImport.startsWith("../");
  const isAliased = rawImport.startsWith("@/") || rawImport.startsWith("~/");

  if (!isRelative && !isAliased) {
    return null;
  }

  let normalized = "";

  if (isAliased) {
    // Handle @/ or ~/ mapping to src/ or root
    const stripped = rawImport.replace(/^[@~]\//, "");
    if (existingFilePaths.has(`src/${stripped}`)) {
      return `src/${stripped}`;
    }
    normalized = `src/${stripped}`;
  } else {
    // Resolve relative path
    const sourceDir = sourceFilePath.includes("/")
      ? sourceFilePath.substring(0, sourceFilePath.lastIndexOf("/"))
      : "";

    const parts = sourceDir ? sourceDir.split("/") : [];
    const segments = rawImport.split("/");

    for (const segment of segments) {
      if (segment === "." || segment === "") continue;
      if (segment === "..") {
        parts.pop();
      } else {
        parts.push(segment);
      }
    }
    normalized = parts.join("/");
  }

  // Check direct match
  if (existingFilePaths.has(normalized)) {
    return normalized;
  }

  // Check with standard extensions
  const candidateExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".d.ts",
    "/index.ts",
    "/index.tsx",
    "/index.js",
    "/index.jsx",
    ".json",
    ".css",
    ".py",
  ];

  for (const ext of candidateExtensions) {
    const candidate = `${normalized}${ext}`;
    if (existingFilePaths.has(candidate)) {
      return candidate;
    }
  }

  return null;
}
