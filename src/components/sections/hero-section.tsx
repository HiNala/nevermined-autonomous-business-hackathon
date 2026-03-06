"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight, Brain, PackageCheck, PenLine, Send, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";

const QUICK_STARTS = [
  "Research a market",
  "Compare competitors",
  "Write a product plan",
];

const PIPELINE_STEPS = [
  { label: "Seller", sublabel: "accepts order", color: "#EF4444", icon: ShoppingCart },
  { label: "Interpreter", sublabel: "structures it", color: "#7C3AED", icon: Brain },
  { label: "Composer", sublabel: "builds it", color: "#0EA5E9", icon: PenLine },
  { label: "Buyer", sublabel: "enriches (opt)", color: "#F59E0B", icon: ShoppingBag, optional: true },
  { label: "Seller", sublabel: "delivers it", color: "#EF4444", icon: PackageCheck },
];

export function HeroSection() {
  const [q, setQ] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) window.location.href = `/studio?q=${encodeURIComponent(trimmed)}`;
  }

  return (
    <section className="relative flex min-h-[78vh] flex-col overflow-hidden">
      {/* Subtle radial glow */}
      <div className="geo-radial-hero absolute inset-0 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center gap-12 px-6 pb-16 pt-24 lg:pt-28">
        {/* Left — copy */}
        <div className="flex max-w-2xl flex-1 flex-col gap-6">
          <motion.div
            className="glass-pill w-fit px-3 py-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--accent-400)" }}>
              Job-Based Agent Commerce · Nevermined x402
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-display leading-[1.02] tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <span className="block text-[3rem] sm:text-[4.25rem]" style={{ color: "var(--gray-900)" }}>
              Describe the work.
            </span>
            <span className="block text-[3rem] sm:text-[4.25rem]" style={{ color: "var(--accent-400)" }}>
              Agents build it.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="max-w-xl text-[17px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Send a request from the Studio, the Store, or directly via API. The Seller takes the order. The Interpreter structures it. The Composer builds it. The Seller delivers a branded, quality-gated package — with full provenance.
          </motion.p>

          {/* Pipeline mini-flow */}
          <motion.div
            className="flex flex-wrap items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {PIPELINE_STEPS.map((s, i) => (
              <div key={`${s.label}-${i}`} className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                  style={{
                    background: `${s.color}10`,
                    border: `1px solid ${s.color}25`,
                    opacity: s.optional ? 0.65 : 1,
                  }}
                >
                  <s.icon size={10} style={{ color: s.color }} />
                  <span className="font-mono text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                  <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>{s.sublabel}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight size={9} style={{ color: "var(--gray-300)", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </motion.div>

          {/* CTA input */}
          <motion.form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Research the AI agent market..."
              className="flex-1 rounded-xl px-4 py-3.5 text-[14px] transition-all"
              style={{
                background: "var(--glass-bg-strong)",
                border: "1px solid var(--border-default)",
                color: "var(--gray-800)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.10)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={!q.trim()}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[14px] font-medium text-white transition-all duration-200 disabled:opacity-30 sm:px-6"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: q.trim() ? "0 0 16px -4px rgba(201,125,78,0.40)" : "none",
              }}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Go</span>
            </button>
          </motion.form>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/studio"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: "0 0 16px -6px rgba(201,125,78,0.35)",
              }}
            >
              Open Studio
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/store"
              className="rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200"
              style={{
                background: "var(--glass-bg)",
                color: "var(--gray-600)",
                border: "1px solid var(--border-default)",
              }}
            >
              Browse the Store
            </Link>
          </motion.div>

          {/* Minimal trust signals */}
          <motion.div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {["From 1 credit · $0.10 USDC", "No signup required", "A2A · Nevermined x402"].map((t) => (
              <span key={t} className="text-[12px]" style={{ color: "var(--gray-400)" }}>
                {t}
              </span>
            ))}
            <a
              href="#agents"
              className="flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--accent-400)" }}
            >
              Meet the agents <ArrowRight size={11} />
            </a>
          </motion.div>

          {/* Proof cards */}
          <motion.div
            className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            {[
              { color: "#7C3AED", icon: Brain, title: "Clarification-aware", body: "Interpreter scores brief quality and asks 1–2 clarifying questions before ambiguous jobs run. Workspace context applied automatically." },
              { color: "#0EA5E9", icon: PenLine, title: "2-pass composition", body: "Composer runs an outline pass then full synthesis — specific headings, source attribution, contradiction detection, and confidence scoring." },
              { color: "#EF4444", icon: PackageCheck, title: "Provenance + delivery", body: "Seller quality-gates every report, packages 3 delivery variants, and saves each run to your local artifact library for restore and re-run." },
            ].map((item) => (
              <div
                key={item.title}
                className="glass p-4"
                style={{ background: "rgba(255,255,255,0.72)", borderColor: `${item.color}18` }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-lg"
                    style={{ background: `${item.color}10` }}
                  >
                    <item.icon size={14} style={{ color: item.color }} />
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--gray-800)" }}>
                    {item.title}
                  </p>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — Globe */}
        <motion.div
          className="hidden flex-1 items-center justify-center xl:flex"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Globe size={460} />
        </motion.div>
      </div>
    </section>
  );
}
