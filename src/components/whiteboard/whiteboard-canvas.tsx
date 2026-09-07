"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  MousePointer,
  Hand,
  Square,
  Circle,
  Diamond,
ArrowRight,
  Minus,
  Palette,
  Pencil,
  Type,
  StickyNote,
  Eraser,
  Undo2,
  Redo2,
  Download,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Sparkles,
  Plus,
  Layers,
  CheckCircle2,
  FolderKanban,
  FileCode,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  WhiteboardDocument,
  CanvasElement,
  WhiteboardTool,
  WhiteboardTheme,
} from "./types";
import { updateWhiteboard } from "@/actions/whiteboards";
import { useWhiteboardRealtime } from "@/hooks/use-whiteboard-realtime";
import { ConvertToIssueDialog } from "./convert-to-issue-dialog";

interface WhiteboardCanvasProps {
  whiteboardId: string;
  currentUserId?: string;
  initialData: unknown;
  title: string;
  canEdit: boolean;
  linkedProjects?: Array<{ id: string; name: string; key: string; color?: string | null }>;
}

type PatternKind = "none" | "dots" | "lines" | "grid-dots";

interface ThemeStyle {
  bg: string;
  pattern: PatternKind;
  patternColor: string;
  patternSize: number;
  text: string;
  cardBg: string;
  border: string;
  accent: string;
  glowA: string;
  glowB: string;
}

const THEME_BASES = [
  {
    key: "black",
    short: "Void",
    bg: "#050507",
    cardBg: "#0c0c10",
    border: "#1f1f26",
    text: "#f4f4f5",
    accent: "#3b82f6",
    glowA: "99, 102, 241",
    glowB: "56, 189, 248",
    dotColor: "rgba(255, 255, 255, 0.10)",
    gridColor: "rgba(255, 255, 255, 0.07)",
  },
  {
    key: "blue",
    short: "Azure",
    bg: "#041019",
    cardBg: "#061b29",
    border: "#123650",
    text: "#e0f2fe",
    accent: "#38bdf8",
    glowA: "56, 189, 248",
    glowB: "59, 130, 246",
    dotColor: "rgba(56, 189, 248, 0.17)",
    gridColor: "rgba(56, 189, 248, 0.15)",
  },
  {
    key: "purple",
    short: "Aurora",
    bg: "#0b0318",
    cardBg: "#140823",
    border: "#2a1a44",
    text: "#f3e8ff",
    accent: "#a855f7",
    glowA: "168, 85, 247",
    glowB: "236, 72, 153",
    dotColor: "rgba(167, 139, 250, 0.18)",
    gridColor: "rgba(167, 139, 250, 0.16)",
  },
  {
    key: "amber",
    short: "Amber",
    bg: "#150f07",
    cardBg: "#1d150b",
    border: "#412f13",
    text: "#fef3c7",
    accent: "#f59e0b",
    glowA: "245, 158, 11",
    glowB: "249, 115, 22",
    dotColor: "rgba(245, 158, 11, 0.20)",
    gridColor: "rgba(245, 158, 11, 0.17)",
  },
  {
    key: "green",
    short: "Emerald",
    bg: "#04130d",
    cardBg: "#0a1d14",
    border: "#14532d",
    text: "#d1fae5",
    accent: "#34d399",
    glowA: "52, 211, 153",
    glowB: "16, 185, 129",
    dotColor: "rgba(52, 211, 153, 0.20)",
    gridColor: "rgba(52, 211, 153, 0.16)",
  },
  {
    key: "rose",
    short: "Rose",
    bg: "#160a0d",
    cardBg: "#1f0f14",
    border: "#4c1d29",
    text: "#ffe4e6",
    accent: "#fb7185",
    glowA: "251, 113, 133",
    glowB: "244, 63, 94",
    dotColor: "rgba(251, 113, 133, 0.20)",
    gridColor: "rgba(251, 113, 133, 0.16)",
  },
  {
    key: "white",
    short: "Paper",
    bg: "#f7f7f5",
    cardBg: "#ffffff",
    border: "#e4e4e7",
    text: "#1c1c1f",
    accent: "#3b82f6",
    glowA: "59, 130, 246",
    glowB: "168, 85, 247",
    dotColor: "rgba(0, 0, 0, 0.13)",
    gridColor: "rgba(0, 0, 0, 0.12)",
  },
];

const THEME_PATTERNS = [
  { suffix: "plain", kind: "none" as const, size: 24, label: "plain" },
  { suffix: "dots", kind: "dots" as const, size: 24, label: "dots" },
  { suffix: "grid", kind: "lines" as const, size: 28, label: "grid" },
];

const THEME_STYLES = Object.fromEntries(
  THEME_BASES.flatMap((b) =>
    THEME_PATTERNS.map((p) => [
      `${b.key}-${p.suffix}`,
      {
        bg: b.bg,
        pattern: p.kind,
        patternColor:
          p.label === "plain" ? "transparent" : p.label === "dots" ? b.dotColor : b.gridColor,
        patternSize: p.size,
        text: b.text,
        cardBg: b.cardBg,
        border: b.border,
        accent: b.accent,
        glowA: b.glowA,
        glowB: b.glowB,
      },
    ])
  )
) as Record<WhiteboardTheme, ThemeStyle>;

const LEGACY_THEMES: Record<string, WhiteboardTheme> = {
  dark: "black-plain",
  light: "white-plain",
  midnight: "blue-grid",
  sepia: "amber-plain",
  void: "black-plain",
  carbon: "black-dots",
  graphite: "black-grid",
  blueprint: "blue-grid",
  aurora: "purple-dots",
  paper: "white-dots",
  azure: "blue-dots",
  coal: "black-grid",
  amber: "amber-dots",
  emerald: "green-dots",
  rose: "rose-dots",
  slate: "white-grid",
};

const THEME_OPTIONS: { key: WhiteboardTheme; label: string }[] = THEME_BASES.flatMap((b) =>
  THEME_PATTERNS.map((p) => ({
    key: `${b.key}-${p.suffix}` as WhiteboardTheme,
    label: `${b.short} — ${p.label}`,
  }))
);

const STROKE_COLORS = [
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#000000",
];

const STICKY_BG_COLORS = [
  "#fef08a", // Soft yellow
  "#bbf7d0", // Soft green
  "#bae6fd", // Soft blue
  "#fed7aa", // Soft orange
  "#fbcfe8", // Soft pink
  "#e9d5ff", // Soft purple
];

const SVG_NS = "http://www.w3.org/2000/svg";
const makeSvgNode = (tag: string) => document.createElementNS(SVG_NS, tag);
const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

const TOOL_GROUPS: Record<"inline" | "more", WhiteboardTool[]> = {
  inline: ["select", "hand", "rectangle", "diamond", "ellipse", "arrow", "line"],
  more: ["draw", "text", "sticky", "eraser"],
};

function Popover({
  trigger,
  children,
  panelClass,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  panelClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const toggle = () => {
    if (open) return setOpen(false);
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: Math.min(r.left, window.innerWidth - 260) });
    setOpen(true);
  };

  return (
    <>
      <div ref={triggerRef} onClick={toggle} className="flex shrink-0">
        {trigger}
      </div>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className={`fixed z-50 rounded-xl border border-white/10 bg-[#0d0d11] p-2 shadow-2xl shadow-black/60 ${panelClass ?? ""}`}
              style={{ top: pos.top, left: pos.left }}
            >
              {typeof children === "function" ? children(() => setOpen(false)) : children}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function ThemeCardPreview({ theme }: { theme: WhiteboardTheme }) {
  const s = THEME_STYLES[theme];
  if (!s) return null;
  const pid = `theme-pattern-${theme}`;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <pattern id={pid} width={16} height={16} patternUnits="userSpaceOnUse">
          {(s.pattern === "lines") && (
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke={s.patternColor} strokeWidth={1} />
          )}
          {s.pattern === "dots" && (
            <circle cx={1} cy={1} r={1.5} fill={s.patternColor} />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={s.bg} />
      {s.pattern !== "none" && <rect width="100%" height="100%" fill={`url(#${pid})`} />}
    </svg>
  );
}

function buildPreviewNode(el: CanvasElement): SVGElement | null {
  switch (el.type) {
    case "rectangle":
      return makeSvgNode("rect");
    case "sticky":
      const rect = makeSvgNode("rect");
      rect.setAttribute("rx", "6");
      return rect;
    case "ellipse":
      return makeSvgNode("ellipse");
    case "diamond":
      return makeSvgNode("polygon");
    case "line":
    case "arrow":
      return makeSvgNode("line");
    case "draw":
      return makeSvgNode("polyline");
    default:
      return null;
  }
}

function applyPreview(el: CanvasElement, node: SVGElement) {
  const x = Math.min(el.x, el.x + el.width);
  const y = Math.min(el.y, el.y + el.height);
  const w = Math.abs(el.width);
  const h = Math.abs(el.height);
  switch (el.type) {
    case "rectangle":
    case "sticky": {
      node.setAttribute("x", String(x));
      node.setAttribute("y", String(y));
      node.setAttribute("width", String(w));
      node.setAttribute("height", String(h));
      node.setAttribute("stroke", el.strokeColor);
      node.setAttribute("stroke-width", String(el.strokeWidth));
      node.setAttribute("fill", el.type === "sticky" ? el.backgroundColor : "transparent");
      break;
    }
    case "ellipse":
      node.setAttribute("cx", String(x + w / 2));
      node.setAttribute("cy", String(y + h / 2));
      node.setAttribute("rx", String(w / 2));
      node.setAttribute("ry", String(h / 2));
      node.setAttribute("stroke", el.strokeColor);
      node.setAttribute("stroke-width", String(el.strokeWidth));
      node.setAttribute("fill", "transparent");
      break;
    case "diamond":
      node.setAttribute(
        "points",
        `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`
      );
      node.setAttribute("stroke", el.strokeColor);
      node.setAttribute("stroke-width", String(el.strokeWidth));
      node.setAttribute("fill", "transparent");
      break;
    case "line":
    case "arrow":
      node.setAttribute("x1", String(el.x));
      node.setAttribute("y1", String(el.y));
      node.setAttribute("x2", String(el.x + el.width));
      node.setAttribute("y2", String(el.y + el.height));
      node.setAttribute("stroke", el.strokeColor);
      node.setAttribute("stroke-width", String(el.strokeWidth));
      break;
    case "draw":
      node.setAttribute(
        "points",
        (el.points || []).map((p) => `${p.x},${p.y}`).join(" ")
      );
      node.setAttribute("stroke", el.strokeColor);
      node.setAttribute("stroke-width", String(el.strokeWidth));
      node.setAttribute("fill", "none");
      node.setAttribute("stroke-linecap", "round");
      node.setAttribute("stroke-linejoin", "round");
      break;
  }
}

const createPreviewNode = (el: CanvasElement): SVGElement | null => {
  const node = buildPreviewNode(el);
  if (node) applyPreview(el, node);
  return node;
};

interface ElementNodeProps {
  el: CanvasElement;
  isSelected: boolean;
  canEdit: boolean;
  onEdit: (id: string, patch: Partial<CanvasElement>) => void;
  onFinalizeEditing: () => void;
}

function ElementNodeRenderer({ el, isSelected, canEdit, onEdit, onFinalizeEditing }: ElementNodeProps) {
  const frame = isSelected ? (
    <rect
      x={el.x - 4}
      y={el.y - 4}
      width={el.width + 8}
      height={el.height + 8}
      fill="transparent"
      stroke="#3b82f6"
      strokeWidth={1.5}
      strokeDasharray="4"
      rx={6}
    />
  ) : null;

  if (el.type === "sticky") {
    return (
      <g>
        <rect
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill={el.backgroundColor}
          rx={6}
          style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))" }}
        />
        <foreignObject x={el.x + 8} y={el.y + 8} width={el.width - 16} height={el.height - 16}>
          <textarea
            disabled={!canEdit}
            value={el.text || ""}
            onChange={(e) => onEdit(el.id, { text: e.target.value })}
            onBlur={onFinalizeEditing}
            className="h-full w-full resize-none bg-transparent text-neutral-900 outline-none text-xs font-medium leading-relaxed"
            placeholder="Write note..."
          />
        </foreignObject>
        {frame}
      </g>
    );
  }

  if (el.type === "text") {
    return (
      <g>
        <foreignObject
          x={el.x}
          y={el.y}
          width={Math.max(el.width, 160)}
          height={Math.max(el.height, 40)}
        >
          <input
            disabled={!canEdit}
            value={el.text || ""}
            onChange={(e) => onEdit(el.id, { text: e.target.value })}
            onBlur={onFinalizeEditing}
            style={{ color: el.strokeColor }}
            className="w-full bg-transparent outline-none text-sm font-semibold"
            placeholder="Text..."
          />
        </foreignObject>
        {frame}
      </g>
    );
  }

  return (
    <g>
      {el.type === "rectangle" && (
        <rect
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth}
          fill="transparent"
          rx={4}
        />
      )}
      {el.type === "diamond" && (
        <polygon
          points={`${el.x + el.width / 2},${el.y} ${el.x + el.width},${
            el.y + el.height / 2
          } ${el.x + el.width / 2},${el.y + el.height} ${el.x},${el.y + el.height / 2}`}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth}
          fill="transparent"
        />
      )}
      {el.type === "ellipse" && (
        <ellipse
          cx={el.x + el.width / 2}
          cy={el.y + el.height / 2}
          rx={Math.abs(el.width) / 2}
          ry={Math.abs(el.height) / 2}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth}
          fill="transparent"
        />
      )}
      {el.type === "line" && (
        <line
          x1={el.x}
          y1={el.y}
          x2={el.x + el.width}
          y2={el.y + el.height}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth}
        />
      )}
      {el.type === "arrow" && (
        <line
          x1={el.x}
          y1={el.y}
          x2={el.x + el.width}
          y2={el.y + el.height}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth}
          markerEnd="url(#wb-arrowhead)"
        />
      )}
      {el.type === "draw" && el.points && el.points.length > 1 && (
        <polyline
          points={el.points.map((p) => `${p.x},${p.y}`).join(" ")}
          stroke={el.strokeColor}
          strokeWidth={el.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {frame}
    </g>
  );
}

const ElementNode = memo(ElementNodeRenderer);

export function WhiteboardCanvas({
  whiteboardId,
  currentUserId,
  initialData,
  title: initialTitle,
  canEdit,
  linkedProjects = [],
}: WhiteboardCanvasProps) {
  const defaultPageId = "page-1";
  const [doc, setDoc] = useState<WhiteboardDocument>(() => {
    if (initialData && typeof initialData === "object" && "pages" in initialData) {
      return initialData as WhiteboardDocument;
    }
    return {
      version: 1,
      pages: [{ id: defaultPageId, name: "Page 1", createdAt: Date.now() }],
      activePageId: defaultPageId,
      elements: Array.isArray(initialData) ? initialData : [],
      appState: {
        theme: "black-plain",
        zoom: 1,
        scrollX: 0,
        scrollY: 0,
        gridEnabled: true,
      },
    };
  });

  const [activeTool, setActiveTool] = useState<WhiteboardTool>("select");
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedStrokeColor, setSelectedStrokeColor] = useState<string>("#3b82f6");
  const [selectedBgColor, setSelectedBgColor] = useState<string>("#fef08a");
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<number>(2);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [title, setTitle] = useState(initialTitle);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertingNoteTitle, setConvertingNoteTitle] = useState("");
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [themeTip, setThemeTip] = useState<{
    label: string;
    desc: string;
    x: number;
    y: number;
  } | null>(null);

  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const contentRef = useRef<SVGGElement | null>(null);
  const drawGroupRef = useRef<SVGGElement | null>(null);
  const activeDrawRef = useRef<{ element: CanvasElement; node: SVGElement } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const panBaseRef = useRef<{ sx: number; sy: number } | null>(null);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

  const themeKey = LEGACY_THEMES[doc.appState.theme] || doc.appState.theme || "black-plain";
  const themeStyle = THEME_STYLES[themeKey] || THEME_STYLES["black-plain"];
  const isLightTheme = themeKey.startsWith("white-");
  const wbMuted = isLightTheme ? "#52525b" : "#e4e4e7";
  const wbFg = isLightTheme ? "#18181b" : "#ffffff";
  const activePageElements = doc.elements.filter(
    (el) => !el.pageId || el.pageId === doc.activePageId
  );

  const docRef = useRef<WhiteboardDocument>(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = useCallback(
    (newDoc: WhiteboardDocument) => {
      if (!canEdit) return;
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        try {
          const docToSave = JSON.parse(JSON.stringify(docRef.current || newDoc));
          await updateWhiteboard(whiteboardId, {
            data: docToSave,
            appState: docToSave.appState,
          });
          setSaveStatus("saved");
        } catch (err) {
          console.error("Failed to auto-save whiteboard", err);
          setSaveStatus("unsaved");
        }
      }, 600);
    },
    [canEdit, whiteboardId]
  );

  const { remoteCursors, broadcastCursor, broadcastElementsUpdate } = useWhiteboardRealtime(
    whiteboardId,
    currentUserId,
    useCallback((remoteElements: CanvasElement[]) => {
      setDoc((prev) => {
        const nextDoc = { ...prev, elements: remoteElements };
        docRef.current = nextDoc;
        return nextDoc;
      });
    }, []),
    useCallback((pageId: string) => {
      setDoc((prev) => {
        const nextDoc = { ...prev, activePageId: pageId };
        docRef.current = nextDoc;
        return nextDoc;
      });
    }, [])
  );

  const updateElements = (newElements: CanvasElement[], skipHistory = false) => {
    setDoc((prev) => {
      const nextDoc = { ...prev, elements: newElements };
      docRef.current = nextDoc;
      triggerAutoSave(nextDoc);
      return nextDoc;
    });

    broadcastElementsUpdate(newElements);

    if (!skipHistory) {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newElements]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  // Local text edits: no history/broadcast per keystroke, committed on blur
  const commitEdit = useCallback(
    (id: string, patch: Partial<CanvasElement>) => {
      setDoc((prev) => {
        const elements = prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el));
        const nextDoc = { ...prev, elements };
        docRef.current = nextDoc;
        triggerAutoSave(nextDoc);
        return nextDoc;
      });
    },
    [triggerAutoSave]
  );

  const finalizeEditing = useCallback(() => {
    const elements = docRef.current.elements;
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), elements]);
    setHistoryIndex((prev) => prev + 1);
    broadcastElementsUpdate(elements);
  }, [historyIndex, broadcastElementsUpdate]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      const prevElements = history[nextIndex];
      setDoc((prev) => {
        const nextDoc = { ...prev, elements: prevElements };
        docRef.current = nextDoc;
        triggerAutoSave(nextDoc);
        return nextDoc;
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextElements = history[nextIndex];
      setDoc((prev) => {
        const nextDoc = { ...prev, elements: nextElements };
        docRef.current = nextDoc;
        triggerAutoSave(nextDoc);
        return nextDoc;
      });
    }
  };

  const applyTransform = useCallback((sx: number, sy: number, z: number) => {
    contentRef.current?.setAttribute("transform", `translate(${sx}, ${sy}) scale(${z})`);
  }, []);

  useEffect(() => {
    if (!panBaseRef.current) {
      applyTransform(doc.appState.scrollX, doc.appState.scrollY, doc.appState.zoom);
    }
  }, [doc.appState.scrollX, doc.appState.scrollY, doc.appState.zoom, applyTransform]);

  const getWorldCoordinates = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const worldX = (clientX - doc.appState.scrollX) / doc.appState.zoom;
    const worldY = (clientY - doc.appState.scrollY) / doc.appState.zoom;
    return { x: worldX, y: worldY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canEdit && activeTool !== "hand") return;
    const { x, y } = getWorldCoordinates(e);

    if (activeTool === "hand" || e.button === 1) {
      panBaseRef.current = { sx: doc.appState.scrollX, sy: doc.appState.scrollY };
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === "select") {
      const clicked = [...activePageElements]
        .reverse()
        .find(
          (el) =>
            x >= Math.min(el.x, el.x + el.width) &&
            x <= Math.max(el.x, el.x + el.width) &&
            y >= Math.min(el.y, el.y + el.height) &&
            y <= Math.max(el.y, el.y + el.height)
        );
      if (clicked) {
        if (e.shiftKey) {
          setSelectedElementIds((prev) =>
            prev.includes(clicked.id)
              ? prev.filter((id) => id !== clicked.id)
              : [...prev, clicked.id]
          );
        } else {
          setSelectedElementIds([clicked.id]);
        }
      } else {
        setSelectedElementIds([]);
      }
      return;
    }

    if (activeTool === "eraser") {
      const clicked = [...activePageElements]
        .reverse()
        .find(
          (el) =>
            x >= Math.min(el.x, el.x + el.width) &&
            x <= Math.max(el.x, el.x + el.width) &&
            y >= Math.min(el.y, el.y + el.height) &&
            y <= Math.max(el.y, el.y + el.height)
        );
      if (clicked) {
        updateElements(docRef.current.elements.filter((el) => el.id !== clicked.id));
      }
      return;
    }

    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const newElement: CanvasElement = {
      id: uid("elem"),
      type: activeTool,
      x,
      y,
      width: 0,
      height: 0,
      strokeColor: selectedStrokeColor,
      backgroundColor: activeTool === "sticky" ? selectedBgColor : "transparent",
      strokeWidth: selectedStrokeWidth,
      pageId: doc.activePageId,
      points: activeTool === "draw" ? [{ x, y }] : undefined,
      text: activeTool === "sticky" ? "Sticky Note" : activeTool === "text" ? "Type here..." : "",
      fontSize: 16,
    };

    const preview = createPreviewNode(newElement);
    if (preview && drawGroupRef.current) {
      drawGroupRef.current.replaceChildren(preview);
      activeDrawRef.current = { element: newElement, node: preview };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getWorldCoordinates(e);
    broadcastCursor(x, y);

    if (panBaseRef.current && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      applyTransform(
        panBaseRef.current.sx + dx,
        panBaseRef.current.sy + dy,
        doc.appState.zoom
      );
      return;
    }

    if (!activeDrawRef.current) return;
    const d = activeDrawRef.current;
    const next = {
      ...d.element,
      width: x - d.element.x,
      height: y - d.element.y,
      points: d.element.type === "draw" ? [...(d.element.points || []), { x, y }] : undefined,
    };
    d.element = next;
    applyPreview(next, d.node);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const pan = panBaseRef.current;
    if (pan) {
      if (dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (dx !== 0 || dy !== 0) {
          setDoc((prev) => ({
            ...prev,
            appState: {
              ...prev.appState,
              scrollX: pan.sx + dx,
              scrollY: pan.sy + dy,
            },
          }));
        }
      }
      panBaseRef.current = null;
      dragStartRef.current = null;
      return;
    }

    const draw = activeDrawRef.current;
    activeDrawRef.current = null;
    if (drawGroupRef.current) drawGroupRef.current.replaceChildren();
    dragStartRef.current = null;

    if (!draw) return;
    const current = draw.element;
    const isValid =
      current.type === "draw"
        ? (current.points?.length || 0) > 1
        : Math.abs(current.width) > 5 || Math.abs(current.height) > 5;

    if (isValid) {
      const finalElem = {
        ...current,
        x: current.width < 0 ? current.x + current.width : current.x,
        y: current.height < 0 ? current.y + current.height : current.y,
        width: Math.abs(current.width) || (current.type === "sticky" ? 140 : 100),
        height: Math.abs(current.height) || (current.type === "sticky" ? 120 : 80),
      };
      const updated = [...docRef.current.elements, finalElem];
      updateElements(updated);
      setSelectedElementIds([finalElem.id]);
    }
    if (activeTool !== "draw") {
      setActiveTool("select");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        const selected = docRef.current.elements.filter((el) => selectedElementIds.includes(el.id));
        if (selected.length > 0) setClipboard(selected);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        if (clipboard.length > 0) {
          const pasted = clipboard.map((el) => ({
            ...el,
            id: uid("elem"),
            x: el.x + 30,
            y: el.y + 30,
            pageId: doc.activePageId,
          }));
          updateElements([...docRef.current.elements, ...pasted]);
          setSelectedElementIds(pasted.map((p) => p.id));
        }
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0) {
          updateElements(
            docRef.current.elements.filter((el) => !selectedElementIds.includes(el.id))
          );
          setSelectedElementIds([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementIds, clipboard, history, historyIndex, doc.activePageId]);

  const addPage = () => {
    const newPage = {
      id: uid("page"),
      name: `Page ${doc.pages.length + 1}`,
      createdAt: Date.now(),
    };
    const nextDoc = {
      ...doc,
      pages: [...doc.pages, newPage],
      activePageId: newPage.id,
    };
    setDoc(nextDoc);
    triggerAutoSave(nextDoc);
  };

  const switchPage = (pageId: string) => {
    setDoc((prev) => ({ ...prev, activePageId: pageId }));
    setSelectedElementIds([]);
  };

  const activePageName =
    doc.pages.find((p) => p.id === doc.activePageId)?.name || "Page 1";

  const goPrevPage = () => {
    const i = doc.pages.findIndex((p) => p.id === doc.activePageId);
    if (i > 0) switchPage(doc.pages[i - 1].id);
  };

  const goNextPage = () => {
    const i = doc.pages.findIndex((p) => p.id === doc.activePageId);
    if (i < doc.pages.length - 1) switchPage(doc.pages[i + 1].id);
  };

  const setTheme = (t: WhiteboardTheme) => {
    setDoc((prev) => ({ ...prev, appState: { ...prev.appState, theme: t } }));
  };

  const setZoom = (z: number) => {
    setDoc((prev) => ({
      ...prev,
      appState: { ...prev.appState, zoom: Math.min(3, Math.max(0.2, z)) },
    }));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "-")}-whiteboard.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = svgUrl;
    downloadAnchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}-diagram.svg`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.elements && Array.isArray(parsed.elements)) {
            setDoc(parsed);
            triggerAutoSave(parsed);
          }
        } catch {
          alert("Invalid whiteboard JSON file.");
        }
      };
    }
  };

  const hasStickyContext =
    activeTool === "sticky" ||
    selectedElementIds.some((id) =>
      doc.elements.find((el) => el.id === id)?.type === "sticky"
    );

  const tools: { tool: WhiteboardTool; icon: LucideIcon; label: string }[] = [
    { tool: "select", icon: MousePointer, label: "Select (V)" },
    { tool: "hand", icon: Hand, label: "Pan (H)" },
    { tool: "rectangle", icon: Square, label: "Rectangle (R)" },
    { tool: "diamond", icon: Diamond, label: "Diamond (D)" },
    { tool: "ellipse", icon: Circle, label: "Circle (O)" },
    { tool: "arrow", icon: ArrowRight, label: "Arrow (A)" },
    { tool: "line", icon: Minus, label: "Line (L)" },
    { tool: "draw", icon: Pencil, label: "Draw (P)" },
    { tool: "text", icon: Type, label: "Text (T)" },
    { tool: "sticky", icon: StickyNote, label: "Sticky Note (S)" },
    { tool: "eraser", icon: Eraser, label: "Eraser (E)" },
  ];

  const moreActive = TOOL_GROUPS.more.includes(activeTool);

  const pickStrokeColor = (c: string) => {
    setSelectedStrokeColor(c);
    if (selectedElementIds.length > 0) {
      updateElements(
        doc.elements.map((el) =>
          selectedElementIds.includes(el.id) ? { ...el, strokeColor: c } : el
        )
      );
    }
  };

  const pickStickyColor = (c: string) => {
    setSelectedBgColor(c);
    if (selectedElementIds.length > 0) {
      updateElements(
        doc.elements.map((el) =>
          selectedElementIds.includes(el.id) && el.type === "sticky"
            ? { ...el, backgroundColor: c }
            : el
        )
      );
    }
  };

  const strokeSwatch = (c: string, size: string, onPick: () => void) => (
    <button
      key={c}
      onClick={onPick}
      title={`Stroke ${c}`}
      className={`${size} rounded-full border transition-transform ${
        selectedStrokeColor === c ? "scale-125 ring-2 ring-current" : "hover:scale-110 opacity-70"
      }`}
      style={{ backgroundColor: c, borderColor: "rgba(255,255,255,0.25)" }}
    />
  );

  const stickySwatch = (c: string, size: string, onPick: () => void) => (
    <button
      key={c}
      onClick={onPick}
      title="Sticky color"
      className={`${size} rounded border transition-transform ${
        selectedBgColor === c ? "scale-125 ring-2 ring-blue-500" : "hover:scale-110 opacity-70"
      }`}
      style={{ backgroundColor: c, borderColor: "rgba(0,0,0,0.15)" }}
    />
  );

  const patternDefs = themeStyle.pattern !== "none" && (
    <pattern
      id="wb-bg-pattern"
      width={themeStyle.patternSize}
      height={themeStyle.patternSize}
      patternUnits="userSpaceOnUse"
    >
      {themeStyle.pattern === "dots" ? (
        <circle cx={0.5} cy={0.5} r={1.1} fill={themeStyle.patternColor} />
      ) : (
        <path
          d={`M ${themeStyle.patternSize} 0 L 0 0 0 ${themeStyle.patternSize}`}
          fill="none"
          stroke={themeStyle.patternColor}
          strokeWidth={1}
        />
      )}
    </pattern>
  );

  const backgroundOverlay = themeStyle.pattern !== "none" && (
    <rect width="100%" height="100%" fill="url(#wb-bg-pattern)" />
  );

  const toolButton = (tool: WhiteboardTool) =>
    `flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-90 ${
      activeTool === tool
        ? "shadow-lg"
: "text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg)"
    }`;

  return (
    <div
      className="relative flex h-full w-full select-none flex-col gap-3 bg-black p-4"
      style={{ color: themeStyle.text }}
    >
      {/* Top bar — row 1: title/status/context, row 2: editing controls */}
      <header
        className="z-30 flex shrink-0 flex-col gap-2 rounded-2xl border p-2.5"
        style={{
          backgroundColor: themeStyle.cardBg,
          backgroundImage: `radial-gradient(120% 180% at 0% 0%, rgba(${themeStyle.glowA}, 0.18), transparent 60%), radial-gradient(120% 180% at 100% 100%, rgba(${themeStyle.glowB}, 0.15), transparent 55%)`,
          borderColor: `${themeStyle.accent}55`,
          boxShadow: `inset 0 0 0 1px ${themeStyle.accent}1f, 0 0 50px -18px rgba(${themeStyle.glowB}, 0.4)`,
          "--wb-fg": wbFg,
          "--wb-muted": wbMuted,
        } as React.CSSProperties}
      >
        {/* Row 1 — Title + save status + project chips + chrome (theme/pages/zoom/export) */}
        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 shrink-0 items-center gap-1.5">
            <input
              type="text"
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (canEdit) updateWhiteboard(whiteboardId, { title });
              }}
              className="w-32 rounded-lg border px-2 py-1 text-sm font-semibold tracking-wide outline-none transition-colors"
              style={{ borderColor: themeStyle.accent + "55", backgroundColor: themeStyle.accent + "14", color: themeStyle.accent }}
            />
            {saveStatus === "saving" ? (
              <span title="Saving...">
                <Sparkles className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
              </span>
            ) : saveStatus === "saved" ? (
              <span title="Saved">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              </span>
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full bg-neutral-600" title="Unsaved" />
            )}
            {linkedProjects.length > 0 && (
              <div className="hidden 2xl:flex items-center gap-1">
                {linkedProjects.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${p.color || "#3b82f6"}20`,
                      color: p.color || "#3b82f6",
                    }}
                  >
                    <FolderKanban className="h-3 w-3" />
                    {p.key}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px shrink-0" style={{ backgroundColor: themeStyle.border }} />

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            {/* Theme */}
            <button
              onClick={() => setThemePanelOpen(true)}
              title="Themes"
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                themePanelOpen ? "" : "text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg)"
              }`}
              style={
                themePanelOpen
                  ? { backgroundColor: themeStyle.accent + "33", color: themeStyle.accent }
                  : undefined
              }
            >
              <Palette className="h-5 w-5" />
            </button>

            {/* Pages */}
            <div className="flex items-center gap-1">
              <button
                onClick={goPrevPage}
                title="Previous page"
                disabled={doc.pages.length <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) disabled:opacity-25"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span
                className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium text-(--wb-fg)"
                style={{ borderColor: themeStyle.border }}
                title={`${doc.pages.length} pages`}
              >
                <Layers className="h-4 w-4" />
                {activePageName}
              </span>
              <button
                onClick={goNextPage}
                title="Next page"
                disabled={doc.pages.length <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) disabled:opacity-25"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {canEdit && (
                <button
                  onClick={addPage}
                  title="Add New Page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed text-(--wb-muted) hover:text-(--wb-fg) transition-colors"
                  style={{ borderColor: themeStyle.border }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Zoom + export */}
            <div
              className="flex items-center gap-0.5 rounded-lg border p-0.5"
              style={{ borderColor: themeStyle.border }}
            >
              <button
                onClick={() => setZoom(doc.appState.zoom - 0.1)}
                className="rounded p-1 text-(--wb-muted) hover:text-(--wb-fg)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-11 text-center text-xs font-mono font-medium text-(--wb-fg)">
                {Math.round(doc.appState.zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(doc.appState.zoom + 0.1)}
                className="rounded p-1 text-(--wb-muted) hover:text-(--wb-fg)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={handleExportSVG}
                title="Download as SVG"
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) transition-colors"
                style={{ borderColor: themeStyle.border }}
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleExportJSON}
                title="Download JSON state"
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) transition-colors"
                style={{ borderColor: themeStyle.border }}
              >
                <FileCode className="h-4 w-4" />
              </button>
              {canEdit && (
                <label
                  title="Upload Whiteboard JSON"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) transition-colors"
                  style={{ borderColor: themeStyle.border }}
                >
                  <Upload className="h-4 w-4" />
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 — Tools + undo/redo + stroke/sticky colors */}
        <div className="flex min-w-0 items-center gap-1">
          {/* Tools + undo/redo (scrolls horizontally if the window is narrow) */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tools
              .filter((t) => TOOL_GROUPS.inline.includes(t.tool))
              .map(({ tool, icon: Icon, label }) => (
                <button
                  key={tool}
                  disabled={!canEdit && tool !== "select" && tool !== "hand"}
                  onClick={() => setActiveTool(tool)}
                  title={label}
                  className={toolButton(tool)}
                  style={
                    activeTool === tool
                      ? { backgroundColor: themeStyle.accent + "33", color: themeStyle.accent }
                      : undefined
                  }
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}

            <Popover
              trigger={
                <button
                  title="More tools"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    moreActive ? "" : "text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg)"
                  }`}
                  style={moreActive ? { backgroundColor: themeStyle.accent + "33", color: themeStyle.accent } : undefined}
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
              }
              panelClass="grid grid-cols-2 gap-1.5"
            >
              {(close) =>
                tools
                  .filter((t) => TOOL_GROUPS.more.includes(t.tool))
                  .map(({ tool, icon: Icon, label }) => (
                    <button
                      key={tool}
                      onClick={() => {
                        setActiveTool(tool);
                        close();
                      }}
                      title={label}
                      disabled={!canEdit && tool !== "select" && tool !== "hand"}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        activeTool === tool ? "" : "text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg)"
                      }`}
                      style={
                        activeTool === tool
                          ? { backgroundColor: themeStyle.accent + "33", color: themeStyle.accent }
                          : undefined
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  ))
              }
            </Popover>

            <div className="mx-1 h-6 w-px shrink-0" style={{ backgroundColor: themeStyle.border }} />

            <button
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              disabled={historyIndex <= 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) disabled:opacity-25"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              title="Redo (Ctrl+Shift+Z)"
              disabled={historyIndex >= history.length - 1}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-(--wb-muted) hover:bg-white/10 hover:text-(--wb-fg) disabled:opacity-25"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px shrink-0" style={{ backgroundColor: themeStyle.border }} />

          {/* Stroke colors + width */}
          <div className="flex shrink-0 items-center gap-1">
            {STROKE_COLORS.slice(0, 3).map((c) =>
              strokeSwatch(c, "h-5 w-5", () => pickStrokeColor(c))
            )}
            <Popover
              trigger={
                <button
                  title="More stroke colors"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/40 text-(--wb-muted) hover:text-(--wb-fg)"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              }
              panelClass="grid grid-cols-4 gap-1.5"
            >
              {(close) =>
                STROKE_COLORS.slice(3).map((c) =>
                  strokeSwatch(c, "h-6 w-6", () => {
                    pickStrokeColor(c);
                    close();
                  })
                )
              }
            </Popover>
          </div>

          <div
            className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5"
            style={{ borderColor: themeStyle.border }}
          >
            {[1, 2, 4].map((w) => (
              <button
                key={w}
                onClick={() => setSelectedStrokeWidth(w)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  selectedStrokeWidth === w ? "text-white" : "text-(--wb-muted) hover:text-(--wb-fg)"
                }`}
                style={selectedStrokeWidth === w ? { backgroundColor: themeStyle.accent } : {}}
              >
                {w}px
              </button>
            ))}
          </div>

          {hasStickyContext && (
            <>
              <div
                className="h-6 w-px shrink-0"
                style={{ backgroundColor: themeStyle.border }}
              />
              <div className="flex shrink-0 items-center gap-1">
                {STICKY_BG_COLORS.slice(0, 3).map((c) =>
                  stickySwatch(c, "h-5 w-5", () => pickStickyColor(c))
                )}
                <Popover
                  trigger={
                    <button
                      title="More sticky colors"
                      className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-white/40 text-(--wb-muted) hover:text-(--wb-fg)"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  }
                  panelClass="grid grid-cols-4 gap-1.5"
                >
                  {(close) =>
                    STICKY_BG_COLORS.slice(3).map((c) =>
                      stickySwatch(c, "h-6 w-6", () => {
                        pickStickyColor(c);
                        close();
                      })
                    )
                  }
                </Popover>
              </div>
            </>
          )}

          {selectedElementIds.length === 1 && linkedProjects.length > 0 && (
            <button
              type="button"
              title="Convert sticky to issue"
              onClick={() => {
                const el = doc.elements.find((item) => item.id === selectedElementIds[0]);
                setConvertingNoteTitle(el?.text || "New task from whiteboard");
                setIsConvertDialogOpen(true);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/15 text-purple-300 transition-all hover:bg-purple-500/25 active:scale-95"
            >
              <CheckSquare className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Board + theme side panel */}
      <div className="flex min-h-0 flex-1 gap-3">
      {/* Card 1 — Board */}
      <section
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: themeStyle.bg,
          borderColor: `${themeStyle.accent}3d`,
          boxShadow: `inset 0 0 0 1px ${themeStyle.accent}1a, 0 0 80px -24px rgba(${themeStyle.glowA}, 0.35), 0 24px 60px -20px rgba(0, 0, 0, 0.8)`,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{ cursor: activeTool === "hand" ? "grab" : "crosshair" }}
        >
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <motion.div
              className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${themeStyle.glowA}, 0.22), transparent 65%)`,
                filter: "blur(80px)",
              }}
              animate={{ y: [0, 48, 0], x: [0, 24, 0], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${themeStyle.glowB}, 0.2), transparent 65%)`,
                filter: "blur(90px)",
              }}
              animate={{ y: [0, -40, 0], x: [0, -28, 0], opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
              className="absolute -bottom-20 left-1/3 h-[22rem] w-[22rem] rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${themeStyle.glowA}, 0.14), transparent 65%)`,
                filter: "blur(100px)",
              }}
              animate={{ y: [0, 30, 0], opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </div>

          <svg
            ref={svgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative h-full w-full"
          >
            <defs>
              {patternDefs}
              <marker
                id="wb-arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={selectedStrokeColor} />
              </marker>
            </defs>

            {backgroundOverlay}

            <g ref={contentRef}>
              {activePageElements.map((el) => (
                <ElementNode
                  key={el.id}
                  el={el}
                  isSelected={selectedElementIds.includes(el.id)}
                  canEdit={canEdit}
                  onEdit={commitEdit}
                  onFinalizeEditing={finalizeEditing}
                />
              ))}

              {/* Imperative in-progress drawing preview (no React re-renders) */}
              <g ref={drawGroupRef} />

              {remoteCursors.map((cursor) => (
                <g
                  key={cursor.userId}
                  transform={`translate(${cursor.x}, ${cursor.y})`}
                  className="pointer-events-none"
                >
                  <path
                    d="M0 0 L0 16 L4.5 12.5 L8.5 21 L11.5 19.5 L7.5 11 L13 11 Z"
                    fill={cursor.color}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <g transform="translate(14, 14)">
                    <rect
                      x="0"
                      y="0"
                      width={cursor.name.length * 7 + 14}
                      height="18"
                      rx="4"
                      fill={cursor.color}
                    />
                    <text
                      x="7"
                      y="12.5"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      {cursor.name}
                    </text>
                  </g>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </section>

        <AnimatePresence>
          {themePanelOpen && (
            <motion.aside
              initial={{ x: 64, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 64, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border bg-[#0b0b0d]"
              style={{
                borderColor: `${themeStyle.accent}3d`,
                boxShadow: `inset 0 0 0 1px ${themeStyle.accent}1a, 0 0 60px -24px rgba(${themeStyle.glowA}, 0.35)`,
              }}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <p
                  className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: themeStyle.text }}
                >
                  Themes
                </p>
                <button
                  onClick={() => {
                    setThemeTip(null);
                    setThemePanelOpen(false);
                  }}
                  title="Close"
                  className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-2 content-start auto-rows-[5.75rem] gap-2 overflow-y-auto p-3 pt-1">
                {THEME_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key);
                      setThemeTip(null);
                    }}
                    onMouseEnter={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const [name, desc] = label.split(" — ");
                      setThemeTip({ label: name, desc: desc ?? "", x: r.right, y: r.top });
                    }}
                    onMouseLeave={() => setThemeTip(null)}
                    className={`relative h-full w-full overflow-hidden rounded-lg border transition-all active:scale-[0.98] ${
                      themeKey === key
                        ? "ring-2 ring-offset-2 ring-offset-black"
                        : "hover:brightness-110"
                    }`}
                    style={{
                      borderColor:
                        themeKey === key ? THEME_STYLES[key].accent : "rgba(255,255,255,0.14)",
                    }}
                  >
                    <ThemeCardPreview theme={key} />
                    <span
                      className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/45 px-1.5 py-0.5 text-[8px] font-mono font-semibold uppercase tracking-wide backdrop-blur-sm"
                      style={{ color: THEME_STYLES[key].text }}
                    >
                      {label.split(" — ")[0]}
                      {themeKey === key && (
                        <CheckCircle2
                          className="h-3 w-3"
                          style={{ color: THEME_STYLES[key].accent }}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {themeTip && (
          <div
            className="pointer-events-none fixed z-[70] w-44 rounded-lg border border-white/10 bg-[#151519]/95 px-3 py-2 shadow-2xl shadow-black/70 backdrop-blur-sm"
            style={{ top: themeTip.y, left: themeTip.x - 184 }}
          >
            <p className="text-xs font-bold text-neutral-100">{themeTip.label}</p>
            <p className="mt-0.5 text-[10px] capitalize leading-relaxed text-neutral-400">
              {themeTip.desc}
            </p>
          </div>
        )}
      </div>


      <ConvertToIssueDialog
        isOpen={isConvertDialogOpen}
        onClose={() => setIsConvertDialogOpen(false)}
        initialTitle={convertingNoteTitle}
        whiteboardId={whiteboardId}
        whiteboardTitle={title}
        projects={linkedProjects}
      />
    </div>
  );
}