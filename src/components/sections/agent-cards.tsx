"use client";

import { motion } from "framer-motion";
import type { StudioAgent } from "@/types";
import { STUDIO_AGENTS } from "@/data/mock-transactions";
import { Zap } from "lucide-react";

function AgentCard({ agent, index }: { agent: StudioAgent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="glass group relative overflow-hidden p-6 transition-all duration-300"
        style={{
          borderColor: agent.primary
            ? `${agent.accentColor}33`
            : "var(--glass-border)",
          boxShadow: agent.primary
            ? `0 0 30px -8px ${agent.accentColor}20`
            : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${agent.accentColor}44`;
          e.currentTarget.style.boxShadow = `0 0 40px -8px ${agent.accentColor}25`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = agent.primary
            ? `${agent.accentColor}33`
            : "var(--glass-border)";
          e.currentTarget.style.boxShadow = agent.primary
            ? `0 0 30px -8px ${agent.accentColor}20`
            : "none";
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${agent.accentColor}40, transparent)`,
          }}
        />

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ background: `${agent.accentColor}15` }}
            >
              <Zap size={16} color={agent.accentColor} />
            </div>
            <div>
              <h3
                className="font-mono text-sm font-bold tracking-wider"
                style={{ color: "var(--gray-900)" }}
              >
                {agent.name}
              </h3>
              <span
                className="text-[11px]"
                style={{ color: "var(--gray-400)" }}
              >
                {agent.specialty}
              </span>
            </div>
          </div>
          <span
            className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold"
            style={{
              background: `${agent.accentColor}12`,
              color: agent.accentColor,
              border: `1px solid ${agent.accentColor}25`,
            }}
          >
            from {agent.startingCredits}cr
          </span>
        </div>

        {/* Summary */}
        <p
          className="mb-5 text-[13px] leading-relaxed"
          style={{ color: "var(--gray-500)" }}
        >
          {agent.summary}
        </p>

        {/* Outputs */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {agent.outputs.map((output) => (
            <span
              key={output}
              className="rounded-md px-2 py-1 text-[10px] font-medium"
              style={{
                background: "var(--gray-100)",
                color: "var(--gray-500)",
              }}
            >
              {output}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div
          className="mb-5 flex items-center gap-4 border-t pt-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
            {agent.stats.totalSales} deliveries
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
            {agent.stats.repeatBuyers} repeat
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--green-400)" }}>
            {agent.stats.totalCreditsEarned}cr earned
          </span>
        </div>

        {/* CTA */}
        <button
          className="w-full rounded-xl py-2.5 text-[13px] font-medium transition-all duration-200"
          style={{
            background: `${agent.accentColor}12`,
            color: agent.accentColor,
            border: `1px solid ${agent.accentColor}20`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${agent.accentColor}20`;
            e.currentTarget.style.borderColor = `${agent.accentColor}35`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${agent.accentColor}12`;
            e.currentTarget.style.borderColor = `${agent.accentColor}20`;
          }}
        >
          {agent.ctaLabel} →
        </button>
      </div>
    </motion.div>
  );
}

export function AgentCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--gray-400)" }}
        >
          Agent Team
        </h2>
        <span className="font-mono text-[11px]" style={{ color: "var(--gray-400)" }}>
          {STUDIO_AGENTS.length} specialists
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {STUDIO_AGENTS.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </section>
  );
}
