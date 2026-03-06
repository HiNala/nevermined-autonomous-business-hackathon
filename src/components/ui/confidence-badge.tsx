"use client";

import { ShieldCheck, ShieldAlert, ShieldX, Clock, Database, AlertTriangle, Zap } from "lucide-react";

export interface ConfidenceSummary {
  level: "high" | "medium" | "low";
  score: number;
  sourceCount: number;
  avgFreshness: "recent" | "moderate" | "stale" | "unknown";
  contradictionsDetected: boolean;
  unresolvedUncertainties: string[];
  premiumDataUsed: boolean;
}

interface Props {
  confidence: ConfidenceSummary;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  high: {
    icon: ShieldCheck,
    label: "High Confidence",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    barColor: "#22C55E",
  },
  medium: {
    icon: ShieldAlert,
    label: "Medium Confidence",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.1)",
    border: "rgba(251,146,60,0.25)",
    barColor: "#FB923C",
  },
  low: {
    icon: ShieldX,
    label: "Low Confidence",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    barColor: "#EF4444",
  },
};

const FRESHNESS_CONFIG = {
  recent: { label: "Recent", color: "#22C55E" },
  moderate: { label: "Moderate", color: "#FB923C" },
  stale: { label: "Stale", color: "#EF4444" },
  unknown: { label: "Unknown", color: "var(--gray-400)" },
};

export function ConfidenceBadge({ confidence, compact = false }: Props) {
  const cfg = LEVEL_CONFIG[confidence.level];
  const IconComp = cfg.icon;
  const freshCfg = FRESHNESS_CONFIG[confidence.avgFreshness];
  const scorePercent = Math.min(100, confidence.score);

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <IconComp size={9} style={{ color: cfg.color }} />
        <span className="text-[9px] font-semibold" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        <span className="text-[8px] font-mono" style={{ color: cfg.color, opacity: 0.7 }}>
          {scorePercent}%
        </span>
      </span>
    );
  }

  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComp size={14} style={{ color: cfg.color }} />
          <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold" style={{ color: cfg.color }}>
          {scorePercent}/100
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--border-default)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${scorePercent}%`, background: cfg.barColor }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <Database size={10} style={{ color: "var(--gray-400)" }} />
          <span className="text-[13px] font-bold" style={{ color: "var(--gray-800)" }}>
            {confidence.sourceCount}
          </span>
          <span className="text-[9px]" style={{ color: "var(--gray-400)" }}>sources</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Clock size={10} style={{ color: "var(--gray-400)" }} />
          <span className="text-[11px] font-semibold" style={{ color: freshCfg.color }}>
            {freshCfg.label}
          </span>
          <span className="text-[9px]" style={{ color: "var(--gray-400)" }}>freshness</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Zap size={10} style={{ color: confidence.premiumDataUsed ? "#22C55E" : "var(--gray-400)" }} />
          <span className="text-[11px] font-semibold" style={{ color: confidence.premiumDataUsed ? "#22C55E" : "var(--gray-500)" }}>
            {confidence.premiumDataUsed ? "Yes" : "No"}
          </span>
          <span className="text-[9px]" style={{ color: "var(--gray-400)" }}>premium data</span>
        </div>
      </div>

      {/* Warnings */}
      {(confidence.contradictionsDetected || confidence.unresolvedUncertainties.length > 0) && (
        <div className="mt-2.5 space-y-1">
          {confidence.contradictionsDetected && (
            <div className="flex items-start gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}>
              <AlertTriangle size={9} className="mt-0.5 shrink-0" style={{ color: "#FB923C" }} />
              <span className="text-[9px]" style={{ color: "#FB923C" }}>Conflicting sources detected — see Conflicting Evidence section</span>
            </div>
          )}
          {confidence.unresolvedUncertainties.slice(0, 2).map((u, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertTriangle size={9} className="mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
              <span className="text-[9px]" style={{ color: "#EF4444" }}>{u}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
