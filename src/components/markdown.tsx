"use client";

import { Fragment } from "react";

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPE[c]);

const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(#?[A-Za-z0-9]+-\d+)/g;

/** Renders inline markdown to React nodes (null-safe; XSS-safe, no innerHTML). */
export function renderInline(
  text: string,
  onSelectIssue?: (issueKeyOrId: string) => void
): React.ReactNode[] {
  const src = text ?? "";
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(src)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={key++}>{esc(src.slice(last, m.index))}</Fragment>);
    const [full, code, b1, b2, i1, i2, linkText, linkUrl, issueTag] = m;
    if (code) {
      nodes.push(<code key={key++} className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-[0.9em] text-emerald-300">{esc(code)}</code>);
    } else if (b1 || b2) {
      nodes.push(<strong key={key++} className="font-bold text-white">{esc(b1 || b2)}</strong>);
    } else if (i1 || i2) {
      nodes.push(<em key={key++}>{esc(i1 || i2)}</em>);
    } else if (linkText && linkUrl) {
      nodes.push(<a key={key++} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">{esc(linkText)}</a>);
    } else if (issueTag) {
      const cleanKey = issueTag.replace(/^#/, "");
      nodes.push(
        <span
          key={key++}
          onClick={(e) => {
            if (onSelectIssue) {
              e.stopPropagation();
              onSelectIssue(cleanKey);
            }
          }}
          className="inline-flex items-center gap-1 font-mono font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[11px] transition"
          title={`Click to view issue ${cleanKey}`}
        >
          {issueTag}
        </span>
      );
    }
    last = m.index + full.length;
  }
  if (last < src.length) nodes.push(<Fragment key={key++}>{esc(src.slice(last))}</Fragment>);
  return nodes;
}

interface MarkdownProps {
  content: string;
  className?: string;
  onSelectIssue?: (issueKeyOrId: string) => void;
}

/**
 * Renders AI-authored / user content as Markdown when present, and falls back
 * to plain text otherwise — so raw `**bold**`, `- lists`, `` `code` ``, and
 * headings all display correctly instead of showing literal symbols.
 * XSS-safe: builds React elements only, never innerHTML.
 */
export function Markdown({ content, className = "", onSelectIssue }: MarkdownProps) {
  if (!content) return null;

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let key = 0;
  const nextKey = () => key++;

  let para: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={nextKey()}>{renderInline(para.join(" "), onSelectIssue)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length) {
      blocks.push(
        listType === "ul" ? (
          <ul key={nextKey()} className="list-disc space-y-1 pl-5">
            {listItems.map((li, liIdx) => (
              <li key={liIdx}>{renderInline(li, onSelectIssue)}</li>
            ))}
          </ul>
        ) : (
          <ol key={nextKey()} className="list-decimal space-y-1 pl-5">
            {listItems.map((li, liIdx) => (
              <li key={liIdx}>{renderInline(li, onSelectIssue)}</li>
            ))}
          </ol>
        )
      );
      listType = null;
      listItems = [];
    }
  };
  const flushBlock = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // fenced code block
    if (/^```/.test(line)) {
      flushBlock();
      const closing = lines.slice(i + 1).findIndex((l) => /^```/.test(l.trim()));
      const endIdx = closing === -1 ? lines.length : i + 1 + closing;
      const code = lines.slice(i + 1, endIdx).join("\n");
      if (code) {
        blocks.push(
          <pre key={nextKey()} className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-[0.85em] leading-relaxed">
            <code className="text-neutral-200">{esc(code)}</code>
          </pre>
        );
      }
      i = endIdx;
      continue;
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushBlock();
      const level = Math.min(h[1].length, 6);
      const cls = "mt-3 font-bold text-white text-base first:mt-0";
      if (level === 1) blocks.push(<h1 key={nextKey()} className={cls + " text-xl"}>{renderInline(h[2], onSelectIssue)}</h1>);
      else if (level === 2) blocks.push(<h2 key={nextKey()} className={cls + " text-lg"}>{renderInline(h[2], onSelectIssue)}</h2>);
      else if (level === 3) blocks.push(<h3 key={nextKey()} className={cls}>{renderInline(h[2], onSelectIssue)}</h3>);
      else blocks.push(<h4 key={nextKey()} className="mt-2 font-bold text-white text-sm">{renderInline(h[2], onSelectIssue)}</h4>);
      continue;
    }

    // lists
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const typ: "ul" | "ol" = ul ? "ul" : "ol";
      if (listType && listType !== typ) flushList();
      listType = typ;
      listItems.push((ul ? ul[1] : ol![1]) ?? "");
      continue;
    }
    if (listType && listItems.length) flushList();

    // blank line -> paragraph break
    if (!line.trim()) {
      flushBlock();
      continue;
    }

    para.push(line);
  }
  flushBlock();

  return (
    <div className={`break-words text-xs leading-relaxed ${className}`}>
      {blocks.length ? blocks : <p>{renderInline(content, onSelectIssue)}</p>}
    </div>
  );
}
