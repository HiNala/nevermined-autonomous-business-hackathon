"use client";

import { motion } from "framer-motion";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { StudioEntry } from "@/components/sections/studio-entry";
import { STUDIO_AGENTS } from "@/data/mock-transactions";
import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { StudioAgent } from "@/types";

function AgentDetailCard({ agent, index }: { agent: StudioAgent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: agent.primary ? `${agent.accentColor}33` : "var(--glass-border)",
        boxShadow: agent.primary ? `0 0 40px -10px ${agent.accentColor}18` : "none",
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-8 right-8 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accentColor}40, transparent)` }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        {/* Left: identity */}
        <div className="flex flex-col gap-4 lg:w-1/3">
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-xl"
              style={{ background: `${agent.accentColor}12` }}
            >
              <Zap size={22} color={agent.accentColor} />
            </div>
            <div>
              <h2 className="font-mono text-xl font-bold tracking-wider" style={{ color: "var(--gray-900)" }}>
                {agent.name}
              </h2>
              <span className="text-[12px]" style={{ color: "var(--gray-400)" }}>{agent.specialty}</span>
            </div>
          </div>

          <p className="text-[14px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            {agent.summary}
          </p>

          <div className="flex items-center gap-3">
            <span
              className="rounded-lg px-3 py-1 font-mono text-[12px] font-bold"
              style={{
                background: `${agent.accentColor}10`,
                color: agent.accentColor,
                border: `1px solid ${agent.accentColor}22`,
              }}
            >
              from {agent.startingCredits}cr
            </span>
          </div>
        </div>

        {/* Right: outputs + stats */}
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Deliverables
            </p>
            <div className="flex flex-wrap gap-2">
              {agent.outputs.map((output) => (
                <span
                  key={output}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium"
                  style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}
                >
                  {output}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 border-t pt-4" style={{ borderColor: "var(--border-default)" }}>
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: "var(--gray-900)" }}>{agent.stats.totalSales}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>Deliveries</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: "var(--gray-900)" }}>{agent.stats.repeatBuyers}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>Repeat</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: "var(--accent-400)" }}>{agent.stats.totalCreditsEarned}cr</p>
              <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>Earned</p>
            </div>
          </div>

          <Link
            href="/studio"
            className="group mt-auto flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all duration-200"
            style={{
              background: `${agent.accentColor}12`,
              color: agent.accentColor,
              border: `1px solid ${agent.accentColor}20`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${agent.accentColor}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${agent.accentColor}12`;
            }}
          >
            {agent.ctaLabel}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function AgentsPage() {
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
            className="mb-12"
          >
            <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--gray-900)" }}>
              Agent <span className="text-gradient-accent">Team</span>
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              Four specialist agents that strategize, research, procure, and sell on demand.
              Each runs independently or chains together for full deliverables.
            </p>
          </motion.div>

          {/* Agent cards */}
          <div className="flex flex-col gap-6">
            {STUDIO_AGENTS.map((agent, i) => (
              <AgentDetailCard key={agent.id} agent={agent} index={i} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <StudioEntry />
        </div>
      </main>
      <Footer />
    </div>
  );
}
