"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Brain, PenLine, ShoppingBag, PackageCheck, ArrowRight } from "lucide-react";

const PIPELINE_STAGES = [
  {
    step: "01",
    agent: "Seller",
    icon: ShoppingCart,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.20)",
    title: "Intake & Payment",
    desc: "Seller accepts the order via API or Store. Validates intent, verifies x402 payment capability, and creates a tracked job.",
    artifact: "Job created",
    optional: false,
  },
  {
    step: "02",
    agent: "Interpreter",
    icon: Brain,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.20)",
    title: "Intent Structuring",
    desc: "Converts the raw request into a precise execution brief — objective, scope, search plan, required sections, and output format.",
    artifact: "Structured brief",
    optional: false,
  },
  {
    step: "03",
    agent: "Composer",
    icon: PenLine,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.08)",
    border: "rgba(14,165,233,0.20)",
    title: "Document Creation",
    desc: "Takes the brief, searches and scrapes the web via Apify or Exa, synthesizes sources, and composes the full structured report artifact.",
    artifact: "Raw report",
    optional: false,
  },
  {
    step: "04",
    agent: "Buyer",
    icon: ShoppingBag,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.20)",
    title: "Enrichment",
    desc: "Seller decides if third-party enrichment is needed. Buyer procures assets via Nevermined x402. Disabled in demo mode — enabled for live agentic flows.",
    artifact: "External assets",
    optional: true,
  },
  {
    step: "05",
    agent: "Seller",
    icon: PackageCheck,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.20)",
    title: "Packaging & Delivery",
    desc: "Seller runs the quality gate, packages the report into branded variants (markdown, summary, JSON), settles the transaction, and delivers.",
    artifact: "Delivery package",
    optional: false,
  },
];

export function DecisionLogic() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>002 / Canonical Pipeline</span>
        </div>
        <h2 className="mb-2 text-[28px] font-semibold tracking-tight sm:text-[32px]" style={{ color: "var(--gray-900)" }}>
          One flow.{" "}
          <span className="text-gradient-accent">Five stages.</span>
        </h2>
        <p className="max-w-lg text-[14px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          Every request — Studio, Store, or external API call — runs through the same canonical pipeline with full provenance.
        </p>
      </div>

      {/* Pipeline flow — horizontal on desktop, vertical on mobile */}
      <div className="relative">
        {/* Connector line — desktop */}
        <div
          className="absolute top-[52px] left-[10%] right-[10%] hidden h-px lg:block"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,125,78,0.15), rgba(201,125,78,0.30), rgba(201,125,78,0.15), transparent)" }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE_STAGES.map((stage, index) => (
            <motion.div
              key={stage.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Arrow connector — between cards on desktop */}
              {index < PIPELINE_STAGES.length - 1 && (
                <div className="absolute right-0 top-[50px] z-10 hidden translate-x-1/2 lg:flex">
                  <ArrowRight size={12} style={{ color: "rgba(201,125,78,0.40)" }} />
                </div>
              )}

              <div
                className="glass group relative flex h-full flex-col overflow-hidden p-5 cursor-default"
                style={{
                  borderColor: stage.border,
                  boxShadow: `0 0 20px -8px ${stage.color}10`,
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 32px -6px ${stage.color}28`;
                  e.currentTarget.style.borderColor = stage.color + "55";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px -8px ${stage.color}10`;
                  e.currentTarget.style.borderColor = stage.border;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${stage.color}60, transparent)` }}
                />

                {/* Step + optional badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="font-mono text-[22px] font-bold leading-none"
                    style={{ color: `${stage.color}20` }}
                  >
                    {stage.step}
                  </span>
                  {stage.optional && (
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider"
                      style={{ background: `${stage.color}12`, color: stage.color, border: `1px solid ${stage.color}25` }}
                    >
                      optional
                    </span>
                  )}
                </div>

                {/* Icon + agent name */}
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: stage.bg, border: `1px solid ${stage.border}` }}
                  >
                    <stage.icon size={15} style={{ color: stage.color }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: stage.color }}>{stage.agent}</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>{stage.title}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="flex-1 text-[11px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
                  {stage.desc}
                </p>

                {/* Artifact output */}
                <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
                  <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>outputs</span>
                  <p
                    className="mt-0.5 rounded-md px-2 py-1 text-center font-mono text-[10px] font-semibold"
                    style={{ background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }}
                  >
                    {stage.artifact}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 space-y-3"
      >
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(201,125,78,0.04)", border: "1px solid rgba(201,125,78,0.12)" }}
        >
          <p className="text-center text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            <span style={{ color: "var(--accent-400)", fontWeight: 600 }}>Seller</span> takes the order.{" "}
            <span style={{ color: "#7C3AED", fontWeight: 600 }}>Interpreter</span> clarifies it.{" "}
            <span style={{ color: "#0EA5E9", fontWeight: 600 }}>Composer</span> builds it.{" "}
            <span style={{ color: "#F59E0B", fontWeight: 600 }}>Buyer</span> enriches it when needed.{" "}
            <span style={{ color: "#EF4444", fontWeight: 600 }}>Seller</span> delivers it.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div
            className="flex flex-1 items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}
          >
            <span
              className="mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold"
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.22)" }}
            >
              DEMO
            </span>
            <p className="text-[11px] leading-snug" style={{ color: "var(--gray-500)" }}>
              <span className="font-semibold" style={{ color: "#6366F1" }}>Context A — UI Demo:</span>{" "}
              Seller narrates the enrichment decision. Buyer evaluates but doesn’t transact. Safe for judges &amp; demos.
            </p>
          </div>
          <div
            className="flex flex-1 items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}
          >
            <span
              className="mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold"
              style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.22)" }}
            >
              LIVE
            </span>
            <p className="text-[11px] leading-snug" style={{ color: "var(--gray-500)" }}>
              <span className="font-semibold" style={{ color: "#F59E0B" }}>Context B — Agentic Live:</span>{" "}
              Buyer purchases third-party assets via Nevermined x402. External sections labeled ❖ in the final report.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
