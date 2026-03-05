"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight, Send } from "lucide-react";

export function HeroSection() {
  const [q, setQ] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) window.location.href = `/studio?q=${encodeURIComponent(trimmed)}`;
  }

  return (
    <section className="relative overflow-hidden pt-28 pb-20">
      {/* Geometric background layers */}
      <div className="geo-radial-hero absolute inset-0 pointer-events-none" />
      <div className="geo-grid absolute inset-0 pointer-events-none opacity-40" />

      {/* Subtle geometric accent — rotated diamond */}
      <div className="absolute top-20 right-[15%] pointer-events-none opacity-[0.04]">
        <div className="size-64 rotate-45 rounded-3xl border border-white" />
      </div>
      <div className="absolute bottom-10 left-[10%] pointer-events-none opacity-[0.03]">
        <div className="size-40 rotate-12 rounded-2xl border border-white" />
      </div>

      <div className="relative mx-auto flex max-w-6xl items-center gap-16 px-6">
        {/* Left — text */}
        <div className="flex flex-1 flex-col gap-6">
          <motion.div
            className="glass-pill inline-flex w-fit items-center gap-2 px-3 py-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--green-400)] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[var(--green-500)]" />
            </span>
            <span className="font-mono text-[11px] tracking-wider" style={{ color: "var(--green-400)" }}>
              Agent Studio &middot; No signup required
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-gradient-neutral text-[3.5rem] leading-[1.08] tracking-tight sm:text-[4.2rem]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Describe the work.
            <br />
            <span className="text-gradient-green">Agents build it.</span>
          </motion.h1>

          <motion.p
            className="max-w-sm text-[15px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Describe what you need. Three specialist agents research, plan, and
            build it. Get a structured deliverable in minutes.
          </motion.p>

          {/* Primary CTA — the input IS the action */}
          <motion.form
            onSubmit={handleSearch}
            className="flex gap-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Research the AI agent market in 2025..."
              className="flex-1 rounded-xl px-4 py-3.5 text-[14px] outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-default)",
                color: "var(--gray-800)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)";
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
            />
            <button
              type="submit"
              disabled={!q.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-[14px] font-medium text-white transition-all duration-200 disabled:opacity-35"
              style={{
                background: "linear-gradient(135deg, var(--green-600), var(--green-500))",
                boxShadow: q.trim() ? "0 0 20px -4px rgba(34,197,94,0.4)" : "none",
              }}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Go</span>
            </button>
          </motion.form>

          {/* Trust signals + secondary nav */}
          <motion.div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.42 }}
          >
            {[
              "Research Sprint from 1cr",
              "No subscription",
              "No signup required",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 font-mono text-[10px]"
                style={{ color: "var(--gray-400)" }}
              >
                <span className="size-1 rounded-full" style={{ background: "var(--green-500)", opacity: 0.6 }} />
                {t}
              </span>
            ))}
            <a
              href="#agents"
              className="flex items-center gap-1 font-mono text-[10px] transition-colors hover:opacity-80"
              style={{ color: "var(--gray-400)" }}
            >
              Meet the agents <ArrowRight size={10} />
            </a>
          </motion.div>
        </div>

        {/* Right — Globe */}
        <motion.div
          className="hidden flex-1 items-center justify-center lg:flex"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Globe size={480} />
        </motion.div>
      </div>
    </section>
  );
}
