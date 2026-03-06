"use client";

import { Bot, Sparkles, Search, Package, ArrowRight } from "lucide-react";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";

export const EXAMPLE_PROMPTS: Record<ViewMode, string[]> = {
  pipeline: [
    "Research the market for no-code automation tools",
    "Analyze competitors to Notion for team knowledge bases",
    "Write a product plan for a SaaS invoice tool",
  ],
  strategist: [
    "Structure a brief for a developer API go-to-market launch",
    "Build an execution brief for market entry into healthcare AI",
    "Define scope and sections for a mobile app MVP deliverable",
  ],
  researcher: [
    "What are the top Nevermined use cases in 2025?",
    "Find recent research on LLM agent architectures",
    "Compare Exa, Perplexity, and Tavily for AI search",
  ],
  seller: [
    "Generate a deep research report on AI agent frameworks",
    "Create a market analysis for autonomous payment systems",
    "Write a strategic plan for entering the developer tools market",
  ],
};

const EMPTY_STATE_CONFIG: Record<ViewMode, { icon: React.ElementType; title: string; desc: string }> = {
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

export function EmptyState({ mode, onExample }: { mode: ViewMode; onExample: (p: string) => void }) {
  const c = EMPTY_STATE_CONFIG[mode];
  const examples = EXAMPLE_PROMPTS[mode];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center animate-fade-up">
      {/* Icon with pulse ring + radial glow */}
      <div className="relative flex size-20 items-center justify-center">
        <div
          className="absolute -inset-6 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201, 125, 78, 0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "rgba(201, 125, 78, 0.05)", border: "1px solid rgba(201, 125, 78, 0.10)" }}
        />
        <div
          className="absolute -inset-1 rounded-[18px] animate-breathe"
          style={{ "--breathe-color": "rgba(201, 125, 78, 0.12)" } as React.CSSProperties}
        />
        <c.icon size={28} style={{ color: "var(--accent-400)" }} />
      </div>

      <div>
        <h3 className="mb-2 text-xl font-semibold tracking-tight" style={{ color: "var(--gray-800)" }}>{c.title}</h3>
        <p className="text-balance max-w-md text-[13px] leading-relaxed" style={{ color: "var(--gray-400)" }}>{c.desc}</p>
      </div>

      {/* Try these — styled as numbered selectable templates */}
      <div className="w-full max-w-md">
        <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-300)" }}>
          Try one of these
        </p>
        <div className="flex flex-col gap-2">
          {examples.map((ex, i) => (
            <button
              key={ex}
              onClick={() => onExample(ex)}
              className="card-lift focus-ring group flex items-center gap-3 rounded-xl px-4 py-3 text-left"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold transition-colors duration-200 group-hover:bg-[rgba(201,125,78,0.14)]"
                style={{ background: "rgba(201,125,78,0.08)", color: "var(--accent-400)" }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-[12px] leading-snug transition-colors duration-200 group-hover:text-[var(--gray-700)]" style={{ color: "var(--gray-500)" }}>{ex}</span>
              <ArrowRight size={12} className="shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-60 group-hover:translate-x-0.5" style={{ color: "var(--accent-400)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="flex items-center gap-1.5">
        <kbd
          className="rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--gray-400)" }}
        >
          ↵ Enter
        </kbd>
        <span className="font-mono text-[9px]" style={{ color: "var(--gray-300)" }}>to run</span>
        <span className="mx-1 font-mono text-[9px]" style={{ color: "var(--gray-200)" }}>·</span>
        <kbd
          className="rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--gray-400)" }}
        >
          ⇧ Shift+↵
        </kbd>
        <span className="font-mono text-[9px]" style={{ color: "var(--gray-300)" }}>for newline</span>
      </div>
    </div>
  );
}
