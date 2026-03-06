"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { STUDIO_AGENTS } from "@/data/mock-transactions";
import {
  Brain, PenLine, ShoppingBag, PackageCheck, ShoppingCart,
  ArrowRight, CheckCircle2, Zap, ChevronDown, ChevronUp,
  ImageIcon
} from "lucide-react";
import Link from "next/link";
import type { StudioAgent } from "@/types";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

interface AgentLiveStats {
  [agentId: string]: { creditsEarned: number; creditsSpent: number; requestsHandled: number };
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  "agent-strategist": Brain,
  "agent-researcher": PenLine,
  "agent-buyer": ShoppingBag,
  "agent-seller": PackageCheck,
  "agent-vision": ImageIcon,
};

const AGENT_PIPELINE_POSITION: Record<string, { stage: string; receives: string; produces: string; stageNum: string }> = {
  "agent-strategist": {
    stage: "Stage 2 in the canonical pipeline",
    receives: "Raw order intent from Seller",
    produces: "Structured execution brief",
    stageNum: "02",
  },
  "agent-researcher": {
    stage: "Stage 3 in the canonical pipeline",
    receives: "Structured brief from Interpreter",
    produces: "Composed report artifact",
    stageNum: "03",
  },
  "agent-buyer": {
    stage: "Stage 4 — optional enrichment branch",
    receives: "Enrichment request from Composer",
    produces: "Third-party assets for merging",
    stageNum: "04",
  },
  "agent-seller": {
    stage: "Stage 1 (intake) + Stage 5 (delivery)",
    receives: "External order via API or Store",
    produces: "Quality-gated delivery package",
    stageNum: "01→05",
  },
  "agent-vision": {
    stage: "Stage 6 — image generation post-Composer",
    receives: "Composed report title + summary",
    produces: "Hero image with quality score",
    stageNum: "06",
  },
};

const PIPELINE_MINI = [
  { label: "Seller", color: "#EF4444", icon: ShoppingCart },
  { label: "Interpreter", color: "#7C3AED", icon: Brain },
  { label: "Composer", color: "#0EA5E9", icon: PenLine },
  { label: "Buyer", color: "#F59E0B", icon: ShoppingBag, optional: true },
  { label: "Seller", color: "#EF4444", icon: PackageCheck },
  { label: "VISION", color: "#CA8A04", icon: ImageIcon, optional: true },
];

function PipelineMiniMap({ highlightAgent }: { highlightAgent: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PIPELINE_MINI.map((s, i) => {
        const isHighlighted =
          (highlightAgent === "agent-strategist" && s.label === "Interpreter") ||
          (highlightAgent === "agent-researcher" && s.label === "Composer") ||
          (highlightAgent === "agent-buyer" && s.label === "Buyer") ||
          (highlightAgent === "agent-seller" && s.label === "Seller") ||
          (highlightAgent === "agent-vision" && s.label === "VISION");

        return (
          <div key={`${s.label}-${i}`} className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[8px] font-semibold transition-all"
              style={{
                background: isHighlighted ? `${s.color}20` : "var(--bg-surface)",
                color: isHighlighted ? s.color : "var(--gray-400)",
                border: `1px solid ${isHighlighted ? s.color + "40" : "var(--border-default)"}`,
                opacity: s.optional && !isHighlighted ? 0.5 : 1,
              }}
            >
              <s.icon size={8} />
              {s.label}
              {s.optional && <span className="opacity-60">*</span>}
            </div>
            {i < PIPELINE_MINI.length - 1 && (
              <ArrowRight size={8} style={{ color: "var(--gray-300)", flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnimatedAgentStats({ real, accentColor }: { real: { creditsEarned: number; creditsSpent: number; requestsHandled: number }; accentColor: string }) {
  const runs   = useAnimatedCounter(real.requestsHandled, 900, 80);
  const spent  = useAnimatedCounter(real.creditsSpent,    1000, 130);
  const earned = useAnimatedCounter(real.creditsEarned,  1100, 180);
  return (
    <>
      <div className="text-center">
        <p className="font-mono text-sm font-bold" style={{ color: "var(--gray-900)" }}>{runs}</p>
        <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>runs</p>
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-bold" style={{ color: "var(--gray-900)" }}>{spent}</p>
        <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>spent</p>
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-bold" style={{ color: accentColor }}>{earned}cr</p>
        <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>earned</p>
      </div>
    </>
  );
}

function AgentDetailCard({ agent, index, liveStats }: { agent: StudioAgent; index: number; liveStats: AgentLiveStats | null }) {
  const [expanded, setExpanded] = useState(false);
  const agentKey = agent.id.replace("agent-", "");
  const real = liveStats?.[agentKey];
  const hasActivity = real && real.requestsHandled > 0;
  const Icon = AGENT_ICONS[agent.id] ?? Brain;
  const position = AGENT_PIPELINE_POSITION[agent.id];

  const ctaHref =
    agent.id === "agent-strategist" ? "/studio?mode=strategist" :
    agent.id === "agent-researcher" ? "/studio?mode=researcher" :
    agent.id === "agent-seller" ? "/store" :
    agent.id === "agent-vision" ? "/studio" :
    "/studio";

  return (
    <div
      className="glass relative overflow-hidden transition-all duration-300"
      style={{
        borderColor: agent.primary ? `${agent.accentColor}35` : "var(--glass-border)",
        boxShadow: agent.primary ? `0 0 30px -12px ${agent.accentColor}18` : "none",
      }}
    >
      {/* Top colored accent bar */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accentColor}70, transparent)` }}
      />

      <div className="p-4 sm:p-6">
        {/* Compact card: always visible */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${agent.accentColor}12`, border: `1px solid ${agent.accentColor}20` }}
          >
            <Icon size={20} style={{ color: agent.accentColor }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-mono text-[15px] font-bold tracking-wide" style={{ color: "var(--gray-900)" }}>
                {agent.name}
              </h2>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest"
                style={{ background: `${agent.accentColor}10`, color: agent.accentColor, border: `1px solid ${agent.accentColor}25` }}
              >
                {position.stageNum}
              </span>
              <span className="text-[11px]" style={{ color: "var(--gray-400)" }}>{agent.specialty}</span>
              {hasActivity && (
                <span className="flex items-center gap-1 ml-auto">
                  <span className="pulse-dot" />
                  <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>{real.requestsHandled} runs · {real.creditsEarned}cr</span>
                </span>
              )}
            </div>

            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              {agent.summary}
            </p>

            {/* Compact footer: credit badge + CTA + expand toggle */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {agent.startingCredits > 0 && (
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold" style={{ color: agent.accentColor }}>
                  <Zap size={10} /> from {agent.startingCredits}cr
                </span>
              )}
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200"
                style={{ background: `${agent.accentColor}12`, color: agent.accentColor, border: `1px solid ${agent.accentColor}22` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${agent.accentColor}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${agent.accentColor}12`; }}
              >
                {agent.ctaLabel}
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-auto flex items-center gap-1 font-mono text-[9px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: expanded ? agent.accentColor : "var(--gray-400)" }}
              >
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {expanded ? "Less" : "Details"}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded details — hidden by default */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 border-t pt-5 space-y-5"
            style={{ borderColor: "var(--border-default)" }}
          >
            {/* Pipeline position + handoff */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <p className="mb-2 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Pipeline</p>
                <PipelineMiniMap highlightAgent={agent.id} />
              </div>
              <div className="rounded-xl p-3" style={{ background: `${agent.accentColor}05`, border: `1px solid ${agent.accentColor}15` }}>
                <p className="mb-1 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Receives</p>
                <p className="text-[11px] font-medium" style={{ color: "var(--gray-700)" }}>{position.receives}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: `${agent.accentColor}05`, border: `1px solid ${agent.accentColor}15` }}>
                <p className="mb-1 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Produces</p>
                <p className="text-[11px] font-medium" style={{ color: agent.accentColor }}>{position.produces}</p>
              </div>
            </div>

            {/* Outputs + stats row */}
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="mb-2 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Outputs</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.outputs.map((output) => (
                    <span key={output} className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium" style={{ background: "var(--bg-elevated)", color: "var(--gray-600)", border: "1px solid var(--border-default)" }}>
                      <CheckCircle2 size={9} style={{ color: agent.accentColor }} />
                      {output}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats — only show when there's actual activity */}
              {hasActivity && (
                <div className="grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                  <AnimatedAgentStats real={real} accentColor={agent.accentColor} />
                </div>
              )}
            </div>

            {/* Technical details */}
            <div className="space-y-1.5">
              <p className="font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>Technical</p>
              {agent.id === "agent-strategist" && (
                <>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• LLM infers missing fields · Typed StructuredBrief with scoring + routing</p>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• Workspace profile injection · Brief quality gate (regenerates on C/D grade)</p>
                </>
              )}
              {agent.id === "agent-researcher" && (
                <>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• 5-path fallback: Exa → Apify → DuckDuckGo → raw fetch</p>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• Source scoring (freshness, authority, relevance) · Contradiction detection</p>
                </>
              )}
              {agent.id === "agent-buyer" && (
                <>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• Nevermined marketplace discovery via x402 · Value-ranks by relevance + price</p>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• Purchase rationale + approval threshold · Demo fallback assets</p>
                </>
              )}
              {agent.id === "agent-seller" && (
                <>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• x402 payment validation · 7-state job lifecycle</p>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• 5-check quality gate · 3 delivery variants (full, summary, JSON)</p>
                </>
              )}
              {agent.id === "agent-vision" && (
                <>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• NanoBanana API (Gemini) · GPT-4o-mini vision judge (0–100)</p>
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>• Up to 3 attempts with prompt refinement · Unsplash fallback</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Compressed Upgrade Summary ──────────────────────────────────────────────

const UPGRADE_HIGHLIGHTS = [
  { name: "Interpreter", color: "#7C3AED", icon: Brain, metric: "≥ B grade or regenerate", detail: "Brief scoring, clarification mode, workspace-aware context" },
  { name: "Composer", color: "#0EA5E9", icon: PenLine, metric: "0–10 per source", detail: "2-pass synthesis, source scoring, contradiction detection" },
  { name: "Buyer", color: "#F59E0B", icon: ShoppingBag, metric: "Cost threshold gate", detail: "Value-ranked procurement, purchase rationale, demo fallback" },
  { name: "Seller", color: "#EF4444", icon: PackageCheck, metric: "5 quality checks", detail: "7-state lifecycle, 3 delivery variants, x402 validation" },
  { name: "VISION", color: "#CA8A04", icon: ImageIcon, metric: "Up to 3 attempts", detail: "NanoBanana + GPT-4o judge, prompt refinement, Unsplash fallback" },
];

function PlaybookSection() {
  return (
    <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>Upgrade Summary</span>
        </div>
        <h2 className="mb-1 text-[22px] font-semibold tracking-tight sm:text-[26px]" style={{ color: "var(--gray-900)" }}>
          Smarter at every stage.{" "}<span className="text-gradient-accent">Not just more.</span>
        </h2>
        <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          Each agent is stateful, explainable, and quality-gated — no added complexity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {UPGRADE_HIGHLIGHTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.name}
              className="rounded-xl p-4 transition-all duration-200"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${agent.color}35`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex size-7 items-center justify-center rounded-lg"
                  style={{ background: `${agent.color}12` }}
                >
                  <Icon size={13} style={{ color: agent.color }} />
                </div>
                <span className="text-[12px] font-bold" style={{ color: "var(--gray-900)" }}>{agent.name}</span>
              </div>
              <p className="mb-1.5 font-mono text-[10px] font-semibold" style={{ color: agent.color }}>{agent.metric}</p>
              <p className="text-[10px] leading-snug" style={{ color: "var(--gray-500)" }}>{agent.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AgentsPage() {
  const [liveStats, setLiveStats] = useState<AgentLiveStats | null>(null);

  useEffect(() => {
    fetch("/api/pipeline/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.agents) setLiveStats(d.agents); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Nav />
      <ErrorBoundary>
      <main className="pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          {/* Page header — renders immediately, no animation delay */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>Agent Architecture</span>
            </div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--gray-900)" }}>
              Five agents.{" "}<span className="text-gradient-accent">One pipeline.</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
              The Seller accepts and delivers. The Interpreter structures intent. The Composer builds the report.
              The Buyer enriches when needed. VISION generates images. One job each, one clear handoff.
            </p>
          </div>

          {/* Canonical flow bar — no delay */}
          <div
            className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl px-5 py-3"
            style={{ background: "rgba(201,125,78,0.04)", border: "1px solid rgba(201,125,78,0.12)" }}
          >
            {[
              { label: "Seller intake", color: "#EF4444", icon: ShoppingCart },
              { label: "Interpreter structures", color: "#7C3AED", icon: Brain },
              { label: "Composer builds", color: "#0EA5E9", icon: PenLine },
              { label: "Buyer enriches", color: "#F59E0B", icon: ShoppingBag, optional: true },
              { label: "Seller delivers", color: "#EF4444", icon: PackageCheck },
            ].map((s, i, arr) => (
              <div key={`${s.label}-${i}`} className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                  style={{
                    background: `${s.color}10`,
                    color: s.color,
                    border: `1px solid ${s.color}25`,
                    opacity: s.optional ? 0.7 : 1,
                  }}
                >
                  <s.icon size={12} />
                  {s.label}
                  {s.optional && <span className="font-mono text-[8px] opacity-60">opt</span>}
                </span>
                {i < arr.length - 1 && <ArrowRight size={12} style={{ color: "var(--gray-300)" }} />}
              </div>
            ))}
          </div>

          {/* Agent cards */}
          <div className="flex flex-col gap-4">
            {STUDIO_AGENTS.map((agent, i) => (
              <AgentDetailCard key={agent.id} agent={agent} index={i} liveStats={liveStats} />
            ))}
          </div>
        </div>

        {/* Playbook Expansion Section */}
        <PlaybookSection />

        {/* Slim Studio CTA — secondary handoff */}
        <div className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
          <div
            className="flex flex-col items-center gap-3 rounded-xl px-6 py-8 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <p className="text-[15px] font-medium" style={{ color: "var(--gray-700)" }}>
              Put these agents to work.
            </p>
            <p className="max-w-md text-[13px]" style={{ color: "var(--gray-400)" }}>
              Describe any task in the Studio and the full pipeline handles it end to end.
            </p>
            <Link
              href="/studio"
              className="group mt-1 flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-all duration-200"
              style={{ background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))", boxShadow: "0 0 20px -4px rgba(201,125,78,0.28)" }}
            >
              Open Studio
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </main>
      </ErrorBoundary>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
