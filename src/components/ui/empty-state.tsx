"use client";

import { Bot, Sparkles, Search, Package } from "lucide-react";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";

export const EXAMPLE_PROMPTS: Record<ViewMode, string[]> = {
  pipeline: [
    "What are the best AI agent frameworks in 2025?",
    "Research the market for no-code automation tools",
    "Analyze competitors to Notion for team knowledge bases",
    "Write a product plan for a SaaS invoice tool",
    "Research emerging trends in autonomous AI payments",
    "Analyze the future of autonomous AI agents in financial markets — generates hero image via VISION",
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
