"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink, Clock, Zap, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

const MOCK_DOC = {
  title: "AI Agent Frameworks in 2025: Comparative Market Analysis",
  summary:
    "The autonomous AI agent market has matured rapidly in 2025, with five dominant frameworks emerging across enterprise and developer markets. LangChain, AutoGPT, CrewAI, Semantic Kernel, and Nevermined each address distinct use cases, with performance and cost profiles diverging significantly across real-world deployments.",
  sections: [
    {
      heading: "Key Market Trends",
      content: [
        "Multi-agent orchestration has become the dominant pattern, replacing single-agent chains",
        "On-chain payment rails (A2A payments) are now a differentiator — not a feature",
        "Latency benchmarks show 3–5× improvements across all major frameworks vs. 2024",
        "Enterprise adoption has outpaced developer adoption for the first time",
      ],
    },
    {
      heading: "Framework Comparison",
      content: [
        "LangChain: Broadest ecosystem, highest complexity, best for custom pipelines",
        "CrewAI: Easiest multi-agent setup, strong open-source community momentum",
        "Nevermined: Only framework with native A2A credit payments and marketplace integration",
        "Semantic Kernel: Microsoft-backed, strongest enterprise security posture",
      ],
    },
    {
      heading: "Recommendation",
      content: [
        "For payment-enabled agents: Nevermined is the only production-ready option",
        "For rapid prototyping: CrewAI offers the lowest barrier to entry",
        "For enterprise with Azure: Semantic Kernel has the most mature compliance story",
      ],
    },
  ],
  sources: [
    { title: "State of AI Agents 2025 — a16z Research", url: "https://a16z.com" },
    { title: "CrewAI Benchmark Report Q1 2025", url: "https://crewai.com" },
    { title: "Nevermined Agent Economy Whitepaper", url: "https://nevermined.app" },
    { title: "LangChain Enterprise Survey Results", url: "https://langchain.com" },
    { title: "MIT CSAIL: Multi-Agent System Latency Analysis", url: "https://csail.mit.edu" },
  ],
  meta: { credits: 1, duration: "43s", sources: 5, agent: "SCOUT" },
};

export function OutputShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>004 / SAMPLE OUTPUT</span>
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
          This is what a Research Sprint looks like.
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass overflow-hidden"
      >
        {/* Document header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{ background: "rgba(14, 165, 233, 0.08)" }}
            >
              <FileText size={15} style={{ color: "#0EA5E9" }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>
                {MOCK_DOC.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                  <Zap size={9} style={{ color: "var(--accent-400)" }} /> {MOCK_DOC.meta.credits}cr
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                  <Clock size={9} /> {MOCK_DOC.meta.duration}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                  <Globe size={9} /> {MOCK_DOC.meta.sources} sources
                </span>
                <span className="font-mono text-[10px]" style={{ color: "var(--accent-400)" }}>
                  {MOCK_DOC.meta.agent}
                </span>
              </div>
            </div>
          </div>

          {/* Demo badge */}
          <span
            className="rounded-md px-2 py-1 font-mono text-[9px] font-semibold uppercase"
            style={{
              background: "rgba(201, 125, 78, 0.08)",
              color: "var(--accent-400)",
              border: "1px solid rgba(201, 125, 78, 0.16)",
            }}
          >
            Example output
          </span>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_260px]">
          {/* Document body */}
          <div className="border-r p-6" style={{ borderColor: "var(--border-default)" }}>
            {/* Summary */}
            <div
              className="mb-6 rounded-xl p-4"
              style={{ background: "rgba(14, 165, 233, 0.04)", border: "1px solid rgba(14, 165, 233, 0.10)" }}
            >
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
                {MOCK_DOC.summary}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-5">
              {MOCK_DOC.sections.map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <h3
                    className="mb-3 text-[14px] font-semibold"
                    style={{ color: "var(--gray-800)" }}
                  >
                    {section.heading}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.content.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
                        <span
                          className="mt-[7px] size-1.5 shrink-0 rounded-full"
                          style={{ background: "var(--accent-400)", opacity: 0.55 }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sources + CTA */}
          <div className="flex flex-col p-5">
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Sources ({MOCK_DOC.sources.length})
            </p>
            <div className="flex flex-col gap-2">
              {MOCK_DOC.sources.map((source, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg p-2"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <ExternalLink size={11} className="mt-0.5 shrink-0" style={{ color: "var(--gray-400)" }} />
                  <p className="text-[11px] leading-snug" style={{ color: "var(--gray-500)" }}>
                    {source.title}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="mt-auto border-t pt-5"
              style={{ borderColor: "var(--border-default)" }}
            >
              <p className="mb-3 text-[12px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
                This is 1 credit of real research. Yours in about 45 seconds.
              </p>
              <Link
                href="/studio?q=Research the AI agent market in 2025"
                className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                  boxShadow: "0 0 16px -4px rgba(201, 125, 78, 0.28)",
                }}
              >
                Run this research
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
