"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Nav } from "@/components/layout/nav";
import {
  Send,
  FileText,
  Globe,
  Clock,
  Zap,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Bot,
  Sparkles,
  Search,
  LayoutList,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2,
  VolumeX,
  Package,
  Settings,
  Download,
  Award,
  ChevronDown,
  CreditCard,
  GitBranch,
  PackageCheck,
  Brain,
  PenLine,
  ShoppingBag,
  ShoppingCart,
  BookOpen,
  Building2,
  MessageSquare,
  ImageIcon,
} from "lucide-react";
import { ZeroClickAd, type ZeroClickSignal } from "@/components/ui/zeroclick-ad";
import { SettingsPanel } from "@/components/ui/settings-panel";
import { loadToolSettings, saveToolSettings, type ToolSettings } from "@/lib/tool-settings";
import { PurchasedAssetGrid } from "@/components/ui/purchased-asset-card";
import { SponsorRail } from "@/components/ui/sponsor-rail";
import { JudgeMode, type JudgePreset } from "@/components/ui/judge-mode";
import { VGSCheckoutModal } from "@/components/ui/vgs-checkout-modal";
import { WorkspaceProfilePanel } from "@/components/ui/workspace-profile-panel";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { BriefScoreCard } from "@/components/ui/brief-score-card";
import { BuyerRationalePanel } from "@/components/ui/buyer-rationale-panel";
import { ProvenanceBlockCard } from "@/components/ui/provenance-block";
import { DeliveryPackageView } from "@/components/ui/delivery-package-view";
import { EnrichmentSummaryBadge } from "@/components/ui/enrichment-summary-badge";
import { ClarificationDialog } from "@/components/ui/clarification-dialog";
import { ArtifactLibrary, saveArtifact, type ArtifactEntry } from "@/components/ui/artifact-library";
import { BuyerApprovalModal } from "@/components/ui/buyer-approval-modal";
import { ActionPanel, type ActionIntelligence } from "@/components/ui/action-panel";
import { FollowUpAssistant } from "@/components/ui/followup-assistant";
import { SmartSuggestions, type InputSuggestion } from "@/components/ui/smart-suggestions";
import type { BriefRouting } from "@/lib/agent/strategist";
import type { MarketplaceAsset } from "@/lib/agent/buyer";
import type { ResearchConfidence, ProvenanceInfo, EnrichmentSummary } from "@/types/pipeline";
import type {
  ResearchSource,
  ResearchDocument,
  StructuredBrief,
  AgentTransaction,
  PipelineEvent,
  PurchasedAsset,
  PipelineResult,
  SponsorToolUsage,
} from "@/types/pipeline";
import { AGENT_CONFIG } from "@/lib/agent/config";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";
type OutputType = "research" | "prd" | "plan" | "analysis" | "general";

const OUTPUT_TYPES: { value: OutputType; label: string; icon: typeof FileText }[] = [
  { value: "research", label: "Research Report", icon: Search },
  { value: "prd", label: "PRD", icon: FileText },
  { value: "plan", label: "Strategic Plan", icon: LayoutList },
  { value: "analysis", label: "Analysis", icon: Sparkles },
  { value: "general", label: "General", icon: Globe },
];

// ─── Transaction stream hook ────────────────────────────────────────
function useTransactionStream() {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/pipeline/transactions");
    es.onmessage = (e) => {
      try {
        const tx = JSON.parse(e.data) as AgentTransaction;
        setTransactions((prev) => [...prev.slice(-49), tx]);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  return transactions;
}

// ─── Tool provider badge colors ─────────────────────────────────────
const TOOL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  apify: { label: "Apify", color: "#00BFA5", bg: "rgba(0,191,165,0.12)" },
  exa: { label: "Exa", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  duckduckgo: { label: "DDG", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  raw: { label: "Raw", color: "var(--gray-500)", bg: "var(--glass-bg)" },
  nevermined: { label: "NVM", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  nanobanana: { label: "NanoBanana", color: "#CA8A04", bg: "rgba(234,179,8,0.12)" },
};

// ─── Agent Card ─────────────────────────────────────────────────────
function AgentCard({
  agent,
  isActive,
  isSelected,
  onClick,
  stats,
  toolLabel,
  index = 0,
}: {
  agent: typeof AGENT_CONFIG.strategist;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  stats: { earned: number; handled: number };
  toolLabel?: string;
  index?: number;
}) {
  const badge = toolLabel ? TOOL_BADGE[toolLabel] : null;

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${isActive ? "animate-breathe" : ""}`}
      style={{
        background: isSelected ? agent.bgColor : "var(--bg-elevated)",
        border: `1px solid ${isSelected ? agent.borderColor : "var(--border-default)"}`,
        "--breathe-color": agent.color + "30",
        animationDelay: `${index * 100}ms`,
      } as React.CSSProperties}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300"
        style={{
          background: isActive || isSelected ? agent.color : "transparent",
          opacity: isActive ? 1 : isSelected ? 0.5 : 0,
        }}
      />

      {/* Avatar */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-transform duration-200 group-hover:scale-105"
        style={{ background: agent.bgColor, color: agent.color }}
      >
        {agent.avatar}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: "var(--gray-800)" }}>
            {agent.name}
          </span>
          {badge && (
            <span
              className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-400)" }}>
          {agent.role}
        </p>
      </div>

      {/* Right status */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {isActive ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-50" style={{ background: agent.color }} />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ background: agent.color }} />
            </span>
            <span className="font-mono text-[9px] font-semibold" style={{ color: agent.color }}>working</span>
          </span>
        ) : (
          <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>{stats.handled}t</span>
        )}
      </div>
    </button>
  );
}

// ─── Animated Connector ─────────────────────────────────────────────
function AgentConnector({ isActive, color }: { isActive: boolean; color: string }) {
  return (
    <div className="relative flex items-center justify-center py-0.5">
      <div className="relative h-5 w-px" style={{ background: "var(--border-default)" }}>
        {isActive && (
          <div
            className="absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full animate-flow-down"
            style={{ background: color }}
          />
        )}
      </div>
      <ChevronDown
        size={10}
        className="absolute -bottom-1"
        style={{ color: isActive ? color : "var(--gray-300)" }}
      />
    </div>
  );
}

// ─── Sponsor badge helpers for pipeline stages ──────────────────────
const STAGE_SPONSOR_HINTS: Record<string, { label: string; color: string; bg: string }> = {
  researcher_working: { label: "Web Search", color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
  buyer_discovering: { label: "Nevermined", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  buyer_purchasing: { label: "NVM x402", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  seller_received: { label: "NVM x402", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
  seller_planning: { label: "Nevermined", color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
};

function inferSponsorBadge(msg: string): { label: string; color: string; bg: string } | null {
  const m = msg.toLowerCase();
  if (m.includes("apify")) return { label: "Apify", color: "#00BFA5", bg: "rgba(0,191,165,0.10)" };
  if (m.includes("exa")) return { label: "Exa", color: "#6366F1", bg: "rgba(99,102,241,0.10)" };
  if (m.includes("marketplace") || m.includes("purchase") || m.includes("x402")) return { label: "Nevermined", color: "#22C55E", bg: "rgba(34,197,94,0.10)" };
  if (m.includes("zeroclick") || m.includes("ad")) return { label: "ZeroClick", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" };
  return null;
}

// ─── Job Lifecycle State Machine ────────────────────────────────────
const JOB_STAGES = [
  {
    id: "intake",
    label: "Intake",
    agent: "Seller",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.20)",
    matchStages: ["seller_received", "seller_planning"],
    completeStages: ["strategist_working", "strategist_complete", "researcher_working", "researcher_buying",
      "researcher_evaluating", "researcher_followup", "buyer_discovering", "buyer_purchasing",
      "buyer_complete", "seller_fulfilling", "seller_complete", "complete"],
  },
  {
    id: "interpreting",
    label: "Interpreting",
    agent: "Interpreter",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.20)",
    matchStages: ["strategist_working"],
    completeStages: ["strategist_complete", "researcher_working", "researcher_buying",
      "researcher_evaluating", "researcher_followup", "buyer_discovering", "buyer_purchasing",
      "buyer_complete", "seller_fulfilling", "seller_complete", "complete"],
  },
  {
    id: "composing",
    label: "Composing",
    agent: "Composer",
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.08)",
    border: "rgba(14,165,233,0.20)",
    matchStages: ["strategist_complete", "researcher_buying", "researcher_working", "researcher_evaluating", "researcher_followup"],
    completeStages: ["buyer_discovering", "buyer_purchasing", "buyer_complete", "seller_fulfilling", "seller_complete", "complete"],
  },
  {
    id: "enriching",
    label: "Enriching",
    agent: "Buyer",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.20)",
    matchStages: ["buyer_discovering", "buyer_purchasing"],
    completeStages: ["buyer_complete", "seller_fulfilling", "seller_complete", "complete"],
    optional: true,
  },
  {
    id: "packaging",
    label: "Packaging",
    agent: "Seller",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.20)",
    matchStages: ["seller_fulfilling"],
    completeStages: ["seller_complete", "complete"],
  },
];

type StageStatus = "idle" | "active" | "complete" | "skipped";

function getStageStatus(stageId: string, events: PipelineEvent[], isRunning: boolean): StageStatus {
  const stage = JOB_STAGES.find((s) => s.id === stageId);
  if (!stage) return "idle";

  const allStages = events.map((e) => e.stage as string);
  const hasComplete = stage.completeStages.some((cs) => allStages.includes(cs));
  const hasActive = stage.matchStages.some((ms) => allStages.includes(ms));

  if (hasComplete) return "complete";
  if (hasActive && isRunning) return "active";
  if (hasActive && !isRunning) return "complete";
  return "idle";
}

function JobStateMachine({ events, isRunning }: { events: PipelineEvent[]; isRunning: boolean }) {
  const isDone = !isRunning && events.some((e) => e.stage === "complete");
  const hasError = events.some((e) => e.stage === "error");
  const buyerUsed = events.some((e) => ["buyer_discovering", "buyer_purchasing", "buyer_complete"].includes(e.stage));

  return (
    <div className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
          Job Lifecycle
        </span>
        {isDone && (
          <span className="flex items-center gap-1 font-mono text-[8px] font-semibold" style={{ color: "#22C55E" }}>
            <span className="size-1.5 rounded-full" style={{ background: "#22C55E", display: "inline-block" }} />
            delivered
          </span>
        )}
        {hasError && (
          <span className="flex items-center gap-1 font-mono text-[8px] font-semibold" style={{ color: "#EF4444" }}>
            <span className="size-1.5 rounded-full" style={{ background: "#EF4444", display: "inline-block" }} />
            error
          </span>
        )}
        {isRunning && (
          <span className="flex items-center gap-1 font-mono text-[8px] font-semibold" style={{ color: "var(--accent-400)" }}>
            <Loader2 size={8} className="animate-spin" />
            running
          </span>
        )}
      </div>

      {/* Stage nodes */}
      <div className="flex flex-col gap-0">
        {JOB_STAGES.map((stage, i) => {
          const status = getStageStatus(stage.id, events, isRunning);
          const isOptionalSkipped = stage.optional && status === "idle" && !buyerUsed && (isDone || isRunning);

          return (
            <div key={stage.id}>
              {/* Stage row */}
              <div
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-300"
                style={{
                  background: status === "active" ? stage.bg : status === "complete" ? `${stage.color}05` : "transparent",
                  border: `1px solid ${status === "active" ? stage.border : status === "complete" ? `${stage.color}10` : "transparent"}`,
                  opacity: isOptionalSkipped ? 0.35 : 1,
                }}
              >
                {/* Status indicator */}
                <div className="relative flex shrink-0 items-center justify-center">
                  {status === "active" ? (
                    <span className="relative flex size-3">
                      <span
                        className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                        style={{ background: stage.color }}
                      />
                      <span
                        className="relative inline-flex size-3 rounded-full"
                        style={{ background: stage.color }}
                      />
                    </span>
                  ) : status === "complete" ? (
                    <span className="size-3 rounded-full flex items-center justify-center" style={{ background: stage.color }}>
                      <Check size={7} color="white" />
                    </span>
                  ) : (
                    <span
                      className="size-3 rounded-full"
                      style={{ background: "var(--border-default)" }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span
                    className="text-[11px] font-semibold"
                    style={{
                      color: status === "active" ? stage.color : status === "complete" ? "var(--gray-700)" : "var(--gray-400)",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span
                    className="font-mono text-[8px]"
                    style={{ color: status === "active" ? stage.color : "var(--gray-400)", opacity: 0.8 }}
                  >
                    {stage.agent}
                  </span>
                  {stage.optional && (
                    <span className="font-mono text-[7px]" style={{ color: "var(--gray-400)" }}>opt</span>
                  )}
                </div>

                {/* Status badge */}
                {status === "active" && (
                  <span className="font-mono text-[8px] font-semibold" style={{ color: stage.color }}>
                    working…
                  </span>
                )}
                {status === "complete" && (
                  <span className="font-mono text-[8px]" style={{ color: "#22C55E" }}>done</span>
                )}
                {isOptionalSkipped && (
                  <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>skipped</span>
                )}
              </div>

              {/* Connector line between stages */}
              {i < JOB_STAGES.length - 1 && (
                <div className="ml-[18px] h-3 w-px" style={{ background: "var(--border-default)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pipeline Stage Indicator ───────────────────────────────────────
function PipelineStages({ events, isRunning }: { events: PipelineEvent[]; isRunning: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const stageColors: Record<string, string> = {
    strategist_working: AGENT_CONFIG.strategist.color,
    strategist_complete: AGENT_CONFIG.strategist.color,
    researcher_buying: "#F59E0B",
    researcher_working: AGENT_CONFIG.researcher.color,
    researcher_evaluating: "#F59E0B",
    researcher_followup: "#EF4444",
    buyer_discovering: AGENT_CONFIG.buyer.color,
    buyer_purchasing: AGENT_CONFIG.buyer.color,
    buyer_complete: AGENT_CONFIG.buyer.color,
    seller_received: AGENT_CONFIG.seller.color,
    seller_planning: AGENT_CONFIG.seller.color,
    seller_fulfilling: AGENT_CONFIG.seller.color,
    seller_complete: AGENT_CONFIG.seller.color,
    complete: "var(--green-400)",
    error: "#EF4444",
  };

  if (events.length === 0 && !isRunning) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <JobStateMachine events={[]} isRunning={false} />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-[10px]" style={{ color: "var(--gray-400)" }}>
            Events will stream here as agents work
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* State machine always visible at top */}
      <JobStateMachine events={events} isRunning={isRunning} />

      {/* Divider */}
      <div className="mx-3 border-t" style={{ borderColor: "var(--border-default)" }} />

      {/* Event log below */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        <p className="mb-1.5 font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
          Event log
        </p>
        {events.map((event) => {
          const stageHint = STAGE_SPONSOR_HINTS[event.stage];
          const msgHint = inferSponsorBadge(event.message);
          const badge = msgHint ?? stageHint;

          return (
            <div key={event.id} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-default)" }}>
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full"
                style={{ background: stageColors[event.stage] ?? "var(--gray-400)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded px-1 py-0.5 font-mono text-[8px] font-semibold uppercase"
                    style={{
                      background: AGENT_CONFIG[event.agent as keyof typeof AGENT_CONFIG]?.bgColor ?? "var(--glass-bg)",
                      color: AGENT_CONFIG[event.agent as keyof typeof AGENT_CONFIG]?.color ?? "var(--gray-400)",
                    }}
                  >
                    {event.agent === "strategist" ? "interpreter" : event.agent === "researcher" ? "composer" : event.agent}
                  </span>
                  {badge && (
                    <span
                      className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
                  {event.message}
                </p>
                {/* Procurement payload chips */}
                {((): React.ReactNode => {
                  if (!event.data) return null;
                  const d = event.data as Record<string, unknown>;
                  const status = typeof d.procurementStatus === "string" ? d.procurementStatus : null;
                  const credits = typeof d.externalCreditsSpent === "number" ? d.externalCreditsSpent : null;
                  const names = Array.isArray(d.assetNames) ? (d.assetNames as string[]) : [];
                  if (!status && credits === null && names.length === 0) return null;
                  return (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {status && (
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-wide"
                          style={{
                            background: status === "purchased_and_merged" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.10)",
                            color: status === "purchased_and_merged" ? "#F59E0B" : "#6366F1",
                          }}
                        >
                          {status.replace(/_/g, " ")}
                        </span>
                      )}
                      {credits !== null && credits > 0 && (
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[7px] font-semibold"
                          style={{ background: "rgba(245,158,11,0.10)", color: "#F59E0B" }}
                        >
                          {credits}cr external
                        </span>
                      )}
                      {names.map((name, i) => (
                        <span
                          key={i}
                          className="rounded px-1.5 py-0.5 font-mono text-[7px]"
                          style={{ background: "var(--glass-bg)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}
                        >
                          ✦ {name.length > 30 ? name.slice(0, 30) + "…" : name}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
        {isRunning && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={10} className="animate-spin" style={{ color: "var(--accent-400)" }} />
            <span className="text-[10px]" style={{ color: "var(--accent-400)" }}>Processing…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Transaction Feed ───────────────────────────────────────────────
function TransactionFeed({ transactions }: { transactions: AgentTransaction[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>No transactions yet</p>
      </div>
    );
  }

  const isMarketplace = (tx: AgentTransaction) =>
    tx.to.id === "marketplace" || tx.from.id === "external-buyer" || tx.to.name.startsWith("Marketplace:");
  const isExternal = (tx: AgentTransaction) =>
    tx.from.id === "external-buyer" || tx.to.id === "marketplace";

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2">
      {transactions.map((tx) => {
        const marketplace = isMarketplace(tx);
        const external = isExternal(tx);
        return (
          <div
            key={tx.id}
            className="py-2 border-b"
            style={{
              borderColor: "var(--border-default)",
              background: marketplace ? "rgba(34, 197, 94, 0.02)" : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-semibold" style={{
                color: AGENT_CONFIG[tx.from.id as keyof typeof AGENT_CONFIG]?.color ?? (external ? "#22C55E" : "var(--gray-400)")
              }}>
                {tx.from.name}
              </span>
              <ArrowRight size={10} style={{ color: marketplace ? "#22C55E" : "var(--gray-300)" }} />
              <span className="font-mono text-[9px] font-semibold" style={{
                color: AGENT_CONFIG[tx.to.id as keyof typeof AGENT_CONFIG]?.color ?? (marketplace ? "#22C55E" : "var(--green-400)")
              }}>
                {tx.to.name}
              </span>
              {marketplace && (
                <span
                  className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
                  style={{ background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", border: "1px solid rgba(34, 197, 94, 0.22)" }}
                >
                  NVM x402
                </span>
              )}
              <span className="ml-auto font-mono text-[9px] font-bold" style={{ color: marketplace ? "#22C55E" : "var(--green-400)" }}>
                {tx.credits}cr
              </span>
              <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                {new Date(tx.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              {tx.purpose && (
                <p className="truncate text-[10px]" style={{ color: "var(--gray-400)" }}>
                  {tx.purpose}
                </p>
              )}
              {tx.status === "completed" && marketplace && (
                <span className="shrink-0 font-mono text-[7px]" style={{ color: "#22C55E" }}>
                  ✓ settled
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Brief View ─────────────────────────────────────────────────────
function BriefView({ brief, adsMuted, onAdServed }: { brief: StructuredBrief; adsMuted: boolean; onAdServed?: () => void }) {
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
        <h3 className="mt-1 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>
          {brief.title}
        </h3>
      </div>

      <div className="rounded-lg p-3" style={{ background: "rgba(124, 58, 237, 0.04)", border: "1px solid rgba(124, 58, 237, 0.10)" }}>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
          {brief.objective}
        </p>
      </div>

      {brief.score && (
        <BriefScoreCard
          score={brief.score}
          routing={brief.routing}
          workspaceApplied={brief.workspaceApplied}
        />
      )}

      {/* Routing recommendation chips */}
      {brief.routing && (
        <div
          className="rounded-xl p-3.5"
          style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}
        >
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
              <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}>
                {s}
              </span>
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
              <span key={i} className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "rgba(201, 125, 78, 0.07)", border: "1px solid rgba(201, 125, 78, 0.18)", color: "var(--accent-400)" }}>
                {d}
              </span>
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

// ─── Markdown Renderer ─────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--gray-700)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline-offset-2 underline" style={{ color: "var(--accent-400)" }}>{linkMatch[1]}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${key++}`} className="my-2 space-y-1.5 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.55 }} />
            <span>{parseInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line) => {
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h5 key={key++} className="mb-1 mt-4 text-[13px] font-semibold" style={{ color: "var(--gray-700)" }}>{line.slice(4)}</h5>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h4 key={key++} className="mb-2 mt-5 text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>{line.slice(3)}</h4>);
    } else if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={key++} className="text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{parseInline(line)}</p>);
    }
  });
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

// ─── Document View ──────────────────────────────────────────────────
function DocumentView({
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
          {/* View mode pills */}
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
            <Download size={12} />
            .md
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
          <div className="mb-5 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-default)" }}>
            <img
              src={visionResult.imageUrl}
              alt={doc.title}
              className="w-full object-cover"
              style={{ maxHeight: "220px" }}
              loading="lazy"
            />
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-default)" }}
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[8px] font-semibold rounded-full px-2 py-0.5"
                style={{
                  background: visionResult.passedQuality ? "rgba(34,197,94,0.10)" : "rgba(234,179,8,0.10)",
                  color: visionResult.passedQuality ? "#22C55E" : "#CA8A04",
                  border: `1px solid ${visionResult.passedQuality ? "rgba(34,197,94,0.22)" : "rgba(234,179,8,0.22)"}`,
                }}
              >
                <ImageIcon size={9} />
                VISION · NanoBanana · {visionResult.attempts} attempt{visionResult.attempts !== 1 ? "s" : ""} · {visionResult.qualityScore}/100
              </span>
              {visionResult.passedQuality && (
                <span className="font-mono text-[8px]" style={{ color: "#22C55E" }}>✓ quality passed</span>
              )}
            </div>
          </div>
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
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.16)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.22)" }}
                  >
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

        {/* Uncertainties / unresolved claims — from researcher confidence */}
        {(doc as ResearchDocument & { uncertainties?: string[] }).uncertainties?.length ? (
          <div
            className="mt-6 rounded-xl p-4"
            style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.14)" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Brain size={13} style={{ color: "#7C3AED" }} />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7C3AED" }}>
                Unresolved uncertainties
              </p>
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
                const scored = source as ResearchSource & { overallScore?: number; freshnessLabel?: string; authorityScore?: number };
                return (
                  <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-black/3">
                    <ExternalLink size={12} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[12px] font-medium" style={{ color: "var(--gray-600)" }}>{source.title}</p>
                        {scored.overallScore !== undefined && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {scored.freshnessLabel && (
                              <span
                                className="rounded px-1 py-0.5 font-mono text-[8px]"
                                style={{
                                  background: scored.freshnessLabel === "recent" ? "rgba(34,197,94,0.1)" : scored.freshnessLabel === "stale" ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.1)",
                                  color: scored.freshnessLabel === "recent" ? "#22C55E" : scored.freshnessLabel === "stale" ? "#EF4444" : "#FB923C",
                                }}
                              >
                                {scored.freshnessLabel}
                              </span>
                            )}
                            <span
                              className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                              style={{
                                background: scored.overallScore >= 7 ? "rgba(34,197,94,0.1)" : scored.overallScore >= 4 ? "rgba(251,146,60,0.1)" : "rgba(239,68,68,0.1)",
                                color: scored.overallScore >= 7 ? "#22C55E" : scored.overallScore >= 4 ? "#FB923C" : "#EF4444",
                              }}
                            >
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

        {/* Output disclosure footer — shown when external data sections are present */}
        {doc.sections.some((s) => s.heading.startsWith("External Data:") || s.heading.startsWith("Marketplace:")) && (
          <div
            className="mt-6 flex items-start gap-2.5 rounded-xl p-3.5"
            style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}
          >
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

function TypingStatusWords({ words, color }: { words: string[]; color: string }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex] ?? "";
    const isWordComplete = charIndex === currentWord.length;
    const isWordCleared = charIndex === 0;

    const delay = isDeleting
      ? 45
      : isWordComplete
      ? 900
      : 85;

    const timer = window.setTimeout(() => {
      if (!isDeleting && !isWordComplete) {
        setCharIndex((value) => value + 1);
        return;
      }

      if (!isDeleting && isWordComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && !isWordCleared) {
        setCharIndex((value) => value - 1);
        return;
      }

      setIsDeleting(false);
      setWordIndex((value) => (value + 1) % words.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex, words]);

  const visibleWord = (words[wordIndex] ?? "").slice(0, charIndex);

  return (
    <div
      className="mb-2 inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{
        color,
        background: `${color}10`,
        border: `1px solid ${color}20`,
      }}
      aria-live="polite"
    >
      <span>{visibleWord || "\u00A0"}</span>
      <span
        className="ml-1 inline-block h-3 w-px animate-pulse"
        style={{ background: color }}
        aria-hidden="true"
      />
    </div>
  );
}

function LoadingPulseDots({ color }: { color: string }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full animate-pulse"
          style={{
            background: color,
            opacity: 0.35 + index * 0.18,
            animationDelay: `${index * 180}ms`,
          }}
        />
      ))}
    </div>
  );
}

function LoadingMicroHint({ hints, color }: { hints: string[]; color: string }) {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    if (hints.length <= 1) return;

    const timer = window.setInterval(() => {
      setHintIndex((value) => (value + 1) % hints.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [hints]);

  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-[10px]">
      <span
        className="rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.18em]"
        style={{
          color,
          background: `${color}08`,
          border: `1px solid ${color}18`,
        }}
      >
        live
      </span>
      <span className="transition-opacity duration-300" style={{ color: "var(--gray-400)" }}>
        {hints[hintIndex]}
      </span>
    </div>
  );
}

function getLoadingWords(mode: ViewMode, stage?: string, agent?: string) {
  if (mode === "seller" || agent === "seller") {
    if (stage === "seller_received") return ["receive", "route", "deliver"];
    if (stage === "seller_planning") return ["match", "price", "plan"];
    if (stage === "seller_fulfilling") return ["dispatch", "merge", "deliver"];
    return ["route", "package", "deliver"];
  }

  if (mode === "strategist" || agent === "strategist") {
    return ["review", "scope", "plan"];
  }

  if (mode === "researcher" || agent === "researcher") {
    if (stage === "researcher_evaluating") return ["review", "score", "refine"];
    if (stage === "researcher_followup") return ["question", "expand", "retry"];
    return ["search", "sift", "compose"];
  }

  if (stage === "buyer_discovering" || stage === "buyer_purchasing" || agent === "buyer") {
    return ["scan", "price", "buy"];
  }

  return ["review", "plan", "act"];
}

function getLoadingHints(mode: ViewMode, stage?: string, agent?: string) {
  if (mode === "seller" || agent === "seller") {
    if (stage === "seller_planning") return ["matching the best product", "checking if outside data is worth it", "preparing the fulfillment path"];
    if (stage === "seller_fulfilling") return ["dispatching work to the right agents", "assembling the delivery package", "tracking fulfillment across the pipeline"];
    return ["receiving the order", "setting the commercial boundary", "preparing final delivery"];
  }

  if (mode === "strategist" || agent === "strategist") {
    return ["tightening the brief", "expanding vague intent into scope", "turning your request into an execution plan"];
  }

  if (mode === "researcher" || agent === "researcher") {
    if (stage === "researcher_evaluating") return ["checking for coverage gaps", "testing whether the report is complete", "deciding if another pass is needed"];
    if (stage === "researcher_followup") return ["asking for sharper context", "opening a second pass", "resolving missing detail"];
    return ["checking sources", "weighing signals", "shaping the report"];
  }

  if (stage === "buyer_discovering" || stage === "buyer_purchasing" || agent === "buyer") {
    return ["searching marketplace options", "comparing asset value", "pulling in outside context"];
  }

  return ["coordinating agents", "moving work through the chain", "turning intent into output"];
}

// ─── Loading Skeleton ────────────────────────────────────────────────
function LoadingSkeleton({ mode, events, elapsed, onCancel }: { mode: ViewMode; events: PipelineEvent[]; elapsed?: number; onCancel?: () => void }) {
  const lastEvent = events[events.length - 1];
  const stageLabels: Record<string, string> = {
    strategist_working: "Strategist is analyzing your input…",
    strategist_complete: "Brief structured — handing off to Researcher…",
    researcher_buying: "Researcher purchasing brief from Strategist…",
    researcher_working: "Researcher searching and scraping the web…",
    researcher_evaluating: "Evaluating document completeness…",
    researcher_followup: "Requesting additional context…",
    buyer_discovering: "Buyer scanning the marketplace for assets…",
    buyer_purchasing: "Buyer purchasing marketplace assets…",
    buyer_complete: "Marketplace procurement complete",
    seller_received: "Seller received an external order…",
    seller_planning: "Seller planning fulfillment strategy…",
    seller_fulfilling: "Seller dispatching to internal pipeline…",
    seller_complete: "Seller order fulfilled and delivered",
  };
  const currentLabel = lastEvent ? (stageLabels[lastEvent.stage] ?? lastEvent.message) : "Initializing pipeline…";

  const agentWorking = lastEvent?.agent ?? "pipeline";
  const color = AGENT_CONFIG[agentWorking as keyof typeof AGENT_CONFIG]?.color ?? "var(--green-400)";
  const typingWords = getLoadingWords(mode, lastEvent?.stage, agentWorking);
  const loadingHints = getLoadingHints(mode, lastEvent?.stage, agentWorking);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-8">
      {/* Main card */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl p-8"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
      >
        {/* Indeterminate progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden" style={{ background: `${color}15` }}>
          <div
            className="h-full w-[40%] rounded-full"
            style={{ background: color, animation: "progress-indeterminate 1.8s ease-in-out infinite" }}
          />
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          {/* Animated icon */}
          <div className="relative flex size-16 items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: `${color}10`, border: `1px solid ${color}20` }}
            />
            <div
              className="absolute inset-0 animate-pulse rounded-2xl"
              style={{ background: `${color}05` }}
            />
            {mode === "pipeline" ? (
              <Bot size={26} style={{ color }} />
            ) : mode === "seller" ? (
              <Package size={26} style={{ color }} />
            ) : agentWorking === "strategist" ? (
              <Sparkles size={26} style={{ color }} />
            ) : (
              <Search size={26} style={{ color }} />
            )}
          </div>

          {/* Title + description */}
          <div>
            <TypingStatusWords words={typingWords} color={color} />
            <p className="mb-1.5 text-[15px] font-semibold" style={{ color: "var(--gray-800)" }}>
              {mode === "pipeline" ? "Pipeline Running" : mode === "seller" ? "Seller Fulfilling" : agentWorking === "strategist" ? "Strategist Working" : "Researcher Working"}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              {currentLabel}
            </p>
            <LoadingPulseDots color={color} />
            <LoadingMicroHint hints={loadingHints} color={color} />
          </div>

          {/* Stage chips */}
          {events.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {events.map((evt, i) => {
                const stageColor = AGENT_CONFIG[evt.agent as keyof typeof AGENT_CONFIG]?.color ?? color;
                return (
                  <span
                    key={evt.id}
                    className="rounded-md px-2 py-0.5 font-mono text-[8px] font-semibold transition-all animate-fade-in"
                    style={{
                      background: i === events.length - 1 ? `${stageColor}15` : "var(--bg-surface)",
                      border: `1px solid ${i === events.length - 1 ? `${stageColor}30` : "var(--border-default)"}`,
                      color: i === events.length - 1 ? stageColor : "var(--gray-400)",
                    }}
                  >
                    {evt.agent}
                  </span>
                );
              })}
              <span className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                <Loader2 size={8} className="animate-spin" />
              </span>
            </div>
          )}

          {/* Timer */}
          <p className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
            {elapsed != null && elapsed > 0 ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")} elapsed · ` : ""}
            {mode === "pipeline" ? "Usually 3–7 min" : mode === "seller" ? "Usually 3–5 min" : mode === "researcher" ? "Usually 1–3 min" : "Usually 30–60 sec"}
            {events.length > 0 && ` · ${events.length} stage${events.length !== 1 ? "s" : ""} complete`}
          </p>
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 font-mono text-[11px] transition-all hover:opacity-80"
          style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#EF4444" }}
        >
          <RotateCcw size={11} /> Cancel
        </button>
      )}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────
const EXAMPLE_PROMPTS: Record<ViewMode, string[]> = {
  pipeline: [
    "What are the best AI agent frameworks in 2025?",
    "Research the market for no-code automation tools",
    "Analyze competitors to Notion for team knowledge bases",
    "Write a product plan for a SaaS invoice tool",
    "Research emerging trends in autonomous AI payments",
  ],
  strategist: [
    "Structure a brief for a developer API go-to-market launch",
    "Interpret a launch plan request for a B2B SaaS tool",
    "Build an execution brief for market entry into healthcare AI",
    "Define scope and sections for a mobile app MVP deliverable",
  ],
  researcher: [
    "What are the top Nevermined use cases in 2025?",
    "Find recent research on LLM agent architectures",
    "Compare Exa, Perplexity, and Tavily for AI search",
    "What are developers building with the Apify platform?",
  ],
  seller: [
    "Generate a deep research report on AI agent frameworks",
    "Produce a competitive intelligence brief on no-code tools",
    "Create a market analysis for autonomous payment systems",
    "Write a strategic plan for entering the developer tools market",
  ],
};

function EmptyState({ mode, onExample }: { mode: ViewMode; onExample: (p: string) => void }) {
  const config = {
    pipeline: {
      icon: Bot,
      title: "Full Pipeline",
      desc: "Describe what you need. The Interpreter structures your brief, the Composer searches and writes the report, the Buyer optionally enriches it, and the Seller packages and delivers the final artifact.",
    },
    strategist: {
      icon: Sparkles,
      title: "Interpreter",
      desc: "Enter a topic or request. Get a precise execution brief — objective, scope, search plan, required sections, and delivery format.",
    },
    researcher: {
      icon: Search,
      title: "Composer",
      desc: "Enter a research query. The Composer searches and scrapes the web, synthesizes sources, and returns a structured report with citations.",
    },
    seller: {
      icon: Package,
      title: "Seller",
      desc: "Describe what a buyer needs. The Seller orchestrates the full pipeline, then packages and delivers a branded, quality-gated deliverable.",
    },
  };
  const c = config[mode];
  const examples = EXAMPLE_PROMPTS[mode];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center animate-fade-up">
      {/* Icon with pulse ring */}
      <div className="relative flex size-16 items-center justify-center">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "rgba(201, 125, 78, 0.06)", border: "1px solid rgba(201, 125, 78, 0.12)" }}
        />
        <div
          className="absolute -inset-2 rounded-3xl opacity-0 animate-pulse"
          style={{ background: "rgba(201, 125, 78, 0.04)" }}
        />
        <c.icon size={26} style={{ color: "var(--accent-400)" }} />
      </div>

      <div>
        <h3 className="mb-1.5 text-lg font-semibold" style={{ color: "var(--gray-800)" }}>{c.title}</h3>
        <p className="max-w-md text-[13px] leading-relaxed" style={{ color: "var(--gray-400)" }}>{c.desc}</p>
      </div>

      {/* Try these prompts */}
      <div>
        <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-300)" }}>
          Try one of these
        </p>
        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {examples.map((ex, i) => (
            <button
              key={ex}
              onClick={() => onExample(ex)}
              className="rounded-lg px-3 py-1.5 text-left text-[11px] leading-snug transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--gray-500)",
                border: "1px solid var(--border-default)",
                animationDelay: `${i * 60}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201, 125, 78, 0.30)";
                e.currentTarget.style.color = "var(--gray-700)";
                e.currentTarget.style.background = "rgba(201, 125, 78, 0.04)";
                e.currentTarget.style.boxShadow = "0 2px 12px -4px rgba(201, 125, 78, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--gray-500)";
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Ad Context Extraction ──────────────────────────────────────────
function extractAdContext(brief?: StructuredBrief, purchasedAssets?: PurchasedAsset[]): { query: string; signals: ZeroClickSignal[] } {
  if (!brief) return { query: "", signals: [] };

  const query = [brief.title, ...brief.scope.slice(0, 2)].filter(Boolean).join(" · ");

  const signals: ZeroClickSignal[] = [];

  if (brief.title) {
    signals.push({
      category: "interest",
      confidence: 0.9,
      subject: brief.title,
      relatedSubjects: brief.scope.slice(0, 4),
      sentiment: "positive",
    });
  }

  if (brief.keyQuestions.length > 0) {
    signals.push({
      category: "evaluation",
      confidence: 0.75,
      subject: brief.keyQuestions[0],
      relatedSubjects: brief.keyQuestions.slice(1, 3),
      sentiment: "neutral",
    });
  }

  if (brief.deliverables.length > 0) {
    signals.push({
      category: "recommendation_request",
      confidence: 0.8,
      subject: brief.deliverables[0],
      sentiment: "positive",
    });
  }

  // Agentic: when Buyer purchased marketplace assets, inject purchase_intent signals
  if (purchasedAssets && purchasedAssets.length > 0) {
    signals.push({
      category: "purchase_intent",
      confidence: 0.95,
      subject: purchasedAssets[0].name,
      relatedSubjects: purchasedAssets.slice(1, 4).map((a) => a.name),
      sentiment: "positive",
    });
  }

  return { query, signals };
}

// ─── Main Studio Page ───────────────────────────────────────────────
export function StudioPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ViewMode>("pipeline");
  const [outputType, setOutputType] = useState<OutputType>("research");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [pipelineEvents, setPipelineEvents] = useState<PipelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rightTab, setRightTab] = useState<"document" | "brief" | "purchases" | "provenance" | "delivery">("document");
  const [bottomTab, setBottomTab] = useState<"stages" | "transactions">("stages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialStats, setInitialStats] = useState<{ strategist: { earned: number; handled: number }; researcher: { earned: number; handled: number }; buyer: { earned: number; handled: number }; seller: { earned: number; handled: number } }>({
    strategist: { earned: 0, handled: 0 },
    researcher: { earned: 0, handled: 0 },
    buyer: { earned: 0, handled: 0 },
    seller: { earned: 0, handled: 0 },
  });
  const transactions = useTransactionStream();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [adsMuted, setAdsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiMode, setApiMode] = useState<"demo" | "live" | "checking">("checking");
  const [toolSettings, setToolSettings] = useState<ToolSettings>(() => loadToolSettings());
  const [judgeMode, setJudgeMode] = useState(false);
  const [adToolsUsed, setAdToolsUsed] = useState<SponsorToolUsage[]>([]);
  const [workspaceId] = useState<string>("default");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Clarification dialog state
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([]);
  const [clarifyRouting, setClarifyRouting] = useState<BriefRouting | undefined>(undefined);
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  // Artifact library state
  const [libraryOpen, setLibraryOpen] = useState(false);
  // Buyer approval state
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalAssets, setApprovalAssets] = useState<MarketplaceAsset[]>([]);
  const [approvalCost, setApprovalCost] = useState(0);
  const [approvalReason, setApprovalReason] = useState("");
  // Clarification pre-check loading state
  const [isCheckingClarify, setIsCheckingClarify] = useState(false);
  // Action intelligence (extracted from report)
  const [actionIntelligence, setActionIntelligence] = useState<ActionIntelligence | null>(null);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  // Follow-up assistant
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | undefined>(undefined);
  // Smart suggestions visible when input focused
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  // VISION agent state
  const [visionResult, setVisionResult] = useState<{ imageUrl: string; attempts: number; passedQuality: boolean; qualityScore: number; finalPrompt: string } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleAdServed = useCallback(() => {
    setAdToolsUsed((prev) => {
      if (prev.some((t) => t.tool === "zeroclick-ad")) return prev;
      return [...prev, { tool: "zeroclick-ad", label: "ZeroClick Contextual Ad Served", sponsor: "ZeroClick", timestamp: new Date().toISOString() }];
    });
  }, []);

  const handleJudgePreset = useCallback((preset: JudgePreset) => {
    setInput(preset.prompt);
    setMode(preset.mode);
    setOutputType(preset.outputType);
    // Apply tool overrides
    setToolSettings((prev) => {
      const next = {
        ...prev,
        ...(preset.toolOverrides.researcher ? { researcher: { ...prev.researcher, ...preset.toolOverrides.researcher } } : {}),
        ...(preset.toolOverrides.trading ? { trading: { ...prev.trading, ...preset.toolOverrides.trading } } : {}),
      };
      saveToolSettings(next);
      return next;
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("zc_ads_muted");
    if (stored === "true") setAdsMuted(true);
  }, []);

  useEffect(() => {
    fetch("/api/settings/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const hasLLM = d.openai || d.gemini || d.anthropic;
        setApiMode(hasLLM ? "live" : "demo");
      })
      .catch(() => setApiMode("demo"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const m = params.get("mode");
    if (q) {
      setInput(decodeURIComponent(q));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (m === "strategist" || m === "researcher" || m === "seller") setMode(m);
    if (params.get("checkout") === "true") {
      setCheckoutOpen(true);
      // Clean up URL without reload
      window.history.replaceState({}, "", "/studio" + (q ? `?q=${encodeURIComponent(q)}` : "") + (m ? `${q ? "&" : "?"}mode=${m}` : ""));
    }

    // Restore last result from localStorage
    try {
      const saved = localStorage.getItem("ab_last_result");
      if (saved && !q) {
        const parsed = JSON.parse(saved) as { result: PipelineResult; input: string; mode: ViewMode };
        setResult(parsed.result);
        setInput(parsed.input);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.result.document) setRightTab("document");
        else if (parsed.result.brief) setRightTab("brief");
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  function toggleAdsMuted() {
    setAdsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("zc_ads_muted", String(next));
      return next;
    });
  }

  const adContext = useMemo(() => extractAdContext(result?.brief, result?.purchasedAssets), [result?.brief, result?.purchasedAssets]);

  // Fetch persisted stats on mount
  useEffect(() => {
    fetch("/api/pipeline/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.agents) {
          setInitialStats({
            strategist: { earned: data.agents.strategist?.creditsEarned ?? 0, handled: data.agents.strategist?.requestsHandled ?? 0 },
            researcher: { earned: data.agents.researcher?.creditsEarned ?? 0, handled: data.agents.researcher?.requestsHandled ?? 0 },
            buyer: { earned: data.agents.buyer?.creditsEarned ?? 0, handled: data.agents.buyer?.requestsHandled ?? 0 },
            seller: { earned: data.agents.seller?.creditsEarned ?? 0, handled: data.agents.seller?.requestsHandled ?? 0 },
          });
        }
      })
      .catch(() => { /* stats unavailable */ });
  }, []);

  // Aggregate stats: initial + live SSE transactions
  const agentStats = {
    strategist: {
      earned: initialStats.strategist.earned + transactions.filter((t) => t.to.id === "strategist" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.strategist.handled + transactions.filter((t) => t.to.id === "strategist" && t.status === "completed").length,
    },
    researcher: {
      earned: initialStats.researcher.earned + transactions.filter((t) => t.to.id === "researcher" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.researcher.handled + transactions.filter((t) => t.to.id === "researcher" && t.status === "completed").length,
    },
    buyer: {
      earned: initialStats.buyer.earned + transactions.filter((t) => t.to.id === "buyer" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.buyer.handled + transactions.filter((t) => t.to.id === "buyer" && t.status === "completed").length,
    },
    seller: {
      earned: initialStats.seller.earned + transactions.filter((t) => t.to.id === "seller" && t.status === "completed").reduce((s, t) => s + t.credits, 0),
      handled: initialStats.seller.handled + transactions.filter((t) => t.to.id === "seller" && t.status === "completed").length,
    },
  };

  function handleNewRequest() {
    setInput("");
    setResult(null);
    setPipelineEvents([]);
    setError(null);
    setAdToolsUsed([]);
    inputRef.current?.focus();
  }

  function handleCancel() {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLoading(false);
    setError("Request cancelled");
  }

  async function triggerVision(title: string, summary: string) {
    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/agents/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: `${title}. ${summary.slice(0, 200)}`,
          outputContext: "research_report",
          requirements: ["Professional quality", "No text overlay", "Relevant to topic"],
          aspectRatio: "16:9",
          style: { mood: "professional" },
          calledBy: "composer",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.imageUrl) {
        setVisionResult({
          imageUrl: data.imageUrl,
          attempts: data.attempts ?? 1,
          passedQuality: data.passedQuality ?? false,
          qualityScore: data.qualityReport?.score ?? 0,
          finalPrompt: data.finalPrompt ?? "",
        });
        setAdToolsUsed((prev) => {
          const already = prev.some((t) => t.tool === "nanobanana-generate");
          if (already) return prev;
          const tools: SponsorToolUsage[] = [
            ...prev,
            {
              tool: "nanobanana-generate",
              label: "Image Generation",
              sponsor: "NanoBanana",
              timestamp: new Date().toISOString(),
              detail: `${data.attempts ?? 1} attempt${(data.attempts ?? 1) !== 1 ? "s" : ""} · score ${data.qualityReport?.score ?? "?"}/100`,
            },
          ];
          if (data.attempts > 1) {
            tools.push({
              tool: "nanobanana-judge",
              label: "Quality Judge",
              sponsor: "NanoBanana",
              timestamp: new Date().toISOString(),
              detail: `GPT-4o-mini vision · ${data.passedQuality ? "passed" : "best-of-" + data.attempts}`,
            });
          }
          return tools;
        });
        setPipelineEvents((prev) => [
          ...prev,
          {
            id: `vision-${Date.now()}`,
            timestamp: new Date().toISOString(),
            stage: "vision_complete",
            agent: "vision",
            message: `[IMAGE] Generated in ${data.attempts ?? 1} attempt${(data.attempts ?? 1) !== 1 ? "s" : ""} · quality ${data.qualityReport?.score ?? "?"}/100`,
            data: { imageUrl: data.imageUrl, passedQuality: data.passedQuality },
          },
        ]);
      }
    } catch { /* silent — vision is non-critical */ }
    finally { setIsGeneratingImage(false); }
  }

  async function runPipeline(overrideInput?: string) {
    const finalInput = overrideInput ?? input;
    if (!finalInput.trim() || isLoading) return;

    setClarifyOpen(false);
    setPendingInput(null);

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPipelineEvents([]);
    setElapsed(0);
    setVisionResult(null);

    // Start elapsed timer
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    // Open SSE stream
    const eventSource = new EventSource("/api/agent/events");
    eventSource.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data) as { id: string; type: string; timestamp: string; data: Record<string, unknown> };
        const mapped: PipelineEvent = {
          id: raw.id,
          timestamp: raw.timestamp,
          stage: String(raw.data?.stage ?? raw.type ?? "unknown"),
          agent: String(raw.data?.agent ?? "pipeline"),
          message: String(raw.data?.message ?? raw.type?.replace(/_/g, " ") ?? ""),
          data: raw.data,
        };
        setPipelineEvents((prev) => [...prev.slice(-49), mapped]);
      } catch { /* ignore parse errors */ }
    };

    try {
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: finalInput.trim(),
          outputType,
          mode,
          toolSettings,
          workspaceId,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setResult(data);
      setActionIntelligence(null);
      if (data.events) setPipelineEvents(data.events);
      if (data.deliveryPackage) setRightTab("delivery");
      else if (data.document) setRightTab("document");
      // Auto-extract action intelligence from the composed document
      if (data.document) {
        extractActionsFromResult(data.document);
        // Trigger VISION agent async — non-blocking, generates hero image for the report
        triggerVision(data.document.title ?? finalInput, data.document.summary ?? "");
      }
      else if (data.brief) setRightTab("brief");

      // Check if Buyer requires approval for next run context
      if (data.buyerResult?.requiresApproval) {
        const req = data.buyerResult.requiresApproval;
        setApprovalAssets(req.assets ?? []);
        setApprovalCost(req.totalCost ?? 0);
        setApprovalReason(req.reason ?? "Cost exceeds threshold");
        setApprovalOpen(true);
      }

      // Save to artifact library
      try {
        saveArtifact({
          input: finalInput.trim(),
          mode,
          outputType,
          title: data.document?.title ?? data.brief?.title ?? data.deliveryPackage?.title ?? finalInput.slice(0, 60),
          summary: data.document?.summary ?? data.brief?.objective ?? "",
          creditsUsed: data.totalCredits ?? 0,
          durationMs: data.totalDurationMs ?? 0,
          hasBrief: !!data.brief,
          hasDocument: !!data.document,
          hasDelivery: !!data.deliveryPackage,
          sourceCount: data.document?.sources?.length ?? 0,
          enriched: (data.purchasedAssets?.length ?? 0) > 0,
        });
      } catch { /* quota exceeded */ }

      // Persist last result to localStorage
      try { localStorage.setItem("ab_last_result", JSON.stringify({ result: data, input: finalInput.trim(), mode })); } catch { /* quota exceeded */ }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // already handled by handleCancel
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      eventSource.close();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(false);
    }
  }

  async function extractActionsFromResult(doc: ResearchDocument) {
    if (!doc.summary && !doc.sections?.length) return;
    setIsExtractingActions(true);
    setActionIntelligence(null);
    setFollowUpOpen(false);
    try {
      const res = await fetch("/api/pipeline/extract-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.query,
          summary: doc.summary,
          sections: doc.sections?.slice(0, 6),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.actions) setActionIntelligence(data.actions);
      }
    } catch { /* silent — action extraction is non-critical */ }
    finally { setIsExtractingActions(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // For pipeline/strategist mode — check if clarification is needed first
    if ((mode === "pipeline" || mode === "strategist") && input.trim().length < 40) {
      setIsCheckingClarify(true);
      try {
        const res = await fetch("/api/pipeline/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: input.trim(), outputType, workspaceId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isClarificationNeeded && data.clarificationQuestions?.length > 0) {
            setClarifyQuestions(data.clarificationQuestions);
            setClarifyRouting(data.routing);
            setPendingInput(input.trim());
            setClarifyOpen(true);
            setIsCheckingClarify(false);
            return;
          }
        }
      } catch { /* fall through to normal run on error */ } finally {
        setIsCheckingClarify(false);
      }
    }

    await runPipeline();
  }

  // Keyboard shortcuts: Escape to cancel, Cmd/Ctrl+K to open settings
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape: cancel running pipeline
      if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        handleCancel();
      }
      // Cmd/Ctrl+K: toggle settings
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
      // Cmd/Ctrl+N: new request (when not loading)
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !isLoading) {
        e.preventDefault();
        handleNewRequest();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  function handleRestoreArtifact(entry: ArtifactEntry) {
    setInput(entry.input);
    setMode(entry.mode as ViewMode);
    setLibraryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <>
    <ClarificationDialog
      open={clarifyOpen}
      questions={clarifyQuestions}
      routing={clarifyRouting}
      onAnswer={(answers) => {
        const enriched = pendingInput
          ? `${pendingInput}\n\nContext: ${answers.filter(Boolean).join(" | ")}`
          : input;
        setInput(enriched);
        runPipeline(enriched);
      }}
      onSkip={() => runPipeline(pendingInput ?? undefined)}
    />
    <ArtifactLibrary
      open={libraryOpen}
      onClose={() => setLibraryOpen(false)}
      onRestore={handleRestoreArtifact}
    />
    <BuyerApprovalModal
      open={approvalOpen}
      assets={approvalAssets}
      totalCost={approvalCost}
      reason={approvalReason}
      onApprove={() => setApprovalOpen(false)}
      onDeny={() => setApprovalOpen(false)}
    />
    <SettingsPanel
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      settings={toolSettings}
      onChange={(next) => {
        setToolSettings(next);
        saveToolSettings(next);
      }}
    />
    <div className="flex h-screen flex-col" style={{ background: "var(--bg-base)" }}>
      <Nav />

      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar toggle (mobile) */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute left-3 top-[68px] z-20 flex size-8 items-center justify-center rounded-lg lg:hidden"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
        >
          {sidebarOpen ? <PanelLeftClose size={14} style={{ color: "var(--gray-400)" }} /> : <PanelLeftOpen size={14} style={{ color: "var(--gray-400)" }} />}
        </button>

        {/* ── LEFT PANE: Controls ── */}
        <div
          className={`flex w-[380px] shrink-0 flex-col border-r transition-all duration-200 max-lg:absolute max-lg:inset-y-14 max-lg:left-0 max-lg:z-10 ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}`}
          style={{ borderColor: "var(--border-default)", background: "var(--bg-base)" }}
        >

          {/* Demo / Live mode banner */}
          {apiMode !== "checking" && (
            <div
              className="flex items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: "var(--border-default)", background: apiMode === "demo" ? "rgba(245,158,11,0.04)" : "rgba(34,197,94,0.03)" }}
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: apiMode === "demo" ? "#F59E0B" : "var(--green-400)" }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: apiMode === "demo" ? "#F59E0B" : "var(--green-400)", opacity: apiMode === "demo" ? 0.8 : 1 }}
                />
                {apiMode === "demo" ? "Demo Mode" : "Live Mode"}
              </span>
              {apiMode === "demo" && (
                <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                  Add API keys to go live
                </span>
              )}
            </div>
          )}

          {/* Agent Cards */}
          <div className="flex flex-col gap-0 border-b px-3 py-3" style={{ borderColor: "var(--border-default)" }}>
            <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Agents
            </p>
            <AgentCard
              agent={AGENT_CONFIG.strategist}
              isActive={isLoading && (mode === "pipeline" || mode === "strategist")}
              isSelected={mode === "strategist"}
              onClick={() => setMode(mode === "strategist" ? "pipeline" : "strategist")}
              stats={agentStats.strategist}
              toolLabel={toolSettings.strategist.search}
              index={0}
            />
            {mode === "pipeline" && (
              <AgentConnector isActive={isLoading} color={AGENT_CONFIG.strategist.color} />
            )}
            <AgentCard
              agent={AGENT_CONFIG.researcher}
              isActive={isLoading && (mode === "pipeline" || mode === "researcher")}
              isSelected={mode === "researcher"}
              onClick={() => setMode(mode === "researcher" ? "pipeline" : "researcher")}
              stats={agentStats.researcher}
              toolLabel={toolSettings.researcher.search}
              index={1}
            />
            {mode === "pipeline" && (
              <AgentConnector isActive={isLoading} color={AGENT_CONFIG.researcher.color} />
            )}
            <AgentCard
              agent={AGENT_CONFIG.buyer}
              isActive={isLoading && mode === "pipeline"}
              isSelected={false}
              onClick={() => {}}
              stats={agentStats.buyer}
              toolLabel="nevermined"
              index={2}
            />
            {mode === "pipeline" && (
              <AgentConnector isActive={isLoading} color={AGENT_CONFIG.buyer.color} />
            )}
            <AgentCard
              agent={AGENT_CONFIG.seller}
              isActive={isLoading && (mode === "pipeline" || mode === "seller")}
              isSelected={mode === "seller"}
              onClick={() => setMode(mode === "seller" ? "pipeline" : "seller")}
              stats={agentStats.seller}
              toolLabel="nevermined"
              index={3}
            />
          </div>

          {/* Mode indicator + controls */}
          <div className="border-b px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <span
                className="rounded-lg px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide"
                style={{
                  background: mode === "pipeline" ? "rgba(201, 125, 78, 0.10)" :
                    AGENT_CONFIG[mode]?.bgColor ?? AGENT_CONFIG.researcher.bgColor,
                  color: mode === "pipeline" ? "var(--accent-400)" :
                    AGENT_CONFIG[mode]?.color ?? AGENT_CONFIG.researcher.color,
                  border: `1px solid ${mode === "pipeline" ? "rgba(201, 125, 78, 0.20)" :
                    AGENT_CONFIG[mode]?.borderColor ?? AGENT_CONFIG.researcher.borderColor}`,
                }}
              >
                {mode === "pipeline" ? "⚡ Full Pipeline" : mode === "strategist" ? "◆ Interpreter" : mode === "researcher" ? "◈ Composer" : "◇ Seller"}
              </span>
              {mode !== "pipeline" && (
                <button
                  onClick={() => setMode("pipeline")}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{ color: "var(--gray-400)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <RefreshCw size={9} /> Pipeline
                </button>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setLibraryOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{ color: "var(--gray-400)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  title="Artifact Library"
                >
                  <BookOpen size={10} />
                  library
                </button>
                <button
                  onClick={() => setJudgeMode((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{
                    color: judgeMode ? "var(--accent-400)" : "var(--gray-400)",
                    background: judgeMode ? "rgba(201, 125, 78, 0.10)" : "var(--bg-surface)",
                    border: `1px solid ${judgeMode ? "rgba(201, 125, 78, 0.22)" : "var(--border-default)"}`,
                  }}
                  title="Judge Demo Mode"
                >
                  <Award size={10} />
                  judge
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{ color: "var(--gray-400)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  title="Tool Settings (⌘K)"
                >
                  <Settings size={10} />
                  tools
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug" style={{ color: "var(--gray-400)" }}>
              {mode === "pipeline"
                ? "Interpreter → Composer → optional Buyer → Seller. Full structured research + packaged delivery."
                : mode === "strategist"
                ? "Interpreter only. Converts your request into a structured execution brief. Fast."
                : mode === "researcher"
                ? "Composer only. Web research + synthesis into a structured report. No brief step."
                : "Seller mode. Orchestrates Interpreter → Composer → Seller packaging + quality gate."}
            </p>
          </div>

          {/* Output type selector (only for pipeline/strategist) */}
          {mode !== "researcher" && (
            <div className="flex flex-wrap gap-1.5 border-b px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
              {OUTPUT_TYPES.map((ot) => {
                const active = outputType === ot.value;
                return (
                  <button
                    key={ot.value}
                    onClick={() => setOutputType(ot.value)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all duration-150"
                    style={{
                      background: active ? "rgba(201, 125, 78, 0.10)" : "var(--bg-surface)",
                      border: `1px solid ${active ? "rgba(201, 125, 78, 0.22)" : "var(--border-default)"}`,
                      color: active ? "var(--accent-400)" : "var(--gray-500)",
                      transform: active ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <ot.icon size={10} />
                    {ot.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Judge Mode Presets */}
          {judgeMode && (
            <div className="border-b p-3" style={{ borderColor: "var(--border-default)", background: "rgba(201, 125, 78, 0.02)" }}>
              <JudgeMode onSelect={handleJudgePreset} />
            </div>
          )}

          {/* Workspace Profile Panel */}
          <div className="border-b px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
            <WorkspaceProfilePanel workspaceId={workspaceId} />
          </div>

          {/* Seller demo mode banner */}
          {mode === "seller" && !toolSettings.trading.externalTrading && (
            <div
              className="flex items-start gap-2.5 border-b px-3 py-2.5"
              style={{ borderColor: "var(--border-default)", background: "rgba(99,102,241,0.05)" }}
            >
              <span
                className="mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold"
                style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.22)" }}
              >
                DEMO
              </span>
              <p className="text-[10px] leading-snug" style={{ color: "#6366F1" }}>
                Seller orchestration visible — external third-party procurement is disabled. Buyer will evaluate enrichment but not transact. Enable <span className="font-semibold">External Marketplace</span> in Settings for live agentic flows.
              </p>
            </div>
          )}

          {/* Cost estimate + Input */}
          <div className="border-b p-3" style={{ borderColor: "var(--border-default)" }}>
            {input.trim() && !isLoading && (
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md px-2 py-0.5 font-mono text-[9px]" style={{ background: "rgba(201,125,78,0.08)", border: "1px solid rgba(201,125,78,0.18)", color: "var(--accent-400)" }}>
                  ~{mode === "pipeline" ? "6–16" : mode === "seller" ? "6–16" : mode === "researcher" ? "1–10" : "1"} credits
                </span>
                <span className="text-[9px]" style={{ color: "var(--gray-300)" }}>estimated cost</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={
                    mode === "researcher"
                      ? "What should the Composer research and write?"
                      : mode === "seller"
                      ? "Describe what the buyer ordered…"
                      : mode === "strategist"
                      ? "What should the Interpreter structure into a brief?"
                      : "Describe what you need. The full pipeline handles the rest."
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl px-4 py-3 pr-12 text-[13px] leading-relaxed outline-none transition-all"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.08)";
                    setSuggestionsVisible(true);
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.boxShadow = "none";
                    setTimeout(() => setSuggestionsVisible(false), 200);
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isCheckingClarify}
                  className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-lg transition-all disabled:opacity-30"
                  style={{ background: isCheckingClarify ? "rgba(124,58,237,0.7)" : "linear-gradient(135deg, var(--accent-600), var(--accent-400))" }}
                  title={isCheckingClarify ? "Checking brief quality…" : "Send (Enter ↵)"}
                >
                  {isLoading || isCheckingClarify ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                </button>
                {isCheckingClarify && (
                  <div className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
                    <Loader2 size={9} className="animate-spin" style={{ color: "#7C3AED" }} />
                    <span className="font-mono text-[9px]" style={{ color: "#7C3AED" }}>checking brief quality…</span>
                  </div>
                )}
              </div>
              {/* Smart suggestions — appear on focus when typing */}
              {suggestionsVisible && !isLoading && (
                <div className="mt-2">
                  <SmartSuggestions
                    input={input}
                    workspaceMarket={undefined}
                    visible={suggestionsVisible && !isLoading}
                    onApply={(suggestion) => {
                      const modeMap: Record<string, ViewMode> = {
                        pipeline: "pipeline",
                        researcher: "researcher",
                        strategist: "strategist",
                        seller: "seller",
                      };
                      const newMode = modeMap[suggestion.mode] ?? mode;
                      setMode(newMode);
                      const typeMap: Record<string, OutputType> = {
                        research: "research",
                        analysis: "analysis",
                        plan: "plan",
                        spec: "prd",
                        brief: "general",
                        report: "research",
                        comparison: "analysis",
                      };
                      setOutputType((typeMap[suggestion.outputType] ?? outputType) as OutputType);
                      setSuggestionsVisible(false);
                      inputRef.current?.focus();
                    }}
                  />
                </div>
              )}
              {error && (
                <div className="mt-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[12px] font-medium" style={{ color: "#EF4444" }}>{error}</p>
                      {apiMode === "demo" && (
                        <p className="mt-0.5 text-[11px]" style={{ color: "var(--gray-400)" }}>
                          Running in Demo Mode — add an OpenAI or Gemini key in environment variables to get real results.
                        </p>
                      )}
                      {pipelineEvents.length > 0 && (
                        <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-400)" }}>
                          Failed after {pipelineEvents.length} stage{pipelineEvents.length !== 1 ? "s" : ""}
                          {elapsed > 0 && ` · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSubmit as unknown as React.MouseEventHandler}
                      className="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[10px] transition-all hover:opacity-80"
                      style={{ background: "rgba(201,125,78,0.10)", border: "1px solid rgba(201,125,78,0.22)", color: "var(--accent-400)" }}
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Bottom section: Stages / Transactions toggle */}
          <div className="flex border-b" style={{ borderColor: "var(--border-default)" }}>
            {(["stages", "transactions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBottomTab(tab)}
                className="flex-1 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors"
                style={{
                  color: bottomTab === tab ? "var(--accent-400)" : "var(--gray-400)",
                  borderBottom: bottomTab === tab ? "2px solid var(--accent-400)" : "2px solid transparent",
                }}
              >
                {tab === "stages" ? "Job & Events" : `Transactions (${transactions.length})`}
              </button>
            ))}
          </div>

          {/* Bottom panel content */}
          <div className="flex-1 overflow-hidden">
            {bottomTab === "stages" ? (
              <PipelineStages events={pipelineEvents} isRunning={isLoading} />
            ) : (
              <TransactionFeed transactions={transactions} />
            )}
          </div>

          {/* Stats bar */}
          <div
            className="flex items-center gap-3 border-t px-3 py-2"
            style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
          >
            <div className="flex items-center gap-1.5" title="Credits used">
              <Zap size={10} style={{ color: "var(--accent-400)" }} />
              <span className="font-mono text-[9px] font-medium" style={{ color: "var(--gray-500)" }}>
                {result?.totalCredits ?? 0}cr
              </span>
            </div>
            <div className="h-2.5 w-px" style={{ background: "var(--border-default)" }} />
            <div className="flex items-center gap-1.5" title="Duration">
              <Clock size={10} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {result?.totalDurationMs ? `${(result.totalDurationMs / 1000).toFixed(1)}s` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="Iterations">
              <RefreshCw size={10} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {result?.iterations ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="Sources">
              <Globe size={10} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {result?.document?.sources.length ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="Purchases">
              <Package size={10} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {result?.purchasedAssets?.length ?? 0}
              </span>
            </div>
            <button
              onClick={() => setLibraryOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-[9px] transition-all hover:opacity-80"
              style={{ color: "var(--gray-400)", background: "transparent", border: "1px solid transparent" }}
              title="Artifact Library"
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
            >
              <BookOpen size={9} />
              library
            </button>
            {result?.enrichmentSummary && (
              <div className="flex items-center">
                <div className="h-2.5 w-px mr-1.5" style={{ background: "var(--border-default)" }} />
                <EnrichmentSummaryBadge
                  summary={result.enrichmentSummary as EnrichmentSummary}
                  compact={true}
                  expandable={false}
                />
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setCheckoutOpen(true)}
                title="Buy credits with card (VGS secure checkout)"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(201, 125, 78, 0.08)",
                  border: "1px solid rgba(201, 125, 78, 0.18)",
                  color: "var(--accent-400)",
                }}
              >
                <CreditCard size={10} />
                <span>buy credits</span>
              </button>
              <button
                onClick={toggleAdsMuted}
                title={adsMuted ? "Ads muted — click to enable" : "Click to mute ads"}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] transition-all"
                style={{
                  background: adsMuted ? "rgba(239, 68, 68, 0.06)" : "transparent",
                  border: `1px solid ${adsMuted ? "rgba(239, 68, 68, 0.15)" : "var(--border-default)"}`,
                  color: adsMuted ? "#EF4444" : "var(--gray-400)",
                }}
              >
                {adsMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                <span>{adsMuted ? "off" : "ads"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: Output ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b px-3 py-1.5" style={{ borderColor: "var(--border-default)" }}>
            {result?.document && (
              <button
                onClick={() => setRightTab("document")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "document" ? AGENT_CONFIG.researcher.color : "var(--gray-400)",
                  background: rightTab === "document" ? `${AGENT_CONFIG.researcher.color}10` : "transparent",
                }}
              >
                <FileText size={12} /> Report
                <span
                  className="rounded px-1 py-0.5 font-mono text-[7px]"
                  style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}
                >
                  Composer
                </span>
              </button>
            )}
            {result?.brief && (
              <button
                onClick={() => setRightTab("brief")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "brief" ? AGENT_CONFIG.strategist.color : "var(--gray-400)",
                  background: rightTab === "brief" ? `${AGENT_CONFIG.strategist.color}10` : "transparent",
                }}
              >
                <Sparkles size={12} /> Brief
              </button>
            )}
            {(result?.purchasedAssets?.length ?? 0) > 0 && (
              <button
                onClick={() => setRightTab("purchases")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "purchases" ? AGENT_CONFIG.buyer.color : "var(--gray-400)",
                  background: rightTab === "purchases" ? `${AGENT_CONFIG.buyer.color}10` : "transparent",
                }}
              >
                <Package size={12} /> Purchases ({result?.purchasedAssets?.length})
              </button>
            )}
            {result?.deliveryPackage && (
              <button
                onClick={() => setRightTab("delivery")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "delivery" ? AGENT_CONFIG.seller.color : "var(--gray-400)",
                  background: rightTab === "delivery" ? `${AGENT_CONFIG.seller.color}10` : "transparent",
                }}
              >
                <PackageCheck size={12} /> Delivery
                <span
                  className="rounded px-1 py-0.5 font-mono text-[7px]"
                  style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}
                >
                  Seller
                </span>
                {result.deliveryPackage.qualityGate.passed ? (
                  <span className="ml-0.5 size-1.5 rounded-full" style={{ background: "#22C55E", display: "inline-block" }} />
                ) : (
                  <span className="ml-0.5 size-1.5 rounded-full" style={{ background: "#EF4444", display: "inline-block" }} />
                )}
              </button>
            )}
            {result && (
              <button
                onClick={() => setRightTab("provenance")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "provenance" ? "#818CF8" : "var(--gray-400)",
                  background: rightTab === "provenance" ? "rgba(99,102,241,0.10)" : "transparent",
                }}
              >
                <GitBranch size={12} /> Provenance
              </button>
            )}
            {(actionIntelligence || isExtractingActions) && (
              <button
                onClick={() => setRightTab("actions" as typeof rightTab)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === ("actions" as typeof rightTab) ? "var(--accent-400)" : "var(--gray-400)",
                  background: rightTab === ("actions" as typeof rightTab) ? "rgba(201,125,78,0.10)" : "transparent",
                }}
              >
                {isExtractingActions ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                Actions
                {actionIntelligence && (
                  <span className="rounded-full px-1.5 py-0.5 font-mono text-[7px] font-bold" style={{ background: "rgba(201,125,78,0.15)", color: "var(--accent-400)" }}>
                    {Object.values(actionIntelligence).reduce((s, a) => s + a.length, 0)}
                  </span>
                )}
              </button>
            )}

            {/* Follow-up + New Request buttons */}
            <div className="ml-auto flex items-center gap-1.5">
              {result?.document && (
                <button
                  onClick={() => { setFollowUpOpen((v) => !v); setFollowUpPrompt(undefined); }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150"
                  style={{
                    background: followUpOpen ? "rgba(14,165,233,0.10)" : "var(--bg-surface)",
                    border: `1px solid ${followUpOpen ? "rgba(14,165,233,0.25)" : "var(--border-default)"}`,
                    color: followUpOpen ? "#0EA5E9" : "var(--gray-500)",
                  }}
                >
                  <MessageSquare size={11} /> Ask
                </button>
              )}
              {(result || isLoading) && (
                <button
                  onClick={handleNewRequest}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-150 hover:scale-[1.02] disabled:opacity-30"
                  style={{
                    background: result ? "rgba(201, 125, 78, 0.08)" : "var(--bg-surface)",
                    border: result ? "1px solid rgba(201, 125, 78, 0.20)" : "1px solid var(--border-default)",
                    color: result ? "var(--accent-400)" : "var(--gray-500)",
                  }}
                >
                  <RotateCcw size={11} /> New Request
                </button>
              )}
            </div>
          </div>

          {/* Sponsor Proof Rail */}
          <SponsorRail toolsUsed={[...(result?.toolsUsed ?? result?.document?.toolsUsed ?? []), ...adToolsUsed]} />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <LoadingSkeleton mode={mode} events={pipelineEvents} elapsed={elapsed} onCancel={handleCancel} />
            ) : !result ? (
              <EmptyState mode={mode} onExample={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} />
            ) : rightTab === "document" && result.document ? (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <DocumentView
                    doc={result.document}
                    adQuery={adContext.query || result.brief?.title || result.document?.query}
                    adSignals={adContext.signals}
                    adsMuted={adsMuted}
                    onAdServed={handleAdServed}
                    visionResult={visionResult}
                    isGeneratingImage={isGeneratingImage}
                  />
                </div>
                {/* Action panel + follow-up below document */}
                {(actionIntelligence || followUpOpen) && (
                  <div className="shrink-0 space-y-2 overflow-y-auto border-t p-4" style={{ borderColor: "var(--border-default)", maxHeight: "400px" }}>
                    {actionIntelligence && (
                      <ActionPanel
                        actions={actionIntelligence}
                        reportTitle={result.document.query}
                        onFollowUp={(prompt) => {
                          setFollowUpPrompt(prompt);
                          setFollowUpOpen(true);
                        }}
                      />
                    )}
                    {followUpOpen && (
                      <FollowUpAssistant
                        reportTitle={result.document.query}
                        reportSummary={result.document.summary}
                        reportContent={result.document.sections?.map((s) => `## ${s.heading}\n${s.content}`).join("\n\n")}
                        initialPrompt={followUpPrompt}
                        onClose={() => setFollowUpOpen(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : rightTab === "brief" && result.brief ? (
              <BriefView brief={result.brief} adsMuted={adsMuted} onAdServed={handleAdServed} />
            ) : rightTab === "purchases" && result.purchasedAssets?.length ? (
              <div className="h-full overflow-y-auto p-6 space-y-5">
                {/* Buyer Intelligence panel — ranking + rationale */}
                {(result as PipelineResult & { buyerResult?: { rankedCandidates?: import("@/components/ui/buyer-rationale-panel").RankedAsset[]; rationales?: import("@/components/ui/buyer-rationale-panel").PurchaseRationale[]; requiresApproval?: import("@/components/ui/buyer-rationale-panel").RequiresApproval; totalCreditsSpent?: number } }).buyerResult && (
                  <BuyerRationalePanel
                    rankedCandidates={(result as PipelineResult & { buyerResult?: { rankedCandidates?: import("@/components/ui/buyer-rationale-panel").RankedAsset[] } }).buyerResult?.rankedCandidates}
                    rationales={(result as PipelineResult & { buyerResult?: { rationales?: import("@/components/ui/buyer-rationale-panel").PurchaseRationale[] } }).buyerResult?.rationales}
                    requiresApproval={(result as PipelineResult & { buyerResult?: { requiresApproval?: import("@/components/ui/buyer-rationale-panel").RequiresApproval } }).buyerResult?.requiresApproval}
                    totalCreditsSpent={(result as PipelineResult & { buyerResult?: { totalCreditsSpent?: number } }).buyerResult?.totalCreditsSpent}
                  />
                )}
                <PurchasedAssetGrid assets={result.purchasedAssets} />
                <ZeroClickAd
                  query={result.brief?.title || result.document?.query || input}
                  muted={adsMuted}
                  signals={[{ category: "purchase_intent" as const, confidence: 0.85, subject: result.purchasedAssets[0]?.name || "marketplace asset", sentiment: "positive" as const }]}
                  onAdServed={handleAdServed}
                />
              </div>
            ) : rightTab === "delivery" && result?.deliveryPackage ? (
              <DeliveryPackageView
                pkg={result.deliveryPackage as import("@/lib/agent/seller").DeliveryPackage}
                enrichmentSummary={result.enrichmentSummary as EnrichmentSummary | undefined}
              />
            ) : rightTab === "provenance" ? (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {/* Agent chain timeline — APP_LOGIC_REVIEW §21 UX */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <p className="mb-3 font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                    Agent chain
                  </p>
                  <div className="flex flex-col gap-0">
                    {[
                      { agent: "Seller", role: "Intake & payment", color: "#EF4444", icon: ShoppingCart, always: true },
                      { agent: "Interpreter", role: "Structured brief", color: "#7C3AED", icon: Brain, always: !!result.brief },
                      { agent: "Composer", role: "Document composed", color: "#0EA5E9", icon: PenLine, always: !!result.document },
                      { agent: "Buyer", role: "Enrichment", color: "#F59E0B", icon: ShoppingBag, always: (result.purchasedAssets?.length ?? 0) > 0, optional: true },
                      { agent: "Seller", role: "Quality gate + delivery", color: "#EF4444", icon: PackageCheck, always: !!result.deliveryPackage },
                    ].map((step, i, arr) => {
                      if (!step.always && !step.optional) return null;
                      const skipped = step.optional && !step.always;
                      return (
                        <div key={`${step.agent}-${i}`}>
                          <div className="flex items-center gap-3 py-2">
                            <div
                              className="flex size-6 shrink-0 items-center justify-center rounded-md"
                              style={{
                                background: skipped ? "var(--bg-elevated)" : `${step.color}12`,
                                border: `1px solid ${skipped ? "var(--border-default)" : `${step.color}25`}`,
                                opacity: skipped ? 0.4 : 1,
                              }}
                            >
                              <step.icon size={11} style={{ color: skipped ? "var(--gray-400)" : step.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-semibold" style={{ color: skipped ? "var(--gray-400)" : step.color }}>
                                  {step.agent}
                                </span>
                                <span className="text-[10px]" style={{ color: "var(--gray-500)" }}>{step.role}</span>
                                {skipped && (
                                  <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>skipped</span>
                                )}
                                {step.agent === "Interpreter" && result.brief && (
                                  <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                    {result.brief.creditsUsed}cr · {(result.brief.durationMs / 1000).toFixed(1)}s
                                  </span>
                                )}
                                {step.agent === "Composer" && result.document && (
                                  <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                    {result.document.creditsUsed}cr · {(result.document.durationMs / 1000).toFixed(1)}s · {result.document.sources.length} sources
                                  </span>
                                )}
                              </div>
                              {step.agent === "Interpreter" && result.brief && (
                                <p className="mt-0.5 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                  {result.brief.provider}/{result.brief.model}
                                </p>
                              )}
                              {step.agent === "Composer" && result.document && (
                                <p className="mt-0.5 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                  {result.document.provider}/{result.document.model}
                                </p>
                              )}
                            </div>
                          </div>
                          {i < arr.length - 1 && (
                            <div className="ml-[11px] h-3 w-px" style={{ background: "var(--border-default)" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {result.enrichmentSummary && (
                  <EnrichmentSummaryBadge
                    summary={result.enrichmentSummary as EnrichmentSummary}
                    expandable={true}
                  />
                )}
                {result.provenance && (
                  <ProvenanceBlockCard provenance={result.provenance as ProvenanceInfo} />
                )}
                {result.buyerResult && (
                  <BuyerRationalePanel
                    rankedCandidates={result.buyerResult.rankedCandidates}
                    rationales={result.buyerResult.rationales}
                    requiresApproval={result.buyerResult.requiresApproval}
                    totalCreditsSpent={result.buyerResult.totalCreditsSpent}
                  />
                )}
              </div>
            ) : (
              <EmptyState mode={mode} onExample={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} />
            )}
          </div>
        </div>
      </div>
    </div>
    <VGSCheckoutModal
      open={checkoutOpen}
      onClose={() => setCheckoutOpen(false)}
      onSuccess={(credits, paymentId) => {
        console.log(`[VGS] Payment success: ${credits} credits, ID: ${paymentId}`);
        setCheckoutOpen(false);
      }}
    />
    </>
  );
}
