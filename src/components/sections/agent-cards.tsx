"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { StudioAgent } from "@/types";
import { STUDIO_AGENTS } from "@/data/mock-transactions";
import { Zap, ArrowRight, Activity } from "lucide-react";

interface AgentLiveStats {
  [agentId: string]: { creditsEarned: number; creditsSpent: number; requestsHandled: number };
}

const AGENT_SKILLS: Record<string, string[]> = {
  "agent-strategist": ["Intent extraction", "Brief generation", "Clarification", "Routing"],
  "agent-researcher": ["Web research", "2-pass synthesis", "Source scoring", "Confidence"],
  "agent-buyer":      ["Marketplace scan", "Asset eval", "Gap analysis", "x402 payment"],
  "agent-seller":     ["Order intake", "Quality gate", "Packaging", "Delivery"],
  "agent-vision":     ["Image generation", "Quality loop", "Prompt refinement", "NanoBanana"],
};

function AgentCard({ agent, index, liveStats }: { agent: StudioAgent; index: number; liveStats: AgentLiveStats | null }) {
  const agentKey = agent.id.replace("agent-", "");
  const real = liveStats?.[agentKey];
  const skills = AGENT_SKILLS[agent.id] ?? [];
  const hasActivity = real && real.requestsHandled > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { type: "spring", stiffness: 380, damping: 26 } }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.16, 1, 0.3, 1] }}
      className="h-full cursor-default"
    >
      <motion.div
        className="glass relative flex h-full flex-col overflow-hidden p-6"
        style={{
          borderColor: agent.primary ? `${agent.accentColor}33` : "var(--glass-border)",
          boxShadow: agent.primary ? `0 0 30px -8px ${agent.accentColor}18` : "0 1px 6px rgba(0,0,0,0.04)",
        }}
        whileHover={{
          borderColor: `${agent.accentColor}50`,
          boxShadow: `0 12px 36px -8px ${agent.accentColor}22, 0 2px 8px rgba(0,0,0,0.06)`,
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Top accent line — full width on primary */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: agent.primary
              ? `linear-gradient(90deg, ${agent.accentColor}80, ${agent.accentColor}30, transparent)`
              : `linear-gradient(90deg, transparent, ${agent.accentColor}30, transparent)`,
          }}
        />

        {/* Live activity dot */}
        {hasActivity && (
          <motion.div
            className="absolute right-4 top-4 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <span className="pulse-dot" />
            <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>active</span>
          </motion.div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-start gap-3 pt-1">
          <motion.div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${agent.accentColor}15`, border: `1px solid ${agent.accentColor}25` }}
            whileHover={{ scale: 1.12, background: `${agent.accentColor}25` }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Zap size={16} color={agent.accentColor} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h3 className="font-mono text-[13px] font-bold tracking-wide" style={{ color: "var(--gray-900)" }}>
              {agent.name}
            </h3>
            <span className="text-[11px]" style={{ color: "var(--gray-400)" }}>{agent.specialty}</span>
          </div>
          <span
            className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold"
            style={{ background: `${agent.accentColor}10`, color: agent.accentColor, border: `1px solid ${agent.accentColor}22` }}
          >
            {agent.startingCredits}cr+
          </span>
        </div>

        {/* Summary */}
        <p className="mb-4 flex-1 text-[12.5px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
          {agent.summary}
        </p>

        {/* Skill chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold transition-all"
              style={{
                background: `${agent.accentColor}0d`,
                color: agent.accentColor,
                border: `1px solid ${agent.accentColor}22`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Output tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {agent.outputs.map((output) => (
            <span
              key={output}
              className="rounded-md px-2 py-1 text-[10px] font-medium"
              style={{ background: "var(--bg-surface)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}
            >
              {output}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="mb-4 flex items-center gap-3 rounded-lg px-3 py-2 border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
          <Activity size={10} style={{ color: "var(--gray-300)" }} />
          {liveStats === null ? (
            <>
              <span className="h-2.5 w-10 animate-pulse rounded" style={{ background: "var(--border-default)" }} />
              <span className="h-2.5 w-14 animate-pulse rounded" style={{ background: "var(--border-default)" }} />
              <span className="ml-auto h-2.5 w-16 animate-pulse rounded" style={{ background: "var(--border-default)" }} />
            </>
          ) : (
            <>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {real ? `${real.requestsHandled} runs` : "0 runs"}
              </span>
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {real ? `${real.creditsSpent}cr spent` : "0cr spent"}
              </span>
              <span className="ml-auto font-mono text-[10px] font-semibold" style={{ color: agent.accentColor }}>
                {real ? `${real.creditsEarned}cr earned` : "0cr earned"}
              </span>
            </>
          )}
        </div>

        {/* CTA */}
        <Link
          href={
            agent.id === "agent-strategist" ? "/studio?mode=strategist" :
            agent.id === "agent-researcher" ? "/studio?mode=researcher" :
            agent.id === "agent-seller" ? "/store" :
            agent.id === "agent-vision" ? "/studio" :
            "/studio"
          }
          className="group mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all duration-200 btn-press"
          style={{
            background: `${agent.accentColor}12`,
            color: agent.accentColor,
            border: `1px solid ${agent.accentColor}22`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = `${agent.accentColor}22`;
            (e.currentTarget as HTMLElement).style.borderColor = `${agent.accentColor}40`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = `${agent.accentColor}12`;
            (e.currentTarget as HTMLElement).style.borderColor = `${agent.accentColor}22`;
          }}
        >
          {agent.ctaLabel}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function AgentCards() {
  const [liveStats, setLiveStats] = useState<AgentLiveStats | null>(null);

  useEffect(() => {
    fetch("/api/pipeline/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.agents) setLiveStats(d.agents);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="agents" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>
              003 / The Pipeline Team
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="pulse-dot" />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {STUDIO_AGENTS.length} agents active
            </span>
          </div>
        </div>
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-[32px]" style={{ color: "var(--gray-900)" }}>
          Five agents.{" "}
          <span className="text-gradient-accent">One clear job each.</span>
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          Each agent handles exactly one responsibility in the pipeline — including VISION, which generates a hero image for every report via NanoBanana.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STUDIO_AGENTS.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} liveStats={liveStats} />
        ))}
      </div>
    </section>
  );
}
