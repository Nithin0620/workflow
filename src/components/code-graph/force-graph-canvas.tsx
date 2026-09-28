"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { CodeNode, CodebaseGraphData, GraphFilterState, CodeLayer } from "@/types/code-graph";
import { LAYER_COLORS } from "@/lib/github/graph-builder";

interface ForceGraphCanvasProps {
  data: CodebaseGraphData;
  filter: GraphFilterState;
  selectedNodeId: string | null;
  onSelectNode: (node: CodeNode | null) => void;
  onDrillDown?: (targetPath: string) => void;
  zoomActionRef?: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
  } | null>;
}

interface SimNode extends CodeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  radius: number;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
  type: string;
}

/**
 * Calculates adaptive, proportional dimensions for a graph node card
 * based on node type, title length, connection degree, and item counts.
 */
function getNodeDimensions(node: CodeNode): { width: number; height: number; radius: number } {
  const isDir = node.type === "directory";
  const nameLen = node.name.length;
  const totalDegree = (node.inDegree || 0) + (node.outDegree || 0);

  // Dynamic width calculation with smooth clamps
  const baseWidth = isDir ? 165 : 145;
  const charWidthExtra = Math.min(Math.max(0, nameLen - 10) * 7.5, 75);
  const degreeExtra = Math.min(totalDegree * 3, 30);
  const width = Math.round(Math.min(Math.max(baseWidth + charWidthExtra + degreeExtra, 140), 250));

  const height = isDir ? 54 : 48;
  const radius = Math.round(Math.hypot(width / 2, height / 2));

  return { width, height, radius };
}

/**
 * Returns a sleek icon emoji for a given node layer or directory.
 */
function getNodeIcon(node: CodeNode): string {
  if (node.type === "directory") return "📁";
  switch (node.layer as CodeLayer) {
    case "db":
      return "🗄️";
    case "api":
      return "🌐";
    case "actions":
      return "⚡";
    case "ui":
      return "🎨";
    case "hooks":
      return "⚓";
    case "types":
      return "🏷️";
    case "tests":
      return "🧪";
    case "config":
      return "⚙️";
    case "docs":
      return "📚";
    default:
      return "📄";
  }
}

export function ForceGraphCanvas({
  data,
  filter,
  selectedNodeId,
  onSelectNode,
  onDrillDown,
  zoomActionRef,
}: ForceGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation & View Transform State
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const dragTargetRef = useRef<SimNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const mouseMovedDistRef = useRef(0);
  const hoveredNodeRef = useRef<SimNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const alphaRef = useRef(1);
  const pulseAnimRef = useRef(0);
  const [cursorStyle, setCursorStyle] = useState<"grab" | "grabbing" | "pointer">("grab");

  const lastClickTimeRef = useRef<{ time: number; nodeId: string | null }>({
    time: 0,
    nodeId: null,
  });

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: SimNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  // Filter nodes & links based on current filter state
  const getFilteredGraph = useCallback(() => {
    const activeLayers = new Set(filter.selectedLayers);
    const searchLower = filter.search.trim().toLowerCase();

    const filteredNodes = data.nodes.filter((node) => {
      if (filter.hideDirectories && node.type === "directory") {
        return false;
      }
      if (node.type !== "directory" && !activeLayers.has(node.layer)) {
        return false;
      }
      if (filter.showIssuesOnly && (!node.issueCount || node.issueCount === 0)) {
        return false;
      }
      return true;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = data.links.filter((link) => {
      const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
      return nodeIds.has(srcId) && nodeIds.has(tgtId);
    });

    return { filteredNodes, filteredLinks, searchLower };
  }, [data, filter]);

  // Initialize nodes & links with calculated dynamic dimensions
  useEffect(() => {
    const { filteredNodes, filteredLinks } = getFilteredGraph();
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const existingMap = new Map(nodesRef.current.map((n) => [n.id, n]));
    const count = filteredNodes.length || 1;

    // Harmonious multi-ring initial layout distribution
    const simNodes: SimNode[] = filteredNodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      const dims = getNodeDimensions(node);

      const ringIndex = Math.floor(i / 12);
      const ringCount = Math.min(count - ringIndex * 12, 12);
      const ringPos = i % 12;
      const angle = (ringPos / ringCount) * 2 * Math.PI - Math.PI / 2;
      const ringRadius = 140 + ringIndex * 160;

      return {
        ...node,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * ringRadius,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * ringRadius,
        vx: 0,
        vy: 0,
        width: dims.width,
        height: dims.height,
        radius: dims.radius,
      };
    });

    const simNodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = [];
    for (const link of filteredLinks) {
      const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
      const srcNode = simNodeMap.get(srcId);
      const tgtNode = simNodeMap.get(tgtId);
      if (srcNode && tgtNode) {
        simLinks.push({
          source: srcNode,
          target: tgtNode,
          type: link.type,
        });
      }
    }

    nodesRef.current = simNodes;
    linksRef.current = simLinks;
    alphaRef.current = 1.0;
  }, [getFilteredGraph]);

  // Zoom & Pan Action Handlers
  const zoomIn = useCallback(() => {
    transformRef.current.k = Math.min(4, transformRef.current.k * 1.25);
  }, []);

  const zoomOut = useCallback(() => {
    transformRef.current.k = Math.max(0.2, transformRef.current.k / 1.25);
  }, []);

  const resetView = useCallback(() => {
    transformRef.current = { x: 0, y: 0, k: 1 };
    alphaRef.current = 0.8;
  }, []);

  useEffect(() => {
    if (zoomActionRef) {
      zoomActionRef.current = { zoomIn, zoomOut, resetView };
    }
  }, [zoomActionRef, zoomIn, zoomOut, resetView]);

  // Main Render Loop & Physics Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      pulseAnimRef.current = (pulseAnimRef.current + 0.015) % 1;

      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep Cyberpunk Space Gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        60,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, "#080d1a");
      bgGrad.addColorStop(0.5, "#030712");
      bgGrad.addColorStop(1, "#000000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Apply Pan & Zoom Transform
      const { x: panX, y: panY, k: scale } = transformRef.current;
      ctx.save();
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      // Subtle Glowing Architectural Grid Dots
      const gridSize = 48;
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      const startX = Math.floor((-width - panX) / gridSize) * gridSize;
      const endX = Math.ceil((2 * width - panX) / gridSize) * gridSize;
      const startY = Math.floor((-height - panY) / gridSize) * gridSize;
      const endY = Math.ceil((2 * height - panY) / gridSize) * gridSize;

      for (let gx = startX; gx < endX; gx += gridSize) {
        for (let gy = startY; gy < endY; gy += gridSize) {
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const searchLower = filter.search.trim().toLowerCase();

      // Physics Simulation Step
      if (alphaRef.current > 0.005) {
        const alpha = alphaRef.current;
        const centerX = width / 2;
        const centerY = height / 2;

        // 1. Centering Force
        for (const node of nodes) {
          node.vx += (centerX - node.x) * 0.01 * alpha;
          node.vy += (centerY - node.y) * 0.01 * alpha;
        }

        // 2. Anti-Overlap Box Collision Solver
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 1;

            const minAllowedX = (n1.width + n2.width) * 0.5 + 24;
            const minAllowedY = (n1.height + n2.height) * 0.5 + 20;

            const overlapX = minAllowedX - Math.abs(dx);
            const overlapY = minAllowedY - Math.abs(dy);

            if (overlapX > 0 && overlapY > 0) {
              if (overlapX < overlapY) {
                const signX = dx >= 0 ? 1 : -1;
                const shiftX = overlapX * 0.5 * signX;
                if (n1 !== dragTargetRef.current) n1.x -= shiftX;
                if (n2 !== dragTargetRef.current) n2.x += shiftX;
              } else {
                const signY = dy >= 0 ? 1 : -1;
                const shiftY = overlapY * 0.5 * signY;
                if (n1 !== dragTargetRef.current) n1.y -= shiftY;
                if (n2 !== dragTargetRef.current) n2.y += shiftY;
              }
            }

            // Smooth Node Repulsion
            const force = (-1200 * alpha) / Math.max(dist, 40);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (n1 !== dragTargetRef.current) {
              n1.vx += fx;
              n1.vy += fy;
            }
            if (n2 !== dragTargetRef.current) {
              n2.vx -= fx;
              n2.vy -= fy;
            }
          }
        }

        // 3. Link Spring Force
        for (const link of links) {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = Math.max(180, (link.source.width + link.target.width) * 0.85);
          const force = (dist - targetDist) * 0.03 * alpha;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (link.source !== dragTargetRef.current) {
            link.source.vx += fx;
            link.source.vy += fy;
          }
          if (link.target !== dragTargetRef.current) {
            link.target.vx -= fx;
            link.target.vy -= fy;
          }
        }

        // 4. Damping & Integration
        for (const node of nodes) {
          if (node === dragTargetRef.current) {
            node.vx = 0;
            node.vy = 0;
            continue;
          }
          node.vx *= 0.84;
          node.vy *= 0.84;

          node.x += node.vx;
          node.y += node.vy;
        }

        alphaRef.current *= 0.985;
      }

      // --- Draw Smooth Curved Link Connections ---
      for (const link of links) {
        const isHovered =
          hoveredNodeRef.current?.id === link.source.id ||
          hoveredNodeRef.current?.id === link.target.id;
        const isSelected =
          selectedNodeId === link.source.id || selectedNodeId === link.target.id;

        const x1 = link.source.x;
        const y1 = link.source.y;
        const x2 = link.target.x;
        const y2 = link.target.y;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const curvature = 24;
        const dist = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = -(y2 - y1) / dist;
        const ny = (x2 - x1) / dist;
        const cx = midX + nx * curvature;
        const cy = midY + ny * curvature;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);

        if (isSelected) {
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth = 2.5;
        } else if (isHovered) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 2.0;
        } else {
          ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
          ctx.lineWidth = 1.4;
        }
        ctx.stroke();

        // Animated Energy Particle Pulse
        const t = (pulseAnimRef.current + (link.source.x % 10) * 0.1) % 1;
        const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

        ctx.beginPath();
        ctx.arc(px, py, isSelected || isHovered ? 3.5 : 2.2, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected
          ? "#38bdf8"
          : isHovered
          ? "#ffffff"
          : "rgba(129, 140, 248, 0.85)";
        ctx.fill();
      }

      // --- Draw Modern Glassmorphic Node Cards ---
      for (const node of nodes) {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isDir = node.type === "directory";
        const isMatch =
          searchLower.length > 0 &&
          (node.name.toLowerCase().includes(searchLower) ||
            node.path.toLowerCase().includes(searchLower) ||
            node.layer.toLowerCase().includes(searchLower));

        const baseColor = isDir ? "#6366f1" : LAYER_COLORS[node.layer] || "#94a3b8";
        const opacity = searchLower.length > 0 && !isMatch ? 0.25 : 1;

        ctx.save();
        ctx.globalAlpha = opacity;

        const w = node.width;
        const h = node.height;
        const x = node.x - w / 2;
        const y = node.y - h / 2;
        const r = isDir ? 12 : 10;

        // Outer Shadow / Glow Effect
        if (isSelected || isHovered || isMatch) {
          ctx.shadowColor = isSelected
            ? "rgba(99, 102, 241, 0.7)"
            : isMatch
            ? "rgba(234, 179, 8, 0.6)"
            : "rgba(99, 102, 241, 0.5)";
          ctx.shadowBlur = isSelected ? 20 : 14;
        } else {
          ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
          ctx.shadowBlur = 8;
        }

        // Card Fill (Glassmorphism Gradient)
        const cardGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        if (isDir) {
          cardGrad.addColorStop(0, isSelected ? "#1e1b4b" : "#0f172a");
          cardGrad.addColorStop(1, isSelected ? "#312e81" : "#1e1b4b");
        } else {
          cardGrad.addColorStop(0, isSelected ? "#172554" : "#0b0f19");
          cardGrad.addColorStop(1, isSelected ? "#1e3a8a" : "#111827");
        }

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = cardGrad;
        ctx.fill();

        // Card Border
        ctx.shadowBlur = 0; // reset for crisp border stroke
        ctx.strokeStyle = isSelected
          ? "#60a5fa"
          : isHovered
          ? "#ffffff"
          : isDir
          ? "#4338ca"
          : `${baseColor}65`;
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.stroke();

        // Left Icon Badge Box
        const iconSize = isDir ? 32 : 28;
        const iconX = x + 8;
        const iconY = y + (h - iconSize) / 2;

        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, 8);
        ctx.fillStyle = isDir ? "rgba(99, 102, 241, 0.22)" : `${baseColor}22`;
        ctx.fill();
        ctx.strokeStyle = isDir ? "rgba(99, 102, 241, 0.45)" : `${baseColor}45`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Emoji Icon Inside Badge
        ctx.font = isDir ? "15px Inter, sans-serif" : "13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(getNodeIcon(node), iconX + iconSize / 2, iconY + iconSize / 2);

        // Title and Subtitle Text Layout
        const textLeft = iconX + iconSize + 9;
        const textMaxWidth = w - (iconSize + 22);

        // Main Node Name
        ctx.font = isDir ? "bold 12px Inter, sans-serif" : "600 11px Inter, sans-serif";
        ctx.fillStyle = isSelected || isHovered ? "#ffffff" : "#f1f5f9";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        let displayName = node.name;
        if (ctx.measureText(displayName).width > textMaxWidth) {
          while (
            displayName.length > 3 &&
            ctx.measureText(displayName + "…").width > textMaxWidth
          ) {
            displayName = displayName.slice(0, -1);
          }
          displayName += "…";
        }
        ctx.fillText(displayName, textLeft, isDir ? y + 11 : y + 9);

        // Subtitle (item count for directory, layer for file)
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = isDir ? "#a5b4fc" : "#94a3b8";
        const subText = isDir
          ? `${(node.childDirCount || 0) + (node.childFileCount || 0)} items`
          : node.layer;
        ctx.fillText(subText, textLeft, isDir ? y + 27 : y + 25);

        // Issue Indicator Badge (Top Right)
        if (node.issueCount && node.issueCount > 0) {
          const badgeX = x + w - 4;
          const badgeY = y + 4;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 7, 0, 2 * Math.PI);
          ctx.fillStyle = "#ef4444";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = "bold 8px Inter, sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${node.issueCount}`, badgeX, badgeY);
        }

        ctx.restore();
      }

      ctx.restore();
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedNodeId, filter.search]);

  // Convert Screen Coordinates to Graph Canvas Coordinates
  const getGraphCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, mouseX: 0, mouseY: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const width = rect.width || 800;
    const height = rect.height || 600;
    const { x: panX, y: panY, k: scale } = transformRef.current;

    const graphX = (mouseX - (width / 2 + panX)) / scale + width / 2;
    const graphY = (mouseY - (height / 2 + panY)) / scale + height / 2;

    return { x: graphX, y: graphY, mouseX, mouseY };
  };

  // Find Node Under Mouse Coordinates (Exact Bounding Box Hit Testing)
  const getNodeAt = (graphX: number, graphY: number): SimNode | null => {
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      const left = node.x - node.width / 2;
      const right = node.x + node.width / 2;
      const top = node.y - node.height / 2;
      const bottom = node.y + node.height / 2;

      if (graphX >= left && graphX <= right && graphY >= top && graphY <= bottom) {
        return node;
      }
    }
    return null;
  };

  // Mouse / Touch Event Handlers with Drag Threshold Detection
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x: gx, y: gy, mouseX, mouseY } = getGraphCoords(e.clientX, e.clientY);
    const target = getNodeAt(gx, gy);

    isDraggingRef.current = true;
    dragStartPosRef.current = { x: mouseX, y: mouseY };
    mouseMovedDistRef.current = 0;

    if (target) {
      dragTargetRef.current = target;
      isPanningRef.current = false;
      alphaRef.current = 0.5;
      setCursorStyle("grabbing");
    } else {
      dragTargetRef.current = null;
      isPanningRef.current = true;
      setCursorStyle("grabbing");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: gx, y: gy, mouseX, mouseY } = getGraphCoords(e.clientX, e.clientY);

    if (isDraggingRef.current) {
      const dx = mouseX - dragStartPosRef.current.x;
      const dy = mouseY - dragStartPosRef.current.y;
      mouseMovedDistRef.current += Math.hypot(dx, dy);

      if (dragTargetRef.current) {
        dragTargetRef.current.x = gx;
        dragTargetRef.current.y = gy;
        alphaRef.current = 0.3;
      } else if (isPanningRef.current) {
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        dragStartPosRef.current = { x: mouseX, y: mouseY };
      }
      setTooltip((prev) => ({ ...prev, visible: false }));
    } else {
      const hovered = getNodeAt(gx, gy);
      hoveredNodeRef.current = hovered;

      if (hovered) {
        setCursorStyle("pointer");
        setTooltip({
          visible: true,
          x: mouseX + 16,
          y: mouseY + 16,
          node: hovered,
        });
      } else {
        setCursorStyle("grab");
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const { x: gx, y: gy } = getGraphCoords(e.clientX, e.clientY);
    const target = getNodeAt(gx, gy);

    // If mouse was dragged less than 6px total, treat as a intentional click
    if (mouseMovedDistRef.current < 6) {
      const now = Date.now();

      // Double-click check on directory node to drill down
      if (
        target &&
        target.type === "directory" &&
        lastClickTimeRef.current.nodeId === target.id &&
        now - lastClickTimeRef.current.time < 350
      ) {
        if (onDrillDown) {
          onDrillDown(target.path);
        }
      } else {
        onSelectNode(target);
      }

      lastClickTimeRef.current = { time: now, nodeId: target ? target.id : null };
    }

    isDraggingRef.current = false;
    isPanningRef.current = false;
    dragTargetRef.current = null;
    setCursorStyle(target ? "pointer" : "grab");
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newScale = Math.max(0.2, Math.min(4, transformRef.current.k * zoomFactor));
    transformRef.current.k = newScale;
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full select-none overflow-hidden bg-black ${
        cursorStyle === "grabbing"
          ? "cursor-grabbing"
          : cursorStyle === "pointer"
          ? "cursor-pointer"
          : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* Modern Sleek Hover Tooltip */}
      {tooltip.visible && tooltip.node && (
        <div
          className="pointer-events-none absolute z-30 rounded-xl border border-neutral-800 bg-neutral-950/95 px-4 py-2.5 text-xs shadow-2xl backdrop-blur-md"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>{getNodeIcon(tooltip.node)}</span>
            <span>{tooltip.node.name}</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{tooltip.node.path}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] border-t border-neutral-800/60 pt-1">
            {tooltip.node.type === "directory" ? (
              <span className="text-indigo-400 font-semibold">
                Double-click to dive inside (
                {(tooltip.node.childDirCount || 0) + (tooltip.node.childFileCount || 0)} items)
              </span>
            ) : (
              <span
                className="font-medium capitalize"
                style={{ color: LAYER_COLORS[tooltip.node.layer] || "#fff" }}
              >
                {tooltip.node.layer} layer
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
