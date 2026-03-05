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
    <section className="relative min-h-[88vh] overflow-hidden flex flex-col">
      {/* Subtle radial glow */}
      <div className="geo-radial-hero absolute inset-0 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center gap-12 px-6 pt-28 pb-20 lg:pt-32">
        {/* Left — copy */}
        <div className="flex flex-1 flex-col gap-6 max-w-lg">
          {/* Headline */}
          <motion.h1
            className="font-display leading-[1.08] tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <span className="block text-[2.8rem] sm:text-[3.8rem]" style={{ color: "var(--gray-900)" }}>
              Describe the work.
            </span>
            <span className="block text-[2.8rem] sm:text-[3.8rem]" style={{ color: "var(--accent-400)" }}>
              Agents build it.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="max-w-md text-[15px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Four specialist agents research, plan, and build structured deliverables in minutes. No signup required.
          </motion.p>

          {/* CTA input */}
          <motion.form
            onSubmit={handleSearch}
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Research the AI agent market..."
              className="flex-1 rounded-xl px-4 py-3 text-[14px] transition-all"
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
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-medium text-white transition-all duration-200 disabled:opacity-30"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: q.trim() ? "0 0 16px -4px rgba(201,125,78,0.40)" : "none",
              }}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Go</span>
            </button>
          </motion.form>

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
        </div>

        {/* Right — Globe */}
        <motion.div
          className="hidden flex-1 items-center justify-center lg:flex"
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
