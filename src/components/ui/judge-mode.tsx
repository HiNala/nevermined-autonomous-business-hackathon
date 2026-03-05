"use client";

import { Zap, Search, Package, ShoppingCart, Award } from "lucide-react";
import type { ToolSettings } from "@/lib/tool-settings";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";
type OutputType = "research" | "prd" | "plan" | "analysis" | "general";

export interface JudgePreset {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  mode: ViewMode;
  outputType: OutputType;
  toolOverrides: Partial<ToolSettings>;
  sponsors: string[];
  icon: typeof Zap;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const JUDGE_PRESETS: JudgePreset[] = [
  {
    id: "full-research",
    title: "Run Research Business",
    subtitle: "Full pipeline: Strategist → Researcher → Buyer → Report",
    prompt: "Research the current state of autonomous AI agent payments and commerce in 2025. Include key platforms, protocols, pricing models, and real-world adoption examples.",
    mode: "pipeline",
    outputType: "research",
    toolOverrides: {
      researcher: { search: "apify", scrape: "apify" },
      trading: { internalTrading: true, externalTrading: true, sellerEnabled: true },
    } as Partial<ToolSettings>,
    sponsors: ["Apify", "Nevermined", "ZeroClick"],
    icon: Search,
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.06)",
    borderColor: "rgba(14, 165, 233, 0.18)",
  },
  {
    id: "buy-external",
    title: "Buy External Asset",
    subtitle: "Buyer discovers and purchases marketplace data via Nevermined",
    prompt: "Analyze the top no-code AI automation platforms, their pricing, and target audiences. Purchase any relevant marketplace reports or datasets to enhance the analysis.",
    mode: "pipeline",
    outputType: "analysis",
    toolOverrides: {
      researcher: { search: "exa", scrape: "exa" },
      trading: { internalTrading: true, externalTrading: true, sellerEnabled: true },
    } as Partial<ToolSettings>,
    sponsors: ["Exa", "Nevermined"],
    icon: ShoppingCart,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.06)",
    borderColor: "rgba(245, 158, 11, 0.18)",
  },
  {
    id: "seller-order",
    title: "Fulfill External Order",
    subtitle: "Seller receives paid order → internal pipeline → delivery",
    prompt: "Generate a comprehensive competitive intelligence report on the developer tools market, covering key players, pricing strategies, and emerging trends in AI-powered development.",
    mode: "seller",
    outputType: "research",
    toolOverrides: {
      researcher: { search: "apify", scrape: "apify" },
      trading: { internalTrading: true, externalTrading: true, sellerEnabled: true },
    } as Partial<ToolSettings>,
    sponsors: ["Apify", "Nevermined"],
    icon: Package,
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.06)",
    borderColor: "rgba(239, 68, 68, 0.18)",
  },
];

interface JudgeModeProps {
  onSelect: (preset: JudgePreset) => void;
}

const SPONSOR_PILL_COLORS: Record<string, { bg: string; text: string }> = {
  Apify: { bg: "rgba(0, 191, 165, 0.10)", text: "#00BFA5" },
  Exa: { bg: "rgba(99, 102, 241, 0.10)", text: "#6366F1" },
  Nevermined: { bg: "rgba(34, 197, 94, 0.10)", text: "#22C55E" },
  ZeroClick: { bg: "rgba(245, 158, 11, 0.10)", text: "#F59E0B" },
};

export function JudgeMode({ onSelect }: JudgeModeProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Award size={13} style={{ color: "var(--accent-400)" }} />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--accent-400)" }}>
          Judge Demo Mode
        </span>
      </div>
      <div className="space-y-2">
        {JUDGE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:scale-[1.005]"
            style={{
              background: preset.bgColor,
              border: `1px solid ${preset.borderColor}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = preset.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = preset.borderColor;
            }}
          >
            <div
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${preset.color}15`, color: preset.color }}
            >
              <preset.icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
                  {preset.title}
                </span>
                <Zap size={9} style={{ color: preset.color }} />
              </div>
              <p className="mt-0.5 text-[10px] leading-snug" style={{ color: "var(--gray-400)" }}>
                {preset.subtitle}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {preset.sponsors.map((s) => {
                  const c = SPONSOR_PILL_COLORS[s] ?? { bg: "var(--glass-bg)", text: "var(--gray-500)" };
                  return (
                    <span
                      key={s}
                      className="rounded px-1.5 py-0.5 font-mono text-[8px] font-semibold"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {s}
                    </span>
                  );
                })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
