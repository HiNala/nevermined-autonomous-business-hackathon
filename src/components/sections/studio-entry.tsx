"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const EXAMPLES = [
  "Research the AI agent market in 2025",
  "Analyze competitors to Notion for team wikis",
  "Plan a SaaS launch for a developer API tool",
  "Write a frontend spec for a dashboard app",
  "Find trends in autonomous AI payments",
];

const OUTPUTS = [
  { agent: "SCOUT", label: "Research Sprint", time: "~2 min", credits: "1cr" },
  { agent: "ORBIT", label: "Planning Pack", time: "~5 min", credits: "5cr" },
  { agent: "CANVAS", label: "Design Spec", time: "~8 min", credits: "10cr" },
];

export function StudioEntry() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `/studio?q=${encodeURIComponent(q)}`;
  }

  return (
    <section id="try-studio" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>008 / TRY THE STUDIO</span>
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
          Describe what you need.
        </h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
          The agents research, plan, and design for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: Input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass p-6"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="mb-2 block text-[12px] font-medium"
                style={{ color: "var(--gray-600)" }}
              >
                What do you need?
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Research the top AI agent frameworks and compare their strengths for a production use case..."
                rows={5}
                className="w-full rounded-xl px-4 py-3 text-[13px] leading-relaxed outline-none transition-colors focus:border-[rgba(34,197,94,0.30)]"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--gray-800)",
                  resize: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit(e as unknown as FormEvent);
                  }
                }}
              />
            </div>

            {/* Example pills */}
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQuery(ex)}
                  className="rounded-lg px-2.5 py-1 text-[11px] transition-all duration-150"
                  style={{
                    background: "var(--glass-bg)",
                    color: "var(--gray-500)",
                    border: "1px solid var(--border-default)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201, 125, 78, 0.25)";
                    e.currentTarget.style.color = "var(--gray-700)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.color = "var(--gray-500)";
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px]" style={{ color: "var(--gray-400)" }}>
                ⌘ + Enter to open &nbsp;·&nbsp; No signup required
              </span>
              <button
                type="submit"
                disabled={!query.trim()}
                className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                  boxShadow: query.trim() ? "0 0 20px -4px rgba(201, 125, 78, 0.35)" : "none",
                }}
              >
                Open in Studio
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right: What you get */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="glass p-6"
        >
          <p
            className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            What you get back
          </p>

          <div className="flex flex-col gap-3">
            {OUTPUTS.map((o, i) => (
              <motion.div
                key={o.agent}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
                className="flex items-center gap-3 rounded-xl p-3.5"
                style={{ background: "rgba(201, 125, 78, 0.04)", border: "1px solid rgba(201, 125, 78, 0.12)" }}
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(201, 125, 78, 0.10)" }}
                >
                  <Zap size={14} style={{ color: "var(--accent-400)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--gray-800)" }}>
                    {o.label}
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                    {o.agent} &nbsp;&middot;&nbsp; {o.time}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold"
                  style={{
                    background: "rgba(201, 125, 78, 0.10)",
                    color: "var(--accent-400)",
                    border: "1px solid rgba(201, 125, 78, 0.20)",
                  }}
                >
                  {o.credits}
                </span>
              </motion.div>
            ))}
          </div>

          <div
            className="mt-5 flex items-center justify-between border-t pt-4"
            style={{ borderColor: "var(--border-default)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
              Full AI pipeline &mdash; web research included
            </p>
            <Link
              href="/services"
              className="font-mono text-[10px] transition-colors duration-150"
              style={{ color: "var(--accent-400)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              See all services →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
