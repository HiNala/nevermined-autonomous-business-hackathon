"use client";

import { GitBranch, Cpu, Clock, ShieldCheck, Package, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { ConfidenceSummary } from "./confidence-badge";
import { ConfidenceBadge } from "./confidence-badge";

export interface ProvenanceBlock {
  jobId?: string;
  agentsInvolved: string[];
  modelsUsed: { agent: string; provider: string; model: string }[];
  sourcesFetchedAt?: string;
  externalDataPurchased: boolean;
  confidenceSummary?: ConfidenceSummary;
  generatedAt: string;
  durationMs?: number;
  creditsUsed?: number;
}

interface Props {
  provenance: ProvenanceBlock;
  compact?: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  strategist: "#818CF8",
  researcher: "#22C55E",
  buyer: "#FBBF24",
  seller: "#FB923C",
};

export function ProvenanceBlockCard({ provenance, compact = false }: Props) {
  const [expanded, setExpanded] = useState(!compact);

  const agentList = provenance.agentsInvolved.map((a) => a.toLowerCase());

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <GitBranch size={13} style={{ color: "#818CF8" }} />
          </div>
          <div className="text-left">
            <span className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
              Provenance &amp; Trust
            </span>
            <p className="text-[9px]" style={{ color: "var(--gray-400)" }}>
              {agentList.join(" → ")} · {provenance.creditsUsed ?? 0}cr · {provenance.durationMs ? `${(provenance.durationMs / 1000).toFixed(1)}s` : "—"}
            </p>
          </div>
        </div>
        <div style={{ color: "var(--gray-400)" }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3.5 pb-3.5 pt-3 space-y-3" style={{ borderColor: "var(--border-default)" }}>

          {/* Confidence summary */}
          {provenance.confidenceSummary && (
            <ConfidenceBadge confidence={provenance.confidenceSummary} />
          )}

          {/* Agent pipeline */}
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
              Agent Pipeline
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {agentList.map((agent, i) => (
                <div key={agent} className="flex items-center gap-1">
                  <span
                    className="rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize"
                    style={{
                      background: `${AGENT_COLORS[agent] ?? "#818CF8"}15`,
                      color: AGENT_COLORS[agent] ?? "#818CF8",
                      border: `1px solid ${AGENT_COLORS[agent] ?? "#818CF8"}30`,
                    }}
                  >
                    {agent}
                  </span>
                  {i < agentList.length - 1 && (
                    <span style={{ color: "var(--gray-400)" }} className="text-[10px]">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Models used */}
          {provenance.modelsUsed.length > 0 && (
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                Models Used
              </p>
              <div className="space-y-1">
                {provenance.modelsUsed.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Cpu size={9} style={{ color: AGENT_COLORS[m.agent.toLowerCase()] ?? "var(--gray-400)" }} />
                      <span className="capitalize text-[9px] font-medium" style={{ color: "var(--gray-700)" }}>{m.agent}</span>
                    </div>
                    <span className="font-mono text-[9px]" style={{ color: "var(--gray-500)" }}>
                      {m.provider}/{m.model}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className="flex flex-col gap-0.5 rounded-lg px-2.5 py-2"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <div className="flex items-center gap-1.5">
                <Clock size={9} style={{ color: "var(--gray-400)" }} />
                <span className="text-[9px] font-medium" style={{ color: "var(--gray-500)" }}>Generated</span>
              </div>
              <span className="text-[10px] font-medium" style={{ color: "var(--gray-700)" }}>
                {new Date(provenance.generatedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
            <div
              className="flex flex-col gap-0.5 rounded-lg px-2.5 py-2"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <div className="flex items-center gap-1.5">
                <Package size={9} style={{ color: provenance.externalDataPurchased ? "#22C55E" : "var(--gray-400)" }} />
                <span className="text-[9px] font-medium" style={{ color: "var(--gray-500)" }}>External Data</span>
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: provenance.externalDataPurchased ? "#22C55E" : "var(--gray-500)" }}
              >
                {provenance.externalDataPurchased ? "✓ Purchased & merged" : "Not used"}
              </span>
            </div>
          </div>

          {/* Job ID */}
          {provenance.jobId && (
            <div className="flex items-center justify-between">
              <span className="text-[8px]" style={{ color: "var(--gray-400)" }}>Job ID</span>
              <span className="font-mono text-[8px]" style={{ color: "var(--gray-500)" }}>{provenance.jobId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
