"use client";

import { ShoppingCart, TrendingUp, DollarSign, Star, AlertOctagon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface PurchaseRationale {
  assetId: string;
  assetName: string;
  gapFilled: string;
  whyWorthIt: string;
  expectedImprovement: string;
  priceValueScore: number;
}

export interface RankedAsset {
  asset: { did: string; name: string; description: string; provider: string; price: { credits: number }; type: string };
  relevanceScore: number;
  priceValueScore: number;
  informationGainScore: number;
  compositeScore: number;
  rankReason: string;
}

export interface RequiresApproval {
  assets: RankedAsset["asset"][];
  totalCost: number;
  reason: string;
}

interface Props {
  rankedCandidates?: RankedAsset[];
  rationales?: PurchaseRationale[];
  requiresApproval?: RequiresApproval;
  totalCreditsSpent?: number;
}

export function BuyerRationalePanel({ rankedCandidates = [], rationales = [], requiresApproval, totalCreditsSpent = 0 }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasContent = rankedCandidates.length > 0 || rationales.length > 0 || requiresApproval;
  if (!hasContent) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--bg-elevated)", borderColor: requiresApproval ? "rgba(251,191,36,0.3)" : "var(--border-default)" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{
              background: requiresApproval ? "rgba(251,191,36,0.1)" : rationales.length > 0 ? "rgba(34,197,94,0.1)" : "var(--glass-bg)",
              border: `1px solid ${requiresApproval ? "rgba(251,191,36,0.3)" : rationales.length > 0 ? "rgba(34,197,94,0.3)" : "var(--border-default)"}`,
            }}
          >
            {requiresApproval
              ? <AlertOctagon size={13} style={{ color: "#FBBF24" }} />
              : <ShoppingCart size={13} style={{ color: rationales.length > 0 ? "#22C55E" : "var(--gray-400)" }} />
            }
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
                Buyer Intelligence
              </span>
              {requiresApproval && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                  Approval Needed
                </span>
              )}
              {!requiresApproval && rationales.length > 0 && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                  {rationales.length} purchased · {totalCreditsSpent}cr
                </span>
              )}
            </div>
            <p className="text-[9px]" style={{ color: "var(--gray-400)" }}>
              {rankedCandidates.length} candidates ranked · {requiresApproval ? "awaiting approval" : `${rationales.length} purchased`}
            </p>
          </div>
        </div>
        <div style={{ color: "var(--gray-400)" }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3.5 pb-3.5 pt-3 space-y-3" style={{ borderColor: "var(--border-default)" }}>

          {/* Approval warning */}
          {requiresApproval && (
            <div className="rounded-xl border p-3" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.25)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertOctagon size={12} style={{ color: "#FBBF24" }} />
                <span className="text-[11px] font-semibold" style={{ color: "#FBBF24" }}>Approval Required</span>
              </div>
              <p className="text-[9px] mb-2" style={{ color: "#FDE68A" }}>{requiresApproval.reason}</p>
              <div className="flex flex-wrap gap-1.5">
                {requiresApproval.assets.map((a) => (
                  <div key={a.did} className="rounded-lg px-2 py-1" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <p className="text-[9px] font-semibold" style={{ color: "#FBBF24" }}>{a.name}</p>
                    <p className="text-[8px]" style={{ color: "#FDE68A" }}>{a.price.credits}cr · {a.provider}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranked candidates */}
          {rankedCandidates.length > 0 && (
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                Ranked Candidates ({rankedCandidates.length})
              </p>
              <div className="space-y-1.5">
                {rankedCandidates.slice(0, 5).map((r, i) => (
                  <div
                    key={r.asset.did || i}
                    className="flex items-start gap-2 rounded-lg px-2.5 py-2"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    {/* Rank badge */}
                    <div
                      className="flex size-5 shrink-0 items-center justify-center rounded font-bold text-[9px]"
                      style={{
                        background: i === 0 ? "rgba(251,191,36,0.15)" : "var(--glass-bg)",
                        color: i === 0 ? "#FBBF24" : "var(--gray-500)",
                        border: `1px solid ${i === 0 ? "rgba(251,191,36,0.3)" : "var(--border-default)"}`,
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[10px] font-semibold" style={{ color: "var(--gray-800)" }}>{r.asset.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={8} style={{ color: "#FBBF24" }} />
                          <span className="font-mono text-[9px] font-bold" style={{ color: "var(--gray-700)" }}>{r.compositeScore}/10</span>
                        </div>
                      </div>
                      <p className="mt-0.5 text-[8px]" style={{ color: "var(--gray-400)" }}>{r.rankReason}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded px-1 py-0.5 text-[7px] uppercase font-medium" style={{ background: "var(--glass-bg)", color: "var(--gray-500)" }}>{r.asset.type}</span>
                        <span className="text-[8px] font-medium" style={{ color: "#22C55E" }}>{r.asset.price.credits}cr</span>
                        <span className="text-[8px]" style={{ color: "var(--gray-400)" }}>{r.asset.provider}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase rationales */}
          {rationales.length > 0 && (
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                Purchase Rationale
              </p>
              <div className="space-y-1.5">
                {rationales.map((r) => (
                  <div
                    key={r.assetId}
                    className="rounded-lg p-2.5 space-y-1"
                    style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold" style={{ color: "#22C55E" }}>{r.assetName}</span>
                      <div className="flex items-center gap-1">
                        <DollarSign size={8} style={{ color: "#22C55E" }} />
                        <span className="text-[9px] font-bold" style={{ color: "#22C55E" }}>{r.priceValueScore}/10 value</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      <div className="flex items-start gap-1">
                        <span className="shrink-0 text-[8px] font-bold uppercase" style={{ color: "var(--gray-500)" }}>Gap:</span>
                        <span className="text-[9px]" style={{ color: "var(--gray-600)" }}>{r.gapFilled}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="shrink-0 text-[8px] font-bold uppercase" style={{ color: "var(--gray-500)" }}>Why:</span>
                        <span className="text-[9px]" style={{ color: "var(--gray-600)" }}>{r.whyWorthIt}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <TrendingUp size={8} className="mt-0.5 shrink-0" style={{ color: "#22C55E" }} />
                        <span className="text-[9px]" style={{ color: "var(--gray-600)" }}>{r.expectedImprovement}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
