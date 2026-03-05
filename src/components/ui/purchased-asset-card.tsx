"use client";

import { useState } from "react";
import {
  FileText,
  Database,
  Cpu,
  Globe,
  Package,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Zap,
} from "lucide-react";

interface PurchasedAsset {
  id: string;
  did: string;
  name: string;
  description: string;
  provider: string;
  type: "dataset" | "report" | "model" | "service" | "other";
  content: string;
  contentType: "text" | "json" | "markdown" | "html" | "binary";
  creditsPaid: number;
  purchasedAt: string;
  durationMs: number;
  status: "success" | "failed";
  error?: string;
}

const TYPE_CONFIG: Record<
  PurchasedAsset["type"],
  { icon: typeof FileText; color: string; bg: string; border: string; label: string }
> = {
  report: {
    icon: FileText,
    color: "#22C55E",
    bg: "rgba(34, 197, 94, 0.08)",
    border: "rgba(34, 197, 94, 0.20)",
    label: "Report",
  },
  dataset: {
    icon: Database,
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.20)",
    label: "Dataset",
  },
  model: {
    icon: Cpu,
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.08)",
    border: "rgba(139, 92, 246, 0.20)",
    label: "Model",
  },
  service: {
    icon: Globe,
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.20)",
    label: "Service",
  },
  other: {
    icon: Package,
    color: "#6B7280",
    bg: "rgba(107, 114, 128, 0.08)",
    border: "rgba(107, 114, 128, 0.20)",
    label: "Asset",
  },
};

export function PurchasedAssetCard({ asset }: { asset: PurchasedAsset }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = TYPE_CONFIG[asset.type] ?? TYPE_CONFIG.other;
  const Icon = config.icon;

  function handleCopy() {
    navigator.clipboard.writeText(asset.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isFailed = asset.status === "failed";
  const previewText = asset.content.slice(0, 200);

  return (
    <div
      className="rounded-xl transition-all"
      style={{
        background: isFailed ? "rgba(239, 68, 68, 0.04)" : config.bg,
        border: `1px solid ${isFailed ? "rgba(239, 68, 68, 0.20)" : config.border}`,
      }}
    >
      {/* Header — always visible, Claude-style file card look */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Icon */}
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: isFailed ? "rgba(239, 68, 68, 0.10)" : config.bg,
            border: `1px solid ${isFailed ? "rgba(239, 68, 68, 0.25)" : config.border}`,
          }}
        >
          <Icon size={16} style={{ color: isFailed ? "#EF4444" : config.color }} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate text-[13px] font-semibold"
              style={{ color: "var(--gray-700)" }}
            >
              {asset.name}
            </span>
            <span
              className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase"
              style={{
                background: isFailed ? "rgba(239, 68, 68, 0.10)" : config.bg,
                color: isFailed ? "#EF4444" : config.color,
                border: `1px solid ${isFailed ? "rgba(239, 68, 68, 0.20)" : config.border}`,
              }}
            >
              {isFailed ? "Failed" : config.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="text-[11px]" style={{ color: "var(--gray-400)" }}>
              {asset.provider}
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--gray-400)" }}>
              <Zap size={9} /> {asset.creditsPaid}cr
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--gray-400)" }}>
              <Clock size={9} /> {(asset.durationMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div style={{ color: "var(--gray-400)" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Preview (collapsed) */}
      {!expanded && asset.content && !isFailed && (
        <div className="px-4 pb-3">
          <p
            className="line-clamp-2 text-[11px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
          >
            {previewText}
            {asset.content.length > 200 && "…"}
          </p>
        </div>
      )}

      {/* Error message (for failed) */}
      {isFailed && asset.error && (
        <div className="px-4 pb-3">
          <p className="text-[11px]" style={{ color: "#EF4444" }}>
            {asset.error}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && asset.content && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: isFailed ? "rgba(239, 68, 68, 0.15)" : config.border }}
        >
          {/* Actions */}
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-default)",
                color: copied ? "#22C55E" : "var(--gray-400)",
              }}
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? "Copied" : "Copy"}
            </button>
            {asset.did && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--gray-400)" }}>
                <ExternalLink size={9} />
                <span className="font-mono">{asset.did.slice(0, 20)}…</span>
              </span>
            )}
          </div>

          {/* Content */}
          <div
            className="max-h-[300px] overflow-y-auto rounded-lg p-3 font-mono text-[11px] leading-relaxed"
            style={{
              background: "rgba(0,0,0,0.15)",
              color: "var(--gray-600)",
              whiteSpace: asset.contentType === "json" ? "pre" : "pre-wrap",
            }}
          >
            {asset.content}
          </div>
        </div>
      )}
    </div>
  );
}

/** Grid of purchased asset cards. */
export function PurchasedAssetGrid({ assets }: { assets: PurchasedAsset[] }) {
  if (assets.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package size={13} style={{ color: "#F59E0B" }} />
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#F59E0B" }}
        >
          Marketplace Purchases ({assets.length})
        </span>
      </div>
      <div className="grid gap-2">
        {assets.map((asset) => (
          <PurchasedAssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}
