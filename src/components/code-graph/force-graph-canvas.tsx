"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { CodeNode, CodebaseGraphData, GraphFilterState } from "@/types/code-graph";
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

  // Simulation and view state
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef<SimNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hoveredNodeRef = useRef<SimNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const alphaRef = useRef(1);
  const pulseAnimRef = useRef(0);
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

  // Filter nodes & links based on filter state
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

  // Initialize nodes & links simulation
  useEffect(() => {
    const { filteredNodes, filteredLinks } = getFilteredGraph();
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const existingMap = new Map(nodesRef.current.map((n) => [n.id, n]));
    const count = filteredNodes.length || 1;

    // Harmonious spacing ring
    const radiusDist = Math.max(140, Math.min(width, height) * 0.28);

    const simNodes: SimNode[] = filteredNodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const isDir = node.type === "directory";

      const cardWidth = isDir ? 160 : 140;
      const cardHeight = isDir ? 52 : 44;

      return {
        ...node,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * radiusDist,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * radiusDist,
        vx: 0,
        vy: 0,
        width: cardWidth,
        height: cardHeight,
        radius: Math.hypot(cardWidth / 2, cardHeight / 2),
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

  // Zoom and View Controls
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

  // Physics Simulation Step & Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      pulseAnimRef.current = (pulseAnimRef.current + 0.02) % 1;

      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background Gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGrad.addColorStop(0, "#080c14");
      bgGrad.addColorStop(0.6, "#030712");
      bgGrad.addColorStop(1, "#000000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Apply Pan & Zoom Transform
      const { x: panX, y: panY, k: scale } = transformRef.current;
      ctx.save();
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      // Subtle Background Grid Dots
      const gridSize = 40;
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
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

      // Physics calculation
      if (alphaRef.current > 0.005) {
        const alpha = alphaRef.current;
        const centerX = width / 2;
        const centerY = height / 2;

        // 1. Centering Force
        for (const node of nodes) {
          node.vx += (centerX - node.x) * 0.012 * alpha;
          node.vy += (centerY - node.y) * 0.012 * alpha;
        }

        // 2. Anti-Overlap Box Collision Solver
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 1;

            const minAllowedDist = (n1.width + n2.width) * 0.58;
            if (dist < minAllowedDist) {
              const overlap = (minAllowedDist - dist) * 0.5;
              const ox = (dx / dist) * overlap;
              const oy = (dy / dist) * overlap;
              if (n1 !== dragTargetRef.current) {
                n1.x -= ox;
                n1.y -= oy;
              }
              if (n2 !== dragTargetRef.current) {
                n2.x += ox;
                n2.y += oy;
              }
            }

            // Repulsion
            const force = (-900 * alpha) / Math.max(dist, 50);
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

        // 3. Link spring force
        for (const link of links) {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = 180;
          const force = (dist - targetDist) * 0.035 * alpha;

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

        // 4. Damping
        for (const node of nodes) {
          if (node === dragTargetRef.current) {
            node.vx = 0;
            node.vy = 0;
            continue;
          }
          node.vx *= 0.82;
          node.vy *= 0.82;
          node.x += node.vx;
          node.y += node.vy;
        }

        alphaRef.current *= 0.985;
      }

      // --- Draw Smooth Curved Links ---
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
        const curvature = 20;
        const nx = -(y2 - y1) / (Math.hypot(x2 - x1, y2 - y1) || 1);
        const ny = (x2 - x1) / (Math.hypot(x2 - x1, y2 - y1) || 1);
        const cx = midX + nx * curvature;
        const cy = midY + ny * curvature;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);

        if (isSelected) {
          ctx.strokeStyle = "rgba(99, 102, 241, 1)";
          ctx.lineWidth = 2.5;
        } else if (isHovered) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();

        // Energy pulse traveling along link
        const t = (pulseAnimRef.current + (link.source.x % 10) * 0.1) % 1;
        const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

        ctx.beginPath();
        ctx.arc(px, py, isSelected || isHovered ? 3.5 : 2, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected
          ? "#38bdf8"
          : isHovered
          ? "#ffffff"
          : "rgba(129, 140, 248, 0.8)";
        ctx.fill();
      }

      // --- Draw Sleek Glassmorphic Node Cards ---
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

        // Outer Shadow / Glow
        if (isSelected || isHovered || isMatch) {
          ctx.shadowColor = isSelected
            ? "rgba(59, 130, 246, 0.6)"
            : isMatch
            ? "rgba(234, 179, 8, 0.5)"
            : "rgba(99, 102, 241, 0.45)";
          ctx.shadowBlur = 18;
        } else {
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 8;
        }

        // Card Background Fill (Glassmorphism Gradient)
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
        ctx.shadowBlur = 0; // reset shadow for stroke
        ctx.strokeStyle = isSelected
          ? "#60a5fa"
          : isHovered
          ? "#ffffff"
          : isDir
          ? "#4338ca"
          : `${baseColor}60`;
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.stroke();

        // Left Icon Badge
        const iconSize = isDir ? 32 : 26;
        const iconX = x + 10;
        const iconY = y + (h - iconSize) / 2;

        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, 8);
        ctx.fillStyle = isDir ? "rgba(99, 102, 241, 0.2)" : `${baseColor}20`;
        ctx.fill();
        ctx.strokeStyle = isDir ? "rgba(99, 102, 241, 0.4)" : `${baseColor}40`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icon inside Badge
        ctx.font = isDir ? "15px Inter, sans-serif" : "12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const iconEmoji = isDir
          ? "📁"
          : node.layer === "db"
          ? "🗄️"
          : node.layer === "api"
          ? "🌐"
          : node.layer === "actions"
          ? "⚡"
          : node.layer === "ui"
          ? "🎨"
          : "📄";
        ctx.fillText(iconEmoji, iconX + iconSize / 2, iconY + iconSize / 2);

        // Title and Subtitle
        const textLeft = iconX + iconSize + 10;
        const textMaxWidth = w - (iconSize + 24);

        // Primary Title
        ctx.font = isDir ? "bold 12px Inter, sans-serif" : "600 11px Inter, sans-serif";
        ctx.fillStyle = isSelected || isHovered ? "#ffffff" : "#f1f5f9";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        let displayName = node.name;
        if (ctx.measureText(displayName).width > textMaxWidth) {
          while (displayName.length > 3 && ctx.measureText(displayName + "…").width > textMaxWidth) {
            displayName = displayName.slice(0, -1);
          }
          displayName += "…";
        }
        ctx.fillText(displayName, textLeft, isDir ? y + 11 : y + 9);

        // Subtitle (item count for dir, layer for file)
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = isDir ? "#a5b4fc" : "#94a3b8";
        const subText = isDir
          ? `${(node.childDirCount || 0) + (node.childFileCount || 0)} items`
          : node.layer;
        ctx.fillText(subText, textLeft, isDir ? y + 27 : y + 24);

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

  // Convert screen coords to graph coords
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

  // Find node under mouse (box hit-testing)
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

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x: gx, y: gy, mouseX, mouseY } = getGraphCoords(e.clientX, e.clientY);
    const target = getNodeAt(gx, gy);

    isDraggingRef.current = true;
    dragStartPosRef.current = { x: mouseX, y: mouseY };

    if (target) {
      dragTargetRef.current = target;
      alphaRef.current = 0.5;
    } else {
      dragTargetRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: gx, y: gy, mouseX, mouseY } = getGraphCoords(e.clientX, e.clientY);

    if (isDraggingRef.current) {
      if (dragTargetRef.current) {
        dragTargetRef.current.x = gx;
        dragTargetRef.current.y = gy;
        alphaRef.current = 0.3;
      } else {
        const dx = mouseX - dragStartPosRef.current.x;
        const dy = mouseY - dragStartPosRef.current.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        dragStartPosRef.current = { x: mouseX, y: mouseY };
      }
      setTooltip((prev) => ({ ...prev, visible: false }));
    } else {
      const hovered = getNodeAt(gx, gy);
      hoveredNodeRef.current = hovered;

      if (hovered) {
        setTooltip({
          visible: true,
          x: mouseX + 16,
          y: mouseY + 16,
          node: hovered,
        });
      } else {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const { x: gx, y: gy, mouseX, mouseY } = getGraphCoords(e.clientX, e.clientY);
    const moved =
      Math.abs(mouseX - dragStartPosRef.current.x) + Math.abs(mouseY - dragStartPosRef.current.y);

    if (moved < 5) {
      const target = getNodeAt(gx, gy);
      const now = Date.now();

      // Double-click check on directory to drill down
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
    dragTargetRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.2, Math.min(4, transformRef.current.k * zoomFactor));
    transformRef.current.k = newScale;
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none overflow-hidden bg-black cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* Hover Tooltip */}
      {tooltip.visible && tooltip.node && (
        <div
          className="pointer-events-none absolute z-30 rounded-xl border border-neutral-800 bg-neutral-950/95 px-4 py-2.5 text-xs shadow-2xl backdrop-blur-md"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>{tooltip.node.type === "directory" ? "📁" : "📄"}</span>
            <span>{tooltip.node.name}</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{tooltip.node.path}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] border-t border-neutral-800/60 pt-1">
            {tooltip.node.type === "directory" ? (
              <span className="text-indigo-400 font-semibold">
                Double-click to dive inside ({(tooltip.node.childDirCount || 0) + (tooltip.node.childFileCount || 0)} items)
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
