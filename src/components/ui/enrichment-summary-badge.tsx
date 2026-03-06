"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ShieldOff, Ban, AlertTriangle, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Coins, Package2, Info
} from "lucide-react";
import type { EnrichmentSummary, ProcurementStatus } from "@/types/pipeline";

// ─── Status display config ────────────────────────────────────────────
const STATUS_CONFIG: Record<ProcurementStatus, {
  label: string;
  sublabel: string;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  border: string;
}> = {
  purchased_and_merged: {
    label: "Buyer-Enriched",
    sublabel: "External data purchased & merged",
    icon: Sparkles,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.22)",
  },
  disabled_in_demo: {
    label: "Demo Mode",
    sublabel: "External procurement disabled in UI",
    icon: ShieldOff,
    color: "#6366F1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.22)",
  },
  disabled_by_policy: {
    label: "Policy Blocked",
    sublabel: "External procurement disabled by policy",
    icon: Ban,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.22)",
  },
  not_needed: {
    label: "Internal Only",
    sublabel: "No external enrichment needed",
    icon: CheckCircle2,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
  },
  attempted_none_purchased: {
    label: "No Assets Found",
    sublabel: "Marketplace searched, nothing suitable",
    icon: XCircle,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
  },
  failed_and_skipped: {
    label: "Procurement Failed",
    sublabel: "External buy failed — internal report delivered",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.18)",
  },
};

interface Props {
  summary: EnrichmentSummary;
  /** Show expanded detail panel on click */
  expandable?: boolean;
  /** Compact pill variant for inline use */
  compact?: boolean;
}

export function EnrichmentSummaryBadge({ summary, expandable = true, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[summary.procurementStatus];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      >
        <Icon size={9} />
        {cfg.label}
      </span>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
    >
      {/* Header row */}
      <button
        onClick={() => expandable && setExpanded((v) => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${expandable ? "cursor-pointer" : "cursor-default"}`}
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.border}` }}
        >
          <Icon size={15} style={{ color: cfg.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            {summary.enrichmentConsidered && summary.procurementStatus !== "purchased_and_merged" && (
              <span
                className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-medium"
                style={{ background: "rgba(245,158,11,0.10)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.18)" }}
              >
                enrichment considered
              </span>
            )}
            {summary.procurementStatus === "purchased_and_merged" && (
              <>
                <span className="font-mono text-[9px]" style={{ color: cfg.color }}>
                  {summary.purchasedAssetCount} asset{summary.purchasedAssetCount !== 1 ? "s" : ""}
                </span>
                {summary.externalCreditsSpent > 0 && (
                  <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                    {summary.externalCreditsSpent}cr external
                  </span>
                )}
              </>
            )}
          </div>
          <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-500)" }}>
            {summary.procurementSkippedReason ?? cfg.sublabel}
          </p>
        </div>

        {expandable && (
          expanded
            ? <ChevronUp size={12} style={{ color: "var(--gray-400)" }} />
            : <ChevronDown size={12} style={{ color: "var(--gray-400)" }} />
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expandable && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="grid grid-cols-2 gap-3 border-t px-4 pb-4 pt-3"
              style={{ borderColor: cfg.border }}
            >
              {/* Enrichment considered */}
              <div className="flex items-start gap-2">
                <Info size={10} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Enrichment considered</p>
                  <p className="text-[11px] font-semibold" style={{ color: summary.enrichmentConsidered ? "#F59E0B" : "var(--gray-600)" }}>
                    {summary.enrichmentConsidered ? "Yes — Seller planned external buy" : "No — not needed for this request"}
                  </p>
                </div>
              </div>

              {/* External data used */}
              <div className="flex items-start gap-2">
                <Sparkles size={10} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>External data used</p>
                  <p className="text-[11px] font-semibold" style={{ color: summary.externalDataUsed ? "#22C55E" : "var(--gray-600)" }}>
                    {summary.externalDataUsed ? "Yes — merged into report" : "No"}
                  </p>
                </div>
              </div>

              {/* Purchased assets */}
              {summary.purchasedAssetCount > 0 && (
                <div className="col-span-2 flex items-start gap-2">
                  <Package2 size={10} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Purchased assets</p>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      {summary.purchasedAssetNames.map((name, i) => (
                        <span
                          key={i}
                          className="rounded-md px-2 py-0.5 text-[10px]"
                          style={{ background: "rgba(245,158,11,0.10)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.20)" }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Providers */}
              {summary.externalProviders.length > 0 && (
                <div className="flex items-start gap-2">
                  <Coins size={10} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>External providers</p>
                    <p className="text-[11px]" style={{ color: "var(--gray-600)" }}>
                      {summary.externalProviders.join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* External credits */}
              {summary.externalCreditsSpent > 0 && (
                <div className="flex items-start gap-2">
                  <Coins size={10} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>External credits spent</p>
                    <p className="text-[11px] font-semibold" style={{ color: "#F59E0B" }}>
                      {summary.externalCreditsSpent}cr
                    </p>
                  </div>
                </div>
              )}

              {/* Demo mode callout */}
              {summary.procurementStatus === "disabled_in_demo" && (
                <div
                  className="col-span-2 rounded-lg p-3"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}
                >
                  <div className="flex items-start gap-2">
                    <ShieldOff size={11} className="mt-0.5 shrink-0" style={{ color: "#6366F1" }} />
                    <p className="text-[10px] leading-relaxed" style={{ color: "#6366F1" }}>
                      <span className="font-semibold">Demo Mode Active</span> — External Marketplace is OFF in settings.
                      The Seller evaluated that third-party enrichment would improve this output, but no real transactions occurred.
                      Turn on <span className="font-mono">External Marketplace</span> in Settings for live agentic procurement.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
