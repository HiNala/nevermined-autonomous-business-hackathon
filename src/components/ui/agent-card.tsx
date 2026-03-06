"use client";

import { CheckCircle2, ChevronDown, MinusCircle } from "lucide-react";
import { AGENT_CONFIG } from "@/lib/agent/config";

export type AgentStatus = "pending" | "active" | "completed" | "skipped";

const TOOL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  apify: { label: "Apify", color: "#00BFA5", bg: "rgba(0,191,165,0.12)" },
  exa: { label: "Exa", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  duckduckgo: { label: "DDG", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  raw: { label: "Raw", color: "var(--gray-500)", bg: "var(--glass-bg)" },
  nevermined: { label: "NVM", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  nanobanana: { label: "NanoBanana", color: "#CA8A04", bg: "rgba(234,179,8,0.12)" },
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  pending: "",
  active: "working",
  completed: "done",
  skipped: "skipped",
};

export function AgentCard({
  agent,
  isActive,
  isSelected,
  onClick,
  stats,
  toolLabel,
  index = 0,
  status,
  skipReason,
}: {
  agent: typeof AGENT_CONFIG.strategist;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  stats: { earned: number; handled: number };
  toolLabel?: string;
  index?: number;
  status?: AgentStatus;
  skipReason?: string;
}) {
  const badge = toolLabel ? TOOL_BADGE[toolLabel] : null;
  // Derive effective status: use explicit status if provided, fall back to isActive
  const effective: AgentStatus = status ?? (isActive ? "active" : "pending");
  const isSkipped = effective === "skipped";
  const isCompleted = effective === "completed";
  const isWorking = effective === "active";

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${isWorking ? "animate-breathe" : ""}`}
      style={{
        background: isSkipped ? "var(--bg-base)" : isSelected ? agent.bgColor : "var(--bg-elevated)",
        border: `1px solid ${isSkipped ? "var(--border-default)" : isSelected ? agent.borderColor : "var(--border-default)"}`,
        opacity: isSkipped ? 0.5 : 1,
        "--breathe-color": agent.color + "30",
        animationDelay: `${index * 100}ms`,
      } as React.CSSProperties}
      title={isSkipped && skipReason ? skipReason : undefined}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300"
        style={{
          background: isCompleted ? "#22C55E" : isWorking || isSelected ? agent.color : "transparent",
          opacity: isCompleted ? 0.7 : isWorking ? 1 : isSelected ? 0.5 : 0,
        }}
      />

      {/* Avatar */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-transform duration-200 group-hover:scale-105"
        style={{
          background: isSkipped ? "var(--bg-surface)" : agent.bgColor,
          color: isSkipped ? "var(--gray-300)" : agent.color,
          filter: isSkipped ? "grayscale(1)" : "none",
        }}
      >
        {agent.avatar}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[12px] font-semibold"
            style={{ color: isSkipped ? "var(--gray-400)" : "var(--gray-800)" }}
          >
            {agent.name}
          </span>
          {badge && !isSkipped && (
            <span
              className="rounded px-1 py-0.5 font-mono text-[7px] font-bold uppercase"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-400)" }}>
          {isSkipped && skipReason ? skipReason : agent.role}
        </p>
      </div>

      {/* Right status */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {isWorking ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-50" style={{ background: agent.color }} />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ background: agent.color }} />
            </span>
            <span className="font-mono text-[9px] font-semibold" style={{ color: agent.color }}>working</span>
          </span>
        ) : isCompleted ? (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={11} style={{ color: "#22C55E" }} />
            <span className="font-mono text-[9px] font-semibold" style={{ color: "#22C55E" }}>done</span>
          </span>
        ) : isSkipped ? (
          <span className="flex items-center gap-1.5">
            <MinusCircle size={11} style={{ color: "var(--gray-300)" }} />
            <span className="font-mono text-[9px]" style={{ color: "var(--gray-300)" }}>skipped</span>
          </span>
        ) : (
          <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>{stats.handled}t</span>
        )}
      </div>
    </button>
  );
}

export function AgentConnector({ isActive, color }: { isActive: boolean; color: string }) {
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
