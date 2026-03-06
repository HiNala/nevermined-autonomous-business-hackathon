"use client";

import type { ReactNode } from "react";
import type { ResearchSource } from "@/types/pipeline";

export function parseInline(text: string, sources?: ResearchSource[]): ReactNode[] {
  // Split on bold, markdown links, and citation patterns like [Source 1], [Source 2], [1], [2]
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[Source \d+\]|\[\d+\])/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--gray-700)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 underline"
          style={{ color: "var(--accent-400)" }}
        >
          {linkMatch[1]}
        </a>
      );
    }
    // Citation: [Source N] or [N]
    const citeMatch = part.match(/^\[(?:Source )?(\d+)\]$/);
    if (citeMatch) {
      const idx = parseInt(citeMatch[1], 10) - 1;
      const source = sources?.[idx];
      if (source) {
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${source.title}\n${source.url}`}
            className="inline-flex items-center justify-center rounded px-1 py-px font-mono text-[9px] font-bold align-super leading-none transition-colors"
            style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,0.18)", textDecoration: "none", marginInline: "1px", verticalAlign: "super", fontSize: "0.65em" }}
          >
            {idx + 1}
          </a>
        );
      }
      // No matching source — render as plain text
      return <span key={i} className="font-mono text-[9px] align-super" style={{ color: "var(--gray-400)" }}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownContent({ text, sources }: { text: string; sources?: ResearchSource[] }) {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${key++}`} className="my-2 space-y-1.5 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.55 }} />
            <span>{parseInline(item, sources)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line) => {
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h5 key={key++} className="mb-1 mt-4 text-[13px] font-semibold" style={{ color: "var(--gray-700)" }}>{parseInline(line.slice(4), sources)}</h5>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h4 key={key++} className="mb-2 mt-5 text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>{parseInline(line.slice(3), sources)}</h4>);
    } else if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={key++} className="text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{parseInline(line, sources)}</p>);
    }
  });
  flushList();

  return <div className="space-y-1">{elements}</div>;
}
