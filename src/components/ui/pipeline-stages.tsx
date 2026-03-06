"use client";

import { useRef, useEffect } from "react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { AGENT_CONFIG } from "@/lib/agent/config";
import type { PipelineEvent, AgentTransaction } from "@/types/pipeline";

// ─── Sponsor badge helpers ───────────────────────────────────────────
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

// ─── Job lifecycle stages ────────────────────────────────────────────
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

      <div className="flex flex-col gap-0">
        {JOB_STAGES.map((stage, i) => {
          const status = getStageStatus(stage.id, events, isRunning);
          const isOptionalSkipped = stage.optional && status === "idle" && !buyerUsed && (isDone || isRunning);

          return (
            <div key={stage.id}>
              <div
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-300"
                style={{
                  background: status === "active" ? stage.bg : status === "complete" ? `${stage.color}05` : "transparent",
                  border: `1px solid ${status === "active" ? stage.border : status === "complete" ? `${stage.color}10` : "transparent"}`,
                  opacity: isOptionalSkipped ? 0.35 : 1,
                }}
              >
                <div className="relative flex shrink-0 items-center justify-center">
                  {status === "active" ? (
                    <span className="relative flex size-3">
                      <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ background: stage.color }} />
                      <span className="relative inline-flex size-3 rounded-full" style={{ background: stage.color }} />
                    </span>
                  ) : status === "complete" ? (
                    <span className="size-3 rounded-full flex items-center justify-center" style={{ background: stage.color }}>
                      <Check size={7} color="white" />
                    </span>
                  ) : (
                    <span className="size-3 rounded-full" style={{ background: "var(--border-default)" }} />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: status === "active" ? stage.color : status === "complete" ? "var(--gray-700)" : "var(--gray-400)" }}
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

                {status === "active" && (
                  <span className="font-mono text-[8px] font-semibold" style={{ color: stage.color }}>working…</span>
                )}
                {status === "complete" && (
                  <span className="font-mono text-[8px]" style={{ color: "#22C55E" }}>done</span>
                )}
                {isOptionalSkipped && (
                  <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>skipped</span>
                )}
              </div>

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

const STAGE_COLORS: Record<string, string> = {
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

export function PipelineStages({ events, isRunning }: { events: PipelineEvent[]; isRunning: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

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
      <JobStateMachine events={events} isRunning={isRunning} />
      <div className="mx-3 border-t" style={{ borderColor: "var(--border-default)" }} />
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
                style={{ background: STAGE_COLORS[event.stage] ?? "var(--gray-400)" }}
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
                    <span className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase" style={{ background: badge.bg, color: badge.color }}>
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
                        <span className="rounded px-1.5 py-0.5 font-mono text-[7px] font-semibold" style={{ background: "rgba(245,158,11,0.10)", color: "#F59E0B" }}>
                          {credits}cr external
                        </span>
                      )}
                      {names.map((name, i) => (
                        <span key={i} className="rounded px-1.5 py-0.5 font-mono text-[7px]" style={{ background: "var(--glass-bg)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}>
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

export function TransactionFeed({ transactions }: { transactions: AgentTransaction[] }) {
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
            style={{ borderColor: "var(--border-default)", background: marketplace ? "rgba(34, 197, 94, 0.02)" : "transparent" }}
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
                <span className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase" style={{ background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", border: "1px solid rgba(34, 197, 94, 0.22)" }}>
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
                <p className="truncate text-[10px]" style={{ color: "var(--gray-400)" }}>{tx.purpose}</p>
              )}
              {tx.status === "completed" && marketplace && (
                <span className="shrink-0 font-mono text-[7px]" style={{ color: "#22C55E" }}>✓ settled</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
