"use client";

import { useState, useCallback } from "react";
import {
  FileText, Globe, Download, Copy, Check, ExternalLink, Sparkles, Brain,
} from "lucide-react";
import { AGENT_CONFIG } from "@/lib/agent/config";
import { ZeroClickAd, type ZeroClickSignal } from "@/components/ui/zeroclick-ad";
import { VisionImageBanner } from "@/components/ui/vision-image-banner";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { ResearchDocument, ResearchSource } from "@/types/pipeline";
import type { ResearchConfidence } from "@/types/pipeline";
import { ImageIcon } from "lucide-react";

export function DocumentView({
  doc,
  adQuery,
  adSignals,
  adsMuted = false,
  onAdServed,
  visionResult,
  isGeneratingImage,
}: {
  doc: ResearchDocument;
  adQuery?: string;
  adSignals?: ZeroClickSignal[];
  adsMuted?: boolean;
  onAdServed?: () => void;
  visionResult?: { imageUrl: string; attempts: number; passedQuality: boolean; qualityScore: number; finalPrompt: string } | null;
  isGeneratingImage?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"full" | "executive" | "sources">("full");

  const buildMarkdown = useCallback(() => [
    `# ${doc.title}`, "", doc.summary, "",
    ...doc.sections.flatMap((s) => [`## ${s.heading}`, "", s.content, ""]),
    "## Sources", ...doc.sources.map((s) => `- [${s.title}](${s.url})`),
  ].join("\n"), [doc]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildMarkdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildMarkdown, doc.title]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <FileText size={16} style={{ color: AGENT_CONFIG.researcher.color }} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>{doc.title}</p>
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[7px] font-semibold uppercase tracking-wide"
                style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,0.20)" }}
              >
                Composer draft
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{doc.provider}/{doc.model}</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{doc.creditsUsed}cr</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{(doc.durationMs / 1000).toFixed(1)}s</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{doc.sources.length} sources</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}>
            {(["full", "executive", "sources"] as const).map((m) => {
              const labels: Record<typeof m, string> = { full: "Full", executive: "Summary", sources: "Sources" };
              const active = viewMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className="px-2.5 py-1 font-mono text-[9px] font-semibold transition-all"
                  style={{
                    background: active ? "rgba(14,165,233,0.12)" : "transparent",
                    color: active ? "#0EA5E9" : "var(--gray-400)",
                    borderRight: m !== "sources" ? "1px solid var(--border-default)" : "none",
                  }}
                >
                  {labels[m]}
                </button>
              );
            })}
          </div>
          <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }} title="Download as Markdown">
            <Download size={12} />.md
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* VISION image banner */}
        {isGeneratingImage && !visionResult && (
          <div
            className="mb-5 flex items-center gap-3 rounded-xl p-3 animate-pulse"
            style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)" }}
          >
            <ImageIcon size={14} style={{ color: "#CA8A04" }} />
            <span className="font-mono text-[10px]" style={{ color: "#CA8A04" }}>VISION agent generating image…</span>
          </div>
        )}
        {visionResult?.imageUrl && (
          <VisionImageBanner visionResult={visionResult} title={doc.title} />
        )}

        {/* Confidence badge */}
        {(doc as ResearchDocument & { confidence?: ResearchConfidence }).confidence && (
          <div className="mb-4">
            <ConfidenceBadge confidence={(doc as ResearchDocument & { confidence: ResearchConfidence }).confidence} />
          </div>
        )}

        {/* ── SOURCES MODE ── */}
        {viewMode === "sources" ? (
          <div className="space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gray-400)" }}>
              {doc.sources.length} sources used in this report
            </p>
            {doc.sources.map((source, i) => {
              const scored = source as ResearchSource & { overallScore?: number; freshnessLabel?: string; authorityScore?: number };
              const score = scored.overallScore ?? 0;
              const fresh = scored.freshnessLabel ?? "unknown";
              const freshColor = fresh === "recent" ? "#22C55E" : fresh === "moderate" ? "#F59E0B" : "#94A3B8";
              return (
                <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl p-3 transition-all hover:scale-[1.005]"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold" style={{ background: "rgba(14,165,233,0.08)", color: "#0EA5E9" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12px] font-semibold" style={{ color: "var(--gray-700)" }}>{source.title}</p>
                    <p className="truncate font-mono text-[9px] mt-0.5" style={{ color: "var(--gray-400)" }}>{source.url}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {score > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "var(--border-default)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.round(score * 100)}%`, background: score > 0.7 ? "#22C55E" : score > 0.4 ? "#F59E0B" : "#EF4444" }} />
                          </div>
                          <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>{Math.round(score * 100)}%</span>
                        </div>
                      )}
                      <span className="rounded px-1.5 py-0.5 font-mono text-[8px]" style={{ background: `${freshColor}12`, color: freshColor }}>{fresh}</span>
                    </div>
                  </div>
                  <ExternalLink size={12} className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--gray-400)" }} />
                </a>
              );
            })}
          </div>
        ) : viewMode === "executive" ? (
          /* ── EXECUTIVE SUMMARY MODE ── */
          <div className="space-y-5">
            <div className="rounded-2xl p-5" style={{ background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.12)" }}>
              <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#0EA5E9" }}>Executive Summary</p>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--gray-700)" }}>{doc.summary}</p>
            </div>
            <div>
              <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Section Overview — {doc.sections.length} sections</p>
              <div className="space-y-2">
                {doc.sections.map((section, i) => {
                  const isExternal = section.heading.startsWith("External Data:") || section.heading.startsWith("Marketplace:");
                  const firstPara = section.content.split("\n").find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("-")) ?? "";
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: isExternal ? "rgba(245,158,11,0.04)" : "var(--bg-elevated)", border: `1px solid ${isExternal ? "rgba(245,158,11,0.14)" : "var(--border-default)"}` }}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-bold mt-0.5" style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}>{i + 1}</span>
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: isExternal ? "#F59E0B" : "var(--gray-800)" }}>
                          {isExternal ? section.heading.replace(/^(External Data:|Marketplace:)\s*/, "") : section.heading}
                          {isExternal && <span className="ml-2 font-mono text-[8px]" style={{ color: "#F59E0B" }}>✦ External</span>}
                        </p>
                        {firstPara && <p className="mt-0.5 text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--gray-500)" }}>{firstPara.slice(0, 200)}{firstPara.length > 200 ? "…" : ""}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <Globe size={12} style={{ color: "var(--gray-400)" }} />
              <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>{doc.sources.length} sources · {doc.sections.length} sections · {doc.creditsUsed}cr · {(doc.durationMs / 1000).toFixed(1)}s</p>
              <button onClick={() => setViewMode("full")} className="ml-auto font-mono text-[9px] font-semibold" style={{ color: "var(--accent-400)" }}>Read full report →</button>
            </div>
          </div>
        ) : (
          /* ── FULL MODE ── */
          <>
            <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(14, 165, 233, 0.04)", border: "1px solid rgba(14, 165, 233, 0.10)" }}>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-600)" }}>{doc.summary}</p>
            </div>

            <div className="space-y-6">
              {doc.sections.map((section, i) => {
                const isExternal = section.heading.startsWith("External Data:") || section.heading.startsWith("Marketplace:");
                return isExternal ? (
                  <div key={i} className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.16)" }}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.22)" }}>
                        ✦ External
                      </span>
                      <h3 className="text-[13px] font-semibold" style={{ color: "#F59E0B" }}>
                        {section.heading.replace(/^(External Data:|Marketplace:)\s*/, "")}
                      </h3>
                    </div>
                    <MarkdownContent text={section.content} />
                  </div>
                ) : (
                  <div key={i}>
                    <h3 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>{section.heading}</h3>
                    <MarkdownContent text={section.content} />
                  </div>
                );
              })}
            </div>

            {(doc as ResearchDocument & { uncertainties?: string[] }).uncertainties?.length ? (
              <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.14)" }}>
                <div className="mb-3 flex items-center gap-2">
                  <Brain size={13} style={{ color: "#7C3AED" }} />
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7C3AED" }}>Unresolved uncertainties</p>
                </div>
                <div className="space-y-1.5">
                  {(doc as ResearchDocument & { uncertainties: string[] }).uncertainties.map((u, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: "#7C3AED", opacity: 0.5 }} />
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{u}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                  These claims had limited source support. Verify before acting on them.
                </p>
              </div>
            ) : null}

            <ZeroClickAd query={adQuery ?? doc.query} muted={adsMuted} signals={adSignals} onAdServed={onAdServed} />

            {doc.sources.length > 0 && (
              <div className="mt-8 border-t pt-5" style={{ borderColor: "var(--border-default)" }}>
                <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                  Sources ({doc.sources.length})
                </p>
                <div className="space-y-2">
                  {doc.sources.map((source, i) => {
                    const scored = source as ResearchSource & { overallScore?: number; freshnessLabel?: string };
                    return (
                      <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-black/3">
                        <ExternalLink size={12} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[12px] font-medium" style={{ color: "var(--gray-600)" }}>{source.title}</p>
                            {scored.overallScore !== undefined && (
                              <div className="flex shrink-0 items-center gap-1.5">
                                {scored.freshnessLabel && (
                                  <span className="rounded px-1 py-0.5 font-mono text-[8px]" style={{
                                    background: scored.freshnessLabel === "recent" ? "rgba(34,197,94,0.1)" : scored.freshnessLabel === "stale" ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.1)",
                                    color: scored.freshnessLabel === "recent" ? "#22C55E" : scored.freshnessLabel === "stale" ? "#EF4444" : "#FB923C",
                                  }}>
                                    {scored.freshnessLabel}
                                  </span>
                                )}
                                <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{
                                  background: scored.overallScore >= 7 ? "rgba(34,197,94,0.1)" : scored.overallScore >= 4 ? "rgba(251,146,60,0.1)" : "rgba(239,68,68,0.1)",
                                  color: scored.overallScore >= 7 ? "#22C55E" : scored.overallScore >= 4 ? "#FB923C" : "#EF4444",
                                }}>
                                  {scored.overallScore}/10
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="truncate font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{source.url}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {doc.sections.some((s) => s.heading.startsWith("External Data:") || s.heading.startsWith("Marketplace:")) && (
              <div className="mt-6 flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
                <p className="font-mono text-[10px] leading-snug" style={{ color: "var(--gray-400)" }}>
                  <span style={{ color: "#F59E0B" }}>✦ External data disclosure</span>
                  {" — "}This report includes sections sourced from third-party assets purchased via the Nevermined marketplace.
                  External sections are labeled <span style={{ color: "#F59E0B" }}>✦ External</span> above.
                  For full provenance, see the Provenance tab.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
