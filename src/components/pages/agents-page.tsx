"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { StudioEntry } from "@/components/sections/studio-entry";
import { STUDIO_AGENTS } from "@/data/mock-transactions";
import {
  Brain, PenLine, ShoppingBag, PackageCheck, ShoppingCart,
  ArrowRight, CheckCircle2, Zap, ChevronDown, ChevronUp,
  ShieldOff, Sparkles, AlertCircle, ToggleLeft, ToggleRight
} from "lucide-react";
import Link from "next/link";
import type { StudioAgent } from "@/types";

interface AgentLiveStats {
  [agentId: string]: { creditsEarned: number; creditsSpent: number; requestsHandled: number };
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  "agent-strategist": Brain,
  "agent-researcher": PenLine,
  "agent-buyer": ShoppingBag,
  "agent-seller": PackageCheck,
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
};

const PIPELINE_MINI = [
  { label: "Seller", color: "#EF4444", icon: ShoppingCart },
  { label: "Interpreter", color: "#7C3AED", icon: Brain },
  { label: "Composer", color: "#0EA5E9", icon: PenLine },
  { label: "Buyer", color: "#F59E0B", icon: ShoppingBag, optional: true },
  { label: "Seller", color: "#EF4444", icon: PackageCheck },
];

function PipelineMiniMap({ highlightAgent }: { highlightAgent: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PIPELINE_MINI.map((s, i) => {
        const isHighlighted =
          (highlightAgent === "agent-strategist" && s.label === "Interpreter") ||
          (highlightAgent === "agent-researcher" && s.label === "Composer") ||
          (highlightAgent === "agent-buyer" && s.label === "Buyer") ||
          (highlightAgent === "agent-seller" && s.label === "Seller");

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

function AgentDetailCard({ agent, index, liveStats }: { agent: StudioAgent; index: number; liveStats: AgentLiveStats | null }) {
  const [expanded, setExpanded] = useState(false);
  const agentKey = agent.id.replace("agent-", "");
  const real = liveStats?.[agentKey];
  const Icon = AGENT_ICONS[agent.id] ?? Brain;
  const position = AGENT_PIPELINE_POSITION[agent.id];

  const ctaHref =
    agent.id === "agent-strategist" ? "/studio?mode=strategist" :
    agent.id === "agent-researcher" ? "/studio?mode=researcher" :
    agent.id === "agent-seller" ? "/store" :
    "/studio";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative overflow-hidden transition-all duration-300"
      style={{
        borderColor: agent.primary ? `${agent.accentColor}35` : "var(--glass-border)",
        boxShadow: agent.primary ? `0 0 40px -12px ${agent.accentColor}18` : "none",
      }}
    >
      {/* Top colored accent bar */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accentColor}70, transparent)` }}
      />

      <div className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">

          {/* Left column: Identity */}
          <div className="flex flex-col gap-5 lg:w-72 lg:shrink-0">
            {/* Stage badge */}
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest"
                style={{
                  background: `${agent.accentColor}10`,
                  color: agent.accentColor,
                  border: `1px solid ${agent.accentColor}25`,
                }}
              >
                {position.stageNum}
              </span>
              <span className="text-[10px]" style={{ color: "var(--gray-400)" }}>{position.stage}</span>
            </div>

            {/* Name + icon */}
            <div className="flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${agent.accentColor}12`, border: `1px solid ${agent.accentColor}20` }}
              >
                <Icon size={26} style={{ color: agent.accentColor }} />
              </div>
              <div>
                <h2 className="font-mono text-2xl font-bold tracking-wider" style={{ color: "var(--gray-900)" }}>
                  {agent.name}
                </h2>
                <span className="text-[12px] font-medium" style={{ color: "var(--gray-400)" }}>{agent.specialty}</span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              {agent.summary}
            </p>

            {/* Credit badge */}
            {agent.startingCredits > 0 && (
              <div className="flex items-center gap-2">
                <Zap size={12} style={{ color: agent.accentColor }} />
                <span className="font-mono text-[11px] font-semibold" style={{ color: agent.accentColor }}>
                  from {agent.startingCredits} credit
                </span>
              </div>
            )}

            {/* Live stats */}
            {real && (
              <div
                className="grid grid-cols-3 gap-2 rounded-xl p-3"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
              >
                <div className="text-center">
                  <p className="font-mono text-sm font-bold" style={{ color: "var(--gray-900)" }}>{real.requestsHandled}</p>
                  <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>runs</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm font-bold" style={{ color: "var(--gray-900)" }}>{real.creditsSpent}</p>
                  <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>spent</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm font-bold" style={{ color: "var(--accent-400)" }}>{real.creditsEarned}cr</p>
                  <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>earned</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: Outputs + pipeline position */}
          <div className="flex flex-1 flex-col gap-6">

            {/* Pipeline position mini-map */}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                Position in pipeline
              </p>
              <PipelineMiniMap highlightAgent={agent.id} />
            </div>

            {/* Handoff contracts */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-xl p-4"
                style={{ background: `${agent.accentColor}05`, border: `1px solid ${agent.accentColor}15` }}
              >
                <p className="mb-1.5 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>receives</p>
                <p className="text-[12px] font-medium" style={{ color: "var(--gray-700)" }}>{position.receives}</p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: `${agent.accentColor}05`, border: `1px solid ${agent.accentColor}15` }}
              >
                <p className="mb-1.5 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>produces</p>
                <p className="text-[12px] font-medium" style={{ color: agent.accentColor }}>{position.produces}</p>
              </div>
            </div>

            {/* Outputs */}
            <div>
              <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                Artifact outputs
              </p>
              <div className="flex flex-wrap gap-2">
                {agent.outputs.map((output) => (
                  <span
                    key={output}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium"
                    style={{ background: "var(--bg-elevated)", color: "var(--gray-600)", border: "1px solid var(--border-default)" }}
                  >
                    <CheckCircle2 size={10} style={{ color: agent.accentColor }} />
                    {output}
                  </span>
                ))}
              </div>
            </div>

            {/* Expandable technical details */}
            <div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 font-mono text-[10px] transition-opacity hover:opacity-70"
                style={{ color: "var(--gray-400)" }}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Hide" : "Show"} technical details
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 space-y-2"
                >
                  {agent.id === "agent-strategist" && (
                    <>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Uses LLM to infer missing fields from vague input</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Outputs a typed <code className="font-mono text-[10px]">StructuredBrief</code> with scoring + routing hints</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Can inject workspace profile context for personalization</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Scores brief quality (clarity, specificity, answerability)</p>
                    </>
                  )}
                  {agent.id === "agent-researcher" && (
                    <>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• 5-path search fallback: Exa → Apify → DuckDuckGo → raw fetch</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Scores each source for freshness, authority, and relevance</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Generates a confidence summary with contradiction detection</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Outputs typed <code className="font-mono text-[10px]">ResearchDocument</code> with provenance</p>
                    </>
                  )}
                  {agent.id === "agent-buyer" && (
                    <>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Discovers assets on Nevermined marketplace via x402</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Value-ranks candidates by relevance, price, and information gain</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Generates purchase rationale and approval threshold checks</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Only runs when Composer or Seller policy requires enrichment</p>
                    </>
                  )}
                  {agent.id === "agent-seller" && (
                    <>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Public API boundary — validates x402 payment signature</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Creates persistent job with state machine lifecycle</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Runs 5-check quality gate before packaging delivery</p>
                      <p className="text-[12px]" style={{ color: "var(--gray-500)" }}>• Packages into 3 delivery variants: full report, summary, JSON</p>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all duration-200"
                style={{
                  background: `${agent.accentColor}12`,
                  color: agent.accentColor,
                  border: `1px solid ${agent.accentColor}22`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${agent.accentColor}22`;
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 4px 16px -4px ${agent.accentColor}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${agent.accentColor}12`;
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {agent.ctaLabel}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Playbook Expansion Section ───────────────────────────────────────────────

const AGENT_EXPANSIONS = [
  {
    id: "agent-strategist",
    name: "Strategist",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.06)",
    border: "rgba(124,58,237,0.20)",
    icon: Brain,
    headline: "Request Intelligence",
    shipped: [
      "Brief scoring (clarity, specificity, answerability, sourceability)",
      "Routing inference — recommendedMode, recommendedDepth, enrichmentLikelihood",
      "Clarification mode — asks 1–2 questions before running ambiguous jobs",
      "Workspace-aware briefing — injects company, market, competitors per run",
      "5 candidate output templates detected from input intent",
      "Self-regeneration — reruns if brief scores C/D grade",
    ],
    metric: { label: "Brief quality gate", value: "≥ B grade or regenerate" },
  },
  {
    id: "agent-researcher",
    name: "Composer",
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.06)",
    border: "rgba(14,165,233,0.20)",
    icon: PenLine,
    headline: "Evidence & Composition Engine",
    shipped: [
      "2-pass generation: outline pass → full synthesis pass",
      "Source scoring — freshness, authority, relevance, overall quality",
      "Contradiction detector — flags conflicting evidence across sources",
      "Confidence summary: level, source count, freshness, uncertainties",
      "Section-level citations — attributes claims to source index",
      "5-path search fallback: Exa → Apify → DuckDuckGo → raw fetch",
    ],
    metric: { label: "Source scoring", value: "0–10 per source, sorted by quality" },
  },
  {
    id: "agent-buyer",
    name: "Buyer",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.20)",
    icon: ShoppingBag,
    headline: "Budget-Aware Enrichment Specialist",
    shipped: [
      "Value-based asset ranking — relevance, price-value, information gain",
      "Purchase rationale per asset — explains gap filled and why worth it",
      "Approval threshold — flags high-cost buys before transacting",
      "Demo fallback assets — 3 curated enrichment assets when marketplace empty",
      "Composite scoring (weighted: relevance 50%, price 25%, info gain 25%)",
      "Asset outcome tracking for future quality analysis",
    ],
    metric: { label: "Approval threshold", value: "Flags buys above cost limit" },
  },
  {
    id: "agent-seller",
    name: "Seller",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.20)",
    icon: PackageCheck,
    headline: "Job Owner & Delivery Boundary",
    shipped: [
      "7-state job lifecycle: received → planning → researching → enriching → packaging → delivered → failed",
      "Delivery package with 3 variants: full report, executive brief, JSON artifact",
      "5-check quality gate before delivery (completeness, citations, external disclosure)",
      "Versioned handoff contracts with schemaVersion, jobId, traceId",
      "IncomingOrder contract validated before any pipeline work begins",
      "External buyer API with idempotency and stable schemas",
    ],
    metric: { label: "Quality gate", value: "5 checks before every delivery" },
  },
];

function PlaybookSection() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-20 max-w-6xl px-6"
    >
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>AGENT EXPANSION PLAYBOOK</span>
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--gray-900)" }}>
          Smarter at every stage. <span className="text-gradient-accent">Not just more.</span>
        </h2>
        <p className="max-w-2xl text-[14px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
          Each agent has been upgraded to be more stateful, more explainable, and more useful in real workflows —
          without adding complexity or new agents. Click any card to see exactly what shipped.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AGENT_EXPANSIONS.map((agent, i) => {
          const isOpen = activeAgent === agent.id;
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
              style={{
                background: isOpen ? agent.bg : "var(--bg-surface)",
                border: `1px solid ${isOpen ? agent.border : "var(--border-default)"}`,
                boxShadow: isOpen ? `0 8px 32px -8px ${agent.color}20` : "none",
              }}
              onClick={() => setActiveAgent(isOpen ? null : agent.id)}
              onMouseEnter={(e) => {
                if (!isOpen) {
                  e.currentTarget.style.borderColor = `${agent.color}35`;
                  e.currentTarget.style.background = agent.bg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isOpen) {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.background = "var(--bg-surface)";
                }
              }}
            >
              {/* Card header */}
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex size-9 items-center justify-center rounded-xl"
                    style={{ background: `${agent.color}14`, border: `1px solid ${agent.color}25` }}
                  >
                    <Icon size={16} style={{ color: agent.color }} />
                  </div>
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200"
                    style={{ color: "var(--gray-400)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>

                <h3 className="mb-0.5 text-[14px] font-bold" style={{ color: "var(--gray-900)" }}>{agent.name}</h3>
                <p className="text-[11px] font-medium" style={{ color: agent.color }}>{agent.headline}</p>

                {/* Key metric chip */}
                <div
                  className="mt-3 rounded-lg px-2.5 py-1.5"
                  style={{ background: `${agent.color}08`, border: `1px solid ${agent.color}18` }}
                >
                  <p className="font-mono text-[8px] uppercase tracking-wider mb-0.5" style={{ color: "var(--gray-400)" }}>
                    {agent.metric.label}
                  </p>
                  <p className="font-mono text-[10px] font-semibold" style={{ color: agent.color }}>
                    {agent.metric.value}
                  </p>
                </div>
              </div>

              {/* Expandable shipped features */}
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t px-5 pb-5 pt-4"
                  style={{ borderColor: `${agent.color}20` }}
                >
                  <p className="mb-2.5 font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                    Shipped capabilities
                  </p>
                  <div className="space-y-2">
                    {agent.shipped.map((item, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: agent.color }} />
                        <p className="text-[11px] leading-snug" style={{ color: "var(--gray-600)" }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Design filter note */}
      <div
        className="mt-6 flex items-start gap-4 rounded-2xl px-6 py-5"
        style={{ background: "rgba(201,125,78,0.04)", border: "1px solid rgba(201,125,78,0.12)" }}
      >
        <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent-400)" }} />
        <div>
          <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--gray-800)" }}>
            The expansion design filter
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            Every capability added passes the same test: does it expand user capability, reduce friction, make the system more trustworthy, and remain useful weekly — not just in a demo?
            More agents ≠ more intelligence. Better agents do.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Enrichment Explainer ─────────────────────────────────────────────────────

function EnrichmentExplainer() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-20 max-w-6xl px-6"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>BUYER ENRICHMENT</span>
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--gray-900)" }}>
          Two execution contexts. <span className="text-gradient-accent">One clear boundary.</span>
        </h2>
        <p className="max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
          The Seller decides whether external enrichment is needed. The Buyer only acts when the Seller calls it.
          Which context runs depends on a single setting — <span className="font-mono text-[12px]" style={{ color: "var(--gray-700)" }}>External Marketplace</span>.
        </p>
      </div>

      {/* Two context cards */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* Context A — UI Demo Mode */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.18)" }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.22)" }}
                >
                  Context A
                </span>
                <span className="font-mono text-[9px] font-semibold" style={{ color: "#6366F1" }}>UI Demo Mode</span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
                Safe for judges, demos, and internal reviews
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
              <ToggleLeft size={14} style={{ color: "#6366F1" }} />
              <span className="font-mono text-[9px] font-semibold" style={{ color: "#6366F1" }}>Marketplace OFF</span>
            </div>
          </div>

          {/* Flow */}
          <div className="mb-4 space-y-2">
            {[
              { agent: "Seller", color: "#EF4444", note: "Receives order, plans fulfillment" },
              { agent: "Interpreter", color: "#7C3AED", note: "Structures execution brief" },
              { agent: "Composer", color: "#0EA5E9", note: "Builds research report" },
              { agent: "Buyer", color: "#9CA3AF", note: "Evaluates enrichment — skipped (demo)", skipped: true },
              { agent: "Seller", color: "#EF4444", note: "Packages and delivers" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[8px] font-bold"
                  style={{
                    background: step.skipped ? "var(--bg-surface)" : `${step.color}14`,
                    color: step.skipped ? "var(--gray-300)" : step.color,
                    border: `1px solid ${step.skipped ? "var(--border-default)" : step.color + "30"}`,
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <span
                    className="font-mono text-[10px] font-semibold"
                    style={{ color: step.skipped ? "var(--gray-300)" : step.color, textDecoration: step.skipped ? "line-through" : "none", opacity: step.skipped ? 0.5 : 1 }}
                  >
                    {step.agent}
                  </span>
                  <span className="text-[10px]" style={{ color: step.skipped ? "var(--gray-300)" : "var(--gray-500)", opacity: step.skipped ? 0.5 : 1 }}>
                    — {step.note}
                  </span>
                  {step.skipped && (
                    <span
                      className="ml-auto rounded px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase"
                      style={{ background: "rgba(99,102,241,0.10)", color: "#6366F1" }}
                    >
                      skipped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
          >
            <ShieldOff size={12} className="mt-0.5 shrink-0" style={{ color: "#6366F1" }} />
            <p className="text-[10px] leading-snug" style={{ color: "#6366F1" }}>
              Seller narrates the enrichment decision in the event log, but no real transactions occur.
              Output quality is still high — just without third-party data.
            </p>
          </div>
        </div>

        {/* Context B — Agentic Live Mode */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.22)" }}
                >
                  Context B
                </span>
                <span className="font-mono text-[9px] font-semibold" style={{ color: "#F59E0B" }}>Agentic Live Mode</span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
                Real procurement via Nevermined x402 payments
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <ToggleRight size={14} style={{ color: "#F59E0B" }} />
              <span className="font-mono text-[9px] font-semibold" style={{ color: "#F59E0B" }}>Marketplace ON</span>
            </div>
          </div>

          {/* Flow */}
          <div className="mb-4 space-y-2">
            {[
              { agent: "Seller", color: "#EF4444", note: "Receives order, decides enrichment needed" },
              { agent: "Interpreter", color: "#7C3AED", note: "Structures execution brief" },
              { agent: "Composer", color: "#0EA5E9", note: "Builds base research report" },
              { agent: "Buyer", color: "#F59E0B", note: "Purchases 3rd-party assets via x402", active: true },
              { agent: "Seller", color: "#EF4444", note: "Merges assets, packages, delivers" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[8px] font-bold"
                  style={{
                    background: `${step.color}14`,
                    color: step.color,
                    border: `1px solid ${step.color}30`,
                    boxShadow: step.active ? `0 0 8px ${step.color}40` : "none",
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold" style={{ color: step.color }}>
                    {step.agent}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--gray-500)" }}>
                    — {step.note}
                  </span>
                  {step.active && (
                    <span
                      className="ml-auto rounded px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase"
                      style={{ background: "rgba(245,158,11,0.14)", color: "#F59E0B" }}
                    >
                      x402
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
          >
            <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
            <p className="text-[10px] leading-snug" style={{ color: "#F59E0B" }}>
              Purchased assets are labeled <span className="font-semibold">✦ External</span> in the report.
              Enrichment summary shows provider, credit cost, and asset count in the delivery package.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row: key guarantees */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Seller owns the decision", note: "Only Seller decides if Buyer runs", icon: PackageCheck, color: "#EF4444" },
          { label: "Demo always safe", note: "externalTrading=false blocks all buys", icon: ShieldOff, color: "#6366F1" },
          { label: "External sections labeled", note: "✦ External badge on purchased content", icon: AlertCircle, color: "#F59E0B" },
          { label: "Enrichment always narrated", note: "Event log explains outcome either way", icon: Zap, color: "#22C55E" },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl p-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="mb-1.5 flex size-7 items-center justify-center rounded-lg" style={{ background: `${item.color}10` }}>
              <item.icon size={13} style={{ color: item.color }} />
            </div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>{item.label}</p>
            <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-400)" }}>{item.note}</p>
          </div>
        ))}
      </div>
    </motion.section>
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
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-6xl px-6">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>AGENT ARCHITECTURE</span>
            </div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--gray-900)" }}>
              Four agents. <span className="text-gradient-accent">One pipeline.</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              The Seller accepts and delivers. The Interpreter structures intent. The Composer builds the report.
              The Buyer enriches it when needed. Each has one clear job, one clear handoff.
            </p>
          </motion.div>

          {/* Canonical flow bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 flex flex-wrap items-center gap-2 rounded-2xl px-5 py-4"
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
          </motion.div>

          {/* Agent cards */}
          <div className="flex flex-col gap-6">
            {STUDIO_AGENTS.map((agent, i) => (
              <AgentDetailCard key={agent.id} agent={agent} index={i} liveStats={liveStats} />
            ))}
          </div>
        </div>

        {/* Playbook Expansion Section */}
        <PlaybookSection />

        {/* Enrichment Explainer */}
        <EnrichmentExplainer />

        <div className="mt-16">
          <StudioEntry />
        </div>
      </main>
      <Footer />
    </div>
  );
}
