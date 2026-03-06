"use client";

import { useState, useCallback } from "react";
import {
  Sparkles, Download, Copy, Check, Search, ShoppingBag, Brain, Building2,
} from "lucide-react";
import { AGENT_CONFIG } from "@/lib/agent/config";
import { ZeroClickAd } from "@/components/ui/zeroclick-ad";
import { BriefScoreCard } from "@/components/ui/brief-score-card";
import type { StructuredBrief } from "@/types/pipeline";

export function BriefView({
  brief,
  adsMuted,
  onAdServed,
}: {
  brief: StructuredBrief;
  adsMuted: boolean;
  onAdServed?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const buildText = useCallback(() => [
    `# ${brief.title}`, "",
    `**Objective:** ${brief.objective}`, "",
    brief.scope.length ? `## Scope\n${brief.scope.map((s) => `- ${s}`).join("\n")}` : "",
    brief.keyQuestions.length ? `## Key Questions\n${brief.keyQuestions.map((q) => `- ${q}`).join("\n")}` : "",
    brief.deliverables.length ? `## Deliverables\n${brief.deliverables.map((d) => `- ${d}`).join("\n")}` : "",
    brief.constraints.length ? `## Constraints\n${brief.constraints.map((c) => `- ${c}`).join("\n")}` : "",
  ].filter(Boolean).join("\n"), [brief]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildText]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([buildText()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildText, brief.title]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <Sparkles size={16} style={{ color: AGENT_CONFIG.strategist.color }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>{brief.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{brief.provider}/{brief.model}</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{brief.creditsUsed}cr</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{(brief.durationMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }} title="Download as Markdown">
            <Download size={12} />.md
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: AGENT_CONFIG.strategist.color }}>
            Structured Brief
          </p>
          <h3 className="mt-1 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>{brief.title}</h3>
        </div>

        <div className="rounded-lg p-3" style={{ background: "rgba(124, 58, 237, 0.04)", border: "1px solid rgba(124, 58, 237, 0.10)" }}>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-600)" }}>{brief.objective}</p>
        </div>

        {brief.score && (
          <BriefScoreCard score={brief.score} routing={brief.routing} workspaceApplied={brief.workspaceApplied} />
        )}

        {brief.routing && (
          <div className="rounded-xl p-3.5" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}>
            <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#7C3AED" }}>
              Strategist routing recommendation
            </p>
            <div className="flex flex-wrap gap-2">
              {brief.routing.recommendedMode && (
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.20)" }}>
                  <Brain size={10} style={{ color: "#7C3AED" }} />
                  <span className="font-mono text-[10px] font-semibold" style={{ color: "#7C3AED" }}>mode</span>
                  <span className="text-[10px]" style={{ color: "var(--gray-600)" }}>{brief.routing.recommendedMode}</span>
                </div>
              )}
              {brief.routing.recommendedDepth && (
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.20)" }}>
                  <Search size={10} style={{ color: "#0EA5E9" }} />
                  <span className="font-mono text-[10px] font-semibold" style={{ color: "#0EA5E9" }}>depth</span>
                  <span className="text-[10px]" style={{ color: "var(--gray-600)" }}>{brief.routing.recommendedDepth}</span>
                </div>
              )}
              {brief.routing.enrichmentLikelihood !== undefined && (
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.20)" }}>
                  <ShoppingBag size={10} style={{ color: "#F59E0B" }} />
                  <span className="font-mono text-[10px] font-semibold" style={{ color: "#F59E0B" }}>enrichment</span>
                  <span className="text-[10px]" style={{ color: "var(--gray-600)" }}>{brief.routing.enrichmentLikelihood}</span>
                </div>
              )}
              {brief.workspaceApplied && (
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
                  <Building2 size={10} style={{ color: "#22C55E" }} />
                  <span className="font-mono text-[10px] font-semibold" style={{ color: "#22C55E" }}>workspace</span>
                  <span className="text-[10px]" style={{ color: "var(--gray-600)" }}>applied</span>
                </div>
              )}
            </div>
          </div>
        )}

        {brief.scope.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Scope</p>
            <div className="flex flex-wrap gap-1.5">
              {brief.scope.map((s, i) => (
                <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {brief.searchQueries.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Search Queries</p>
            <div className="space-y-1">
              {brief.searchQueries.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Search size={10} style={{ color: AGENT_CONFIG.researcher.color }} />
                  <span className="text-[11px]" style={{ color: "var(--gray-500)" }}>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.keyQuestions.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Key Questions</p>
            <div className="space-y-1">
              {brief.keyQuestions.map((q, i) => (
                <p key={i} className="text-[11px]" style={{ color: "var(--gray-500)" }}>• {q}</p>
              ))}
            </div>
          </div>
        )}

        {brief.deliverables.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Deliverables</p>
            <div className="flex flex-wrap gap-1.5">
              {brief.deliverables.map((d, i) => (
                <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "rgba(201, 125, 78, 0.07)", border: "1px solid rgba(201, 125, 78, 0.18)", color: "var(--accent-400)" }}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {brief.constraints.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Constraints</p>
            <div className="space-y-1">
              {brief.constraints.map((c, i) => (
                <p key={i} className="text-[11px]" style={{ color: "var(--gray-500)" }}>⚠ {c}</p>
              ))}
            </div>
          </div>
        )}

        <ZeroClickAd
          query={[brief.title, ...brief.scope.slice(0, 2)].filter(Boolean).join(" · ")}
          muted={adsMuted}
          signals={[
            { category: "interest" as const, confidence: 0.9, subject: brief.title, relatedSubjects: brief.scope.slice(0, 4), sentiment: "positive" as const },
            ...(brief.keyQuestions.length > 0 ? [{ category: "evaluation" as const, confidence: 0.75, subject: brief.keyQuestions[0], sentiment: "neutral" as const }] : []),
          ]}
          onAdServed={onAdServed}
        />
      </div>
    </div>
  );
}
