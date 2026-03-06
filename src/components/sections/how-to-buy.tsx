"use client";

import { motion } from "framer-motion";
import {
  Terminal, CreditCard, FileJson, ShieldCheck,
  ArrowRight, Bot, Globe, Zap
} from "lucide-react";
import Link from "next/link";

const BUYER_STEPS = [
  {
    num: "01",
    icon: Globe,
    color: "#7C3AED",
    title: "Discover the manifest",
    body: "Fetch /.well-known/agent.json — machine-readable spec with all endpoints, versioned contracts (IncomingOrder, StructuredBrief, ComposedReport), pricing, and job lifecycle states.",
    code: `GET /.well-known/agent.json`,
  },
  {
    num: "02",
    icon: Terminal,
    color: "#0EA5E9",
    title: "Submit an order",
    body: "POST your brief to /api/agent/seller. Receive an x402 Payment Required response with the Nevermined planId and credit amount needed.",
    code: `POST /api/agent/seller\n{ "query": "...", "productId": "..." }`,
  },
  {
    num: "03",
    icon: CreditCard,
    color: "#F59E0B",
    title: "Settle via Nevermined x402",
    body: "Acquire an access token using the planId and agentId from the 402 header. Re-submit with the payment-signature — no card, no login, pure agent-to-agent settlement.",
    code: `POST /api/agent/seller\nAuthorization: Bearer <nvm-token>`,
  },
  {
    num: "04",
    icon: FileJson,
    color: "#22C55E",
    title: "Receive the delivery package",
    body: "Get back a structured delivery package: markdown + summary + JSON variants, quality gate result, enrichment summary, provenance chain, and order ID.",
    code: `{ "deliveryPackage": { ... },\n  "enrichmentSummary": { ... },\n  "provenance": { ... } }`,
  },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: "Versioned contracts", note: "schemaVersion + jobId + traceId on every handoff" },
  { icon: Bot, label: "A2A native", note: "Any x402-compatible buyer can call autonomously" },
  { icon: Zap, label: "Job lifecycle", note: "Poll /api/workspace/jobs for async status" },
  { icon: Globe, label: "Multi-provider AI", note: "OpenAI · Gemini · Anthropic — auto-selected" },
];

export function HowToBuy() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>
            002 / For Agent Buyers
          </span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[32px]" style={{ color: "var(--gray-900)" }}>
              Call us from{" "}
              <span className="text-gradient-accent">your agent.</span>
            </h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
              Four steps from discovery to delivery. No signup, no OAuth dance — just x402 payment and a structured result.
            </p>
          </div>
          <Link
            href="/.well-known/agent.json"
            target="_blank"
            className="hidden shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-mono font-semibold transition-all sm:flex btn-press glow-on-hover"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--gray-600)",
            }}
          >
            <FileJson size={13} />
            agent.json
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BUYER_STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: `0 8px 28px -8px ${step.color}22, 0 2px 8px rgba(0,0,0,0.05)`, borderColor: `${step.color}30`, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col rounded-xl p-4 cursor-default"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Step header */}
            <div className="mb-3 flex items-center justify-between">
              <div
                className="flex size-8 items-center justify-center rounded-lg"
                style={{ background: `${step.color}12`, border: `1px solid ${step.color}25` }}
              >
                <step.icon size={15} style={{ color: step.color }} />
              </div>
              <span className="font-mono text-[9px] font-bold" style={{ color: "var(--gray-300)" }}>
                {step.num}
              </span>
            </div>

            <h3 className="mb-1.5 text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>
              {step.title}
            </h3>
            <p className="mb-4 flex-1 text-[11px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              {step.body}
            </p>

            {/* Code snippet */}
            <div
              className="rounded-lg p-2.5"
              style={{
                background: "rgba(0,0,0,0.04)",
                border: "1px solid var(--border-default)",
              }}
            >
              <pre className="whitespace-pre-wrap font-mono text-[9px] leading-relaxed" style={{ color: step.color }}>
                {step.code}
              </pre>
            </div>

            {/* Step connector arrow */}
            {i < BUYER_STEPS.length - 1 && (
              <div className="mt-3 flex justify-end">
                <ArrowRight size={11} style={{ color: "var(--gray-300)" }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Trust signals row */}
      <div
        className="mt-6 grid grid-cols-2 gap-3 rounded-2xl p-5 sm:grid-cols-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
      >
        {TRUST_SIGNALS.map((sig, i) => (
          <motion.div
            key={sig.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="flex items-start gap-2.5"
          >
            <div
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md"
              style={{ background: "rgba(201,125,78,0.08)", border: "1px solid rgba(201,125,78,0.18)" }}
            >
              <sig.icon size={11} style={{ color: "var(--accent-400)" }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold" style={{ color: "var(--gray-700)" }}>{sig.label}</p>
              <p className="text-[10px]" style={{ color: "var(--gray-400)" }}>{sig.note}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
