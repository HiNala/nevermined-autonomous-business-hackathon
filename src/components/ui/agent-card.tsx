"use client";

import { ChevronDown } from "lucide-react";
import { AGENT_CONFIG } from "@/lib/agent/config";

const TOOL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  apify: { label: "Apify", color: "#00BFA5", bg: "rgba(0,191,165,0.12)" },
  exa: { label: "Exa", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  duckduckgo: { label: "DDG", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  raw: { label: "Raw", color: "var(--gray-500)", bg: "var(--glass-bg)" },
  nevermined: { label: "NVM", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  nanobanana: { label: "NanoBanana", color: "#CA8A04", bg: "rgba(234,179,8,0.12)" },
};

export function AgentCard({
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
