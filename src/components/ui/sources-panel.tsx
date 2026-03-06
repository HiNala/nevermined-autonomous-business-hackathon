"use client";

import { useState } from "react";
import {
  Globe, ExternalLink, Search, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import type { ResearchSource, SponsorToolUsage } from "@/types/pipeline";

// ── Provider badge colors ────────────────────────────────────────────────
const PROVIDER_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  Exa:        { bg: "rgba(99,102,241,0.08)",  fg: "#6366F1", border: "rgba(99,102,241,0.20)" },
  Apify:      { bg: "rgba(34,197,94,0.08)",   fg: "#22C55E", border: "rgba(34,197,94,0.20)" },
  DuckDuckGo: { bg: "rgba(251,146,60,0.08)",  fg: "#FB923C", border: "rgba(251,146,60,0.20)" },
  LLM:        { bg: "rgba(14,165,233,0.08)",   fg: "#0EA5E9", border: "rgba(14,165,233,0.20)" },
  Nevermined: { bg: "rgba(239,68,68,0.08)",    fg: "#EF4444", border: "rgba(239,68,68,0.20)" },
  NanoBanana: { bg: "rgba(234,179,8,0.08)",    fg: "#CA8A04", border: "rgba(234,179,8,0.20)" },
  ZeroClick:  { bg: "rgba(168,85,247,0.08)",   fg: "#A855F7", border: "rgba(168,85,247,0.20)" },
};

function ProviderBadge({ sponsor }: { sponsor: string }) {
  const c = PROVIDER_COLORS[sponsor] ?? { bg: "var(--bg-elevated)", fg: "var(--gray-500)", border: "var(--border-default)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
    >
      {sponsor}
    </span>
  );
}

// ── Activity log item ────────────────────────────────────────────────────
function ActivityItem({ item }: { item: SponsorToolUsage }) {
  const isSearch = item.tool.includes("search");
  const isScrape = item.tool.includes("crawl") || item.tool.includes("contents") || item.tool.includes("fetch");
  const Icon = isSearch ? Search : isScrape ? FileText : Globe;

  return (
    <div
      className="flex items-center gap-2.5 rounded-lg px-3 py-2"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
    >
      <Icon size={11} style={{ color: "var(--gray-400)" }} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-[11px] font-medium" style={{ color: "var(--gray-600)" }}>
          {item.label}
        </p>
        {item.detail && (
          <p className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>{item.detail}</p>
        )}
      </div>
      <ProviderBadge sponsor={item.sponsor} />
    </div>
  );
}

// ── Source card with provider detection ───────────────────────────────────
function SourceCard({
  source,
  index,
  toolsUsed,
}: {
  source: ResearchSource;
  index: number;
  toolsUsed?: SponsorToolUsage[];
}) {
  const scored = source as ResearchSource & {
    overallScore?: number;
    freshnessLabel?: string;
    authorityScore?: number;
    relevanceScore?: number;
  };

  // Infer which provider fetched this source from toolsUsed
  const provider = inferProvider(toolsUsed);
  const score = scored.overallScore ?? 0;
  const fresh = scored.freshnessLabel ?? "unknown";
  const freshColor = fresh === "recent" ? "#22C55E" : fresh === "moderate" ? "#F59E0B" : "#94A3B8";

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl p-3 transition-all hover:scale-[1.003]"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
    >
      {/* Index badge */}
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold"
        style={{ background: "rgba(14,165,233,0.08)", color: "#0EA5E9" }}
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-[12px] font-semibold" style={{ color: "var(--gray-700)" }}>
          {source.title || "Untitled"}
        </p>
        <p className="truncate font-mono text-[9px] mt-0.5" style={{ color: "var(--gray-400)" }}>
          {source.url}
        </p>

        {/* Score + freshness + provider row */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {score > 0 && (
            <div className="flex items-center gap-1">
              <div className="h-1 w-14 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score * 10}%`,
                    background: score >= 7 ? "#22C55E" : score >= 4 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
              <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                {score}/10
              </span>
            </div>
          )}
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[8px]"
            style={{ background: `${freshColor}12`, color: freshColor }}
          >
            {fresh}
          </span>
          {provider && <ProviderBadge sponsor={provider} />}
        </div>
      </div>

      <ExternalLink
        size={12}
        className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--gray-400)" }}
      />
    </a>
  );
}

function inferProvider(toolsUsed?: SponsorToolUsage[]): string | null {
  if (!toolsUsed || toolsUsed.length === 0) return null;
  // Pick the search/scrape provider — prefer the first search tool
  const searchTool = toolsUsed.find(
    (t) =>
      t.tool.includes("search") ||
      t.tool.includes("crawl") ||
      t.tool.includes("contents") ||
      t.tool.includes("fetch")
  );
  return searchTool?.sponsor ?? null;
}

// ── Main SourcesPanel ────────────────────────────────────────────────────
export function SourcesPanel({
  sources,
  toolsUsed,
}: {
  sources: ResearchSource[];
  toolsUsed?: SponsorToolUsage[];
}) {
  const [activityOpen, setActivityOpen] = useState(false);

  // Separate search/scrape tools from LLM tools for the activity log
  const searchTools = (toolsUsed ?? []).filter(
    (t) =>
      t.tool.includes("search") ||
      t.tool.includes("crawl") ||
      t.tool.includes("contents") ||
      t.tool.includes("fetch")
  );
  const llmTools = (toolsUsed ?? []).filter(
    (t) => t.tool.includes("llm") || t.tool.includes("outline") || t.tool.includes("synthesis")
  );

  return (
    <div className="space-y-4">
      {/* Search activity log */}
      {(searchTools.length > 0 || llmTools.length > 0) && (
        <div>
          <button
            onClick={() => setActivityOpen(!activityOpen)}
            className="flex w-full items-center gap-2 mb-2"
          >
            <p
              className="font-mono text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--gray-400)" }}
            >
              Search &amp; Processing Activity
            </p>
            <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
              {searchTools.length + llmTools.length} steps
            </span>
            {activityOpen ? (
              <ChevronUp size={12} style={{ color: "var(--gray-400)" }} />
            ) : (
              <ChevronDown size={12} style={{ color: "var(--gray-400)" }} />
            )}
          </button>

          {activityOpen && (
            <div className="space-y-1.5 mb-4">
              {[...searchTools, ...llmTools].map((item, i) => (
                <ActivityItem key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source list */}
      <div>
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--gray-400)" }}
        >
          {sources.length} sources cited
        </p>
        <div className="space-y-2">
          {sources.map((source, i) => (
            <SourceCard key={i} source={source} index={i} toolsUsed={toolsUsed} />
          ))}
        </div>
      </div>
    </div>
  );
}
