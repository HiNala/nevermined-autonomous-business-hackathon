"use client";

import { Award, Eye, Search, HelpCircle, LayoutList, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface BriefScore {
  clarity: number;
  specificity: number;
  answerability: number;
  sourceability: number;
  deliverableCompleteness: number;
  total: number;
  grade: "A" | "B" | "C" | "D";
  weaknesses: string[];
}

export interface BriefRouting {
  recommendedMode: "pipeline" | "researcher" | "strategist";
  recommendedDepth: "quick" | "standard" | "deep";
  enrichmentLikelihood: "high" | "medium" | "low";
  candidateTemplates: string[];
  isClarificationNeeded: boolean;
  clarificationQuestions: string[];
}

interface Props {
  score: BriefScore;
  routing?: BriefRouting;
  workspaceApplied?: boolean;
}

const GRADE_CONFIG = {
  A: { color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", label: "Excellent" },
  B: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", label: "Good" },
  C: { color: "#FB923C", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)", label: "Fair" },
  D: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", label: "Weak" },
};

const DIMENSIONS = [
  { key: "clarity", label: "Clarity", icon: Eye },
  { key: "specificity", label: "Specificity", icon: Search },
  { key: "answerability", label: "Answerability", icon: HelpCircle },
  { key: "sourceability", label: "Sourceability", icon: Search },
  { key: "deliverableCompleteness", label: "Deliverables", icon: LayoutList },
] as const;

const DEPTH_LABELS = { quick: "Quick", standard: "Standard", deep: "Deep" };
const MODE_LABELS = { pipeline: "Full Pipeline", researcher: "Researcher", strategist: "Strategist Only" };
const ENRICH_CONFIG = {
  high: { color: "#22C55E", label: "High enrichment value" },
  medium: { color: "#FB923C", label: "May benefit from enrichment" },
  low: { color: "var(--gray-400)", label: "Enrichment not needed" },
};

export function BriefScoreCard({ score, routing, workspaceApplied }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = GRADE_CONFIG[score.grade];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
    >
      {/* Compact header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg font-bold text-[13px]"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {score.grade}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
                Brief Quality
              </span>
              <span className="text-[9px] font-medium" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              {workspaceApplied && (
                <span
                  className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase"
                  style={{ background: "rgba(201,125,78,0.1)", color: "var(--accent-400)" }}
                >
                  WS Applied
                </span>
              )}
            </div>
            <p className="text-[9px]" style={{ color: "var(--gray-400)" }}>
              Score: {score.total}/50 · {score.weaknesses.length > 0 ? `${score.weaknesses.length} weakness${score.weaknesses.length > 1 ? "es" : ""}` : "No weaknesses found"}
            </p>
          </div>
        </div>
        <div style={{ color: "var(--gray-400)" }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-3.5 pb-3.5 pt-3 space-y-3" style={{ borderColor: "var(--border-default)" }}>

          {/* Score bars */}
          <div className="space-y-1.5">
            {DIMENSIONS.map(({ key, label, icon: Icon }) => {
              const val = score[key];
              const pct = (val / 10) * 100;
              const barColor = val >= 7 ? "#22C55E" : val >= 5 ? "#FB923C" : "#EF4444";
              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon size={9} style={{ color: "var(--gray-400)" }} className="w-3 shrink-0" />
                  <span className="w-20 text-[9px] shrink-0" style={{ color: "var(--gray-500)" }}>{label}</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <span className="w-6 text-right font-mono text-[9px]" style={{ color: barColor }}>{val}</span>
                </div>
              );
            })}
          </div>

          {/* Weaknesses */}
          {score.weaknesses.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Weaknesses Found</p>
              {score.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 rounded px-2 py-1" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  <AlertCircle size={8} className="mt-0.5 shrink-0" style={{ color: "#FB923C" }} />
                  <span className="text-[9px]" style={{ color: "#FB923C" }}>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Routing panel */}
          {routing && (
            <div className="rounded-lg border p-2.5 space-y-2" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>Strategist Routing</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded px-2 py-1.5 text-center" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <p className="text-[8px] font-bold uppercase" style={{ color: "#818CF8" }}>Mode</p>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--gray-800)" }}>{MODE_LABELS[routing.recommendedMode]}</p>
                </div>
                <div className="rounded px-2 py-1.5 text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-[8px] font-bold uppercase" style={{ color: "#22C55E" }}>Depth</p>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--gray-800)" }}>{DEPTH_LABELS[routing.recommendedDepth]}</p>
                </div>
                <div className="rounded px-2 py-1.5 text-center" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
                  <p className="text-[8px] font-bold uppercase" style={{ color: "#FB923C" }}>Enrich</p>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--gray-800)" }}>{routing.enrichmentLikelihood}</p>
                </div>
              </div>
              {routing.candidateTemplates.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {routing.candidateTemplates.map((t) => (
                    <span key={t} className="rounded px-1.5 py-0.5 text-[8px] font-medium" style={{ background: "var(--glass-bg)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}>
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              {routing.isClarificationNeeded && routing.clarificationQuestions.length > 0 && (
                <div className="rounded px-2 py-1.5" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <p className="mb-1 text-[8px] font-bold uppercase" style={{ color: "#FBBF24" }}>Suggested Clarifications</p>
                  {routing.clarificationQuestions.map((q, i) => (
                    <p key={i} className="text-[9px]" style={{ color: "#FBBF24" }}>· {q}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
