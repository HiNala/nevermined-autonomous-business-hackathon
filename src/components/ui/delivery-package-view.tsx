"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageCheck, CheckCircle2, XCircle, FileText, FileJson,
  AlignLeft, BookOpen, ChevronDown, ChevronUp, Clock, Hash,
  BookMarked, Sparkles, AlertTriangle, Copy, Check
} from "lucide-react";
import type { DeliveryPackage } from "@/lib/agent/seller";
import type { EnrichmentSummary } from "@/types/pipeline";
import { EnrichmentSummaryBadge } from "@/components/ui/enrichment-summary-badge";

const FORMAT_ICONS: Record<string, typeof FileText> = {
  markdown: FileText,
  json: FileJson,
  summary: AlignLeft,
  full_report: BookOpen,
};

const FORMAT_LABELS: Record<string, string> = {
  markdown: "Markdown",
  json: "JSON",
  summary: "Summary",
  full_report: "Full Report",
};

function QualityGateDisplay({ gate }: { gate: DeliveryPackage["qualityGate"] }) {
  const [expanded, setExpanded] = useState(false);
  const passCount = gate.checks.filter((c) => c.passed).length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${gate.passed ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        background: gate.passed ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
      }}
    >
      {/* Gate header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: gate.passed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}
        >
          {gate.passed ? (
            <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
          ) : (
            <AlertTriangle size={14} style={{ color: "#EF4444" }} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold" style={{ color: gate.passed ? "#22C55E" : "#EF4444" }}>
              Quality Gate {gate.passed ? "Passed" : "Failed"}
            </span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
              style={{
                background: gate.passed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                color: gate.passed ? "#22C55E" : "#EF4444",
              }}
            >
              {passCount}/{gate.checks.length} checks
            </span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
              style={{ background: "rgba(201,125,78,0.10)", color: "var(--accent-400)" }}
            >
              score: {gate.score}/100
            </span>
          </div>
          {gate.blockedReason && (
            <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-500)" }}>{gate.blockedReason}</p>
          )}
        </div>
        {expanded ? <ChevronUp size={12} style={{ color: "var(--gray-400)" }} /> : <ChevronDown size={12} style={{ color: "var(--gray-400)" }} />}
      </button>

      {/* Check details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5 border-t" style={{ borderColor: gate.passed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}>
              <p className="pt-3 font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Check results</p>
              {gate.checks.map((check, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {check.passed ? (
                    <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color: "#22C55E" }} />
                  ) : (
                    <XCircle size={11} className="mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
                  )}
                  <div>
                    <span className="text-[11px] font-medium" style={{ color: "var(--gray-700)" }}>{check.name}</span>
                    <span className="ml-2 text-[10px]" style={{ color: "var(--gray-400)" }}>{check.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VariantTab({
  variant,
  isActive,
  onClick,
}: {
  variant: DeliveryPackage["variants"][0];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = FORMAT_ICONS[variant.format] ?? FileText;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all"
      style={{
        background: isActive ? "rgba(201,125,78,0.10)" : "var(--bg-elevated)",
        color: isActive ? "var(--accent-400)" : "var(--gray-500)",
        border: `1px solid ${isActive ? "rgba(201,125,78,0.25)" : "var(--border-default)"}`,
      }}
    >
      <Icon size={11} />
      {FORMAT_LABELS[variant.format] ?? variant.label}
      <span className="font-mono text-[8px] opacity-60">{variant.sizeHint}</span>
    </button>
  );
}

export function DeliveryPackageView({ pkg, enrichmentSummary }: { pkg: DeliveryPackage; enrichmentSummary?: EnrichmentSummary }) {
  const [activeVariant, setActiveVariant] = useState(pkg.primaryVariant);
  const [copied, setCopied] = useState(false);

  const currentVariant = pkg.variants.find((v) => v.format === activeVariant) ?? pkg.variants[0];

  function handleCopy() {
    if (!currentVariant) return;
    navigator.clipboard.writeText(currentVariant.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      {/* Header — premium delivery feel */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(201,125,78,0.04) 100%)",
          border: "1px solid rgba(239,68,68,0.18)",
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.60), transparent)" }} />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}
            >
              <PackageCheck size={20} style={{ color: "#EF4444" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold" style={{ color: "var(--gray-900)" }}>
                  {pkg.productName}
                </h3>
                {pkg.enriched && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[8px] font-semibold uppercase"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.20)" }}
                  >
                    <Sparkles size={7} />
                    Buyer-enriched
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                Order {pkg.orderId} · Delivered by Seller
              </p>
            </div>
          </div>

          {/* Meta stats */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="font-mono text-[10px] font-semibold" style={{ color: "var(--gray-600)" }}>{pkg.creditsCharged}cr</p>
              <p className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>charged</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] font-semibold" style={{ color: "var(--gray-600)" }}>{(pkg.durationMs / 1000).toFixed(1)}s</p>
              <p className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>duration</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 border-t pt-4" style={{ borderColor: "rgba(239,68,68,0.12)" }}>
          <div className="flex items-center gap-1.5">
            <Hash size={10} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-600)" }}>{pkg.wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookMarked size={10} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-600)" }}>{pkg.sectionCount} sections</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={10} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-600)" }}>{pkg.sourceCount} sources</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Clock size={10} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {new Date(pkg.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quality Gate */}
      <QualityGateDisplay gate={pkg.qualityGate} />

      {/* Enrichment Summary */}
      {enrichmentSummary && (
        <EnrichmentSummaryBadge summary={enrichmentSummary} expandable={true} />
      )}

      {/* Delivery variants */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
            Delivery variants
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[9px] transition-all hover:opacity-80"
            style={{ background: "var(--bg-elevated)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}
          >
            {copied ? <Check size={9} style={{ color: "#22C55E" }} /> : <Copy size={9} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Variant tabs */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {pkg.variants.map((v) => (
            <VariantTab
              key={v.format}
              variant={v}
              isActive={activeVariant === v.format}
              onClick={() => setActiveVariant(v.format)}
            />
          ))}
        </div>

        {/* Content preview */}
        <AnimatePresence mode="wait">
          {currentVariant && (
            <motion.div
              key={activeVariant}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              {currentVariant.format === "json" ? (
                <pre className="overflow-x-auto text-[10px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
                  {(() => {
                    try { return JSON.stringify(JSON.parse(currentVariant.content), null, 2); }
                    catch { return currentVariant.content; }
                  })()}
                </pre>
              ) : (
                <div
                  className="prose prose-sm max-w-none text-[12px] leading-relaxed"
                  style={{ color: "var(--gray-600)" }}
                >
                  {currentVariant.content.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h2 key={i} className="text-[13px] font-bold mt-3 mb-1" style={{ color: "var(--gray-800)" }}>{line.slice(3)}</h2>;
                    if (line.startsWith("# ")) return <h1 key={i} className="text-[15px] font-bold mt-4 mb-2" style={{ color: "var(--gray-900)" }}>{line.slice(2)}</h1>;
                    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold" style={{ color: "var(--gray-800)" }}>{line.slice(2, -2)}</p>;
                    if (line.startsWith("- ")) return <p key={i} className="pl-3" style={{ color: "var(--gray-600)" }}>• {line.slice(2)}</p>;
                    if (line === "") return <div key={i} className="h-1.5" />;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
