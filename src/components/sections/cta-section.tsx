"use client";

import { motion } from "framer-motion";
import { ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201, 125, 78, 0.07), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <h2
          className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ color: "var(--gray-900)" }}
        >
          Stop researching.
          <span className="text-gradient-accent"> Start shipping.</span>
        </h2>

        <p
          className="mb-8 max-w-lg text-[15px] leading-relaxed"
          style={{ color: "var(--gray-500)" }}
        >
          Your agents are ready. Describe what you need and get a structured deliverable
          in minutes &mdash; research, plans, or design specs. No subscription. No waiting.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/studio"
            className="group flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-medium text-white transition-all duration-200 btn-press"
            style={{
              background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
              boxShadow: "0 0 20px -4px rgba(201, 125, 78, 0.35)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px -4px rgba(201,125,78,0.55)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px -4px rgba(201, 125, 78, 0.35)"; }}
          >
            Open Studio &mdash; it&apos;s free
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/studio?checkout=true"
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-medium transition-all duration-200 btn-press"
            style={{
              background: "rgba(201, 125, 78, 0.08)",
              color: "var(--accent-400)",
              border: "1px solid rgba(201, 125, 78, 0.22)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(201, 125, 78, 0.14)";
              e.currentTarget.style.boxShadow = "0 4px 16px -4px rgba(201, 125, 78, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(201, 125, 78, 0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <CreditCard size={14} />
            Buy Credits
          </Link>

          <Link
            href="/agents"
            className="rounded-xl px-6 py-3 text-[14px] font-medium transition-all duration-200 btn-press"
            style={{
              background: "var(--glass-bg)",
              color: "var(--gray-600)",
              border: "1px solid var(--border-default)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(201, 125, 78, 0.30)";
              e.currentTarget.style.color = "var(--gray-800)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--gray-600)";
            }
          }
          >
            Meet the agents
          </Link>
        </div>

        <p className="mt-6 text-[12px]" style={{ color: "var(--gray-400)" }}>
          No signup &nbsp;&middot;&nbsp; Demo mode available &nbsp;&middot;&nbsp; Powered by Nevermined
        </p>
      </motion.div>
    </section>
  );
}
