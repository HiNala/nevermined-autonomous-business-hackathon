"use client";

import { Bot, Sparkles, Search, Package } from "lucide-react";

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
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201, 125, 78, 0.30)";
                e.currentTarget.style.background = "rgba(201, 125, 78, 0.03)";
                e.currentTarget.style.boxShadow = "0 2px 12px -4px rgba(201, 125, 78, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold"
                style={{ background: "rgba(201,125,78,0.08)", color: "var(--accent-400)" }}
              >
                {i + 1}
              </span>
              <span className="text-[12px] leading-snug" style={{ color: "var(--gray-500)" }}>{ex}</span>
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
