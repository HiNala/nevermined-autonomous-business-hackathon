"use client";

import type { ReactNode } from "react";

export function parseInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/);
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
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownContent({ text }: { text: string }) {
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
            <span>{parseInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line) => {
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h5 key={key++} className="mb-1 mt-4 text-[13px] font-semibold" style={{ color: "var(--gray-700)" }}>{line.slice(4)}</h5>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h4 key={key++} className="mb-2 mt-5 text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>{line.slice(3)}</h4>);
    } else if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={key++} className="text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{parseInline(line)}</p>);
    }
  });
  flushList();

  return <div className="space-y-1">{elements}</div>;
}
