"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight, FileText, Send, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";

const QUICK_STARTS = [
  "Research a market",
  "Compare competitors",
  "Write a product plan",
];

const HERO_PROOF = [
  {
    icon: Sparkles,
    title: "4 specialist agents",
    body: "Strategy, research, procurement, and delivery working as one pipeline.",
  },
  {
    icon: FileText,
    title: "Structured outputs",
    body: "Reports, plans, and specs with real sections, clear takeaways, and citations.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace-ready",
    body: "Buyer and Seller can enrich work with third-party assets when the flow calls for it.",
  },
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
              AI Agent Studio For Real Deliverables
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
            Turn a rough prompt into a structured report, plan, or spec. Auto Business routes work through four specialist agents so you get something decision-ready, not just a chat reply.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {QUICK_STARTS.map((label) => (
              <span
                key={label}
                className="rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{
                  color: "var(--gray-500)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {label}
              </span>
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
            <a
              href="#sample-output"
              className="rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200"
              style={{
                background: "var(--glass-bg)",
                color: "var(--gray-600)",
                border: "1px solid var(--border-default)",
              }}
            >
              See example output
            </a>
          </motion.div>

          {/* Minimal trust signals */}
          <motion.div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {["From 1 credit", "No subscription", "No signup"].map((t) => (
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

          <motion.div
            className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            {HERO_PROOF.map((item) => (
              <div
                key={item.title}
                className="glass p-4"
                style={{ background: "rgba(255,255,255,0.72)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-lg"
                    style={{ background: "rgba(201,125,78,0.10)" }}
                  >
                    <item.icon size={14} style={{ color: "var(--accent-400)" }} />
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
