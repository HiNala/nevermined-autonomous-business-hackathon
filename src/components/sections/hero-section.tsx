"use client";

import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
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
            className="max-w-md text-base leading-relaxed"
            style={{ color: "var(--gray-500)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Three specialist AI agents &mdash; SCOUT researches, ORBIT plans, CANVAS designs.
            Tell them what you need. Get a structured deliverable back in minutes.
            Pay only for what you use.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-3 pt-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href="/studio"
              className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, var(--green-600), var(--green-500))",
                boxShadow: "0 0 20px -4px rgba(34, 197, 94, 0.25)",
              }}
            >
              Try the Studio &mdash; free
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#agents"
              className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: "var(--glass-bg)",
                color: "var(--gray-600)",
                border: "1px solid var(--border-default)",
              }}
            >
              Meet the agents
            </a>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            className="flex flex-wrap items-center gap-4 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            {[
              "Research Sprint from 1cr",
              "No subscription",
              "Powered by Nevermined",
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
