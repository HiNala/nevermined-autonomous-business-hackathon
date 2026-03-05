"use client";

import type { SponsorToolUsage } from "@/types/pipeline";

const SPONSOR_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Apify: { bg: "rgba(0, 191, 165, 0.08)", border: "rgba(0, 191, 165, 0.22)", text: "#00BFA5", dot: "#00BFA5" },
  Exa: { bg: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.22)", text: "#6366F1", dot: "#6366F1" },
  Nevermined: { bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.22)", text: "#22C55E", dot: "#22C55E" },
  ZeroClick: { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.22)", text: "#F59E0B", dot: "#F59E0B" },
  DuckDuckGo: { bg: "rgba(251, 146, 60, 0.08)", border: "rgba(251, 146, 60, 0.22)", text: "#FB923C", dot: "#FB923C" },
  LLM: { bg: "rgba(168, 162, 158, 0.08)", border: "rgba(168, 162, 158, 0.22)", text: "var(--gray-500)", dot: "var(--gray-400)" },
};

function SponsorBadge({ usage }: { usage: SponsorToolUsage }) {
  const colors = SPONSOR_COLORS[usage.sponsor] ?? SPONSOR_COLORS.LLM;

  return (
    <div
      className="group relative flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[9px] transition-all hover:scale-[1.02]"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
      title={`${usage.label}${usage.detail ? ` · ${usage.detail}` : ""}`}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: colors.dot }} />
      <span className="font-semibold">{usage.sponsor}</span>
      <span style={{ color: colors.text, opacity: 0.7 }}>·</span>
      <span className="max-w-[140px] truncate" style={{ opacity: 0.85 }}>
        {usage.tool.replace(/-/g, " ")}
      </span>
    </div>
  );
}

export function SponsorRail({ toolsUsed }: { toolsUsed?: SponsorToolUsage[] }) {
  if (!toolsUsed || toolsUsed.length === 0) return null;

  // Dedupe by tool name and count unique sponsors
  const uniqueSponsors = [...new Set(toolsUsed.filter((t) => t.sponsor !== "LLM").map((t) => t.sponsor))];

  return (
    <div
      className="border-b px-4 py-2.5"
      style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--gray-400)" }}>
          Sponsor Tools Used
        </span>
        <span className="font-mono text-[8px]" style={{ color: "var(--gray-300)" }}>
          {uniqueSponsors.length} sponsor{uniqueSponsors.length !== 1 ? "s" : ""} · {toolsUsed.length} tool call{toolsUsed.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {toolsUsed.map((usage, i) => (
          <SponsorBadge key={`${usage.tool}-${i}`} usage={usage} />
        ))}
      </div>
    </div>
  );
}
