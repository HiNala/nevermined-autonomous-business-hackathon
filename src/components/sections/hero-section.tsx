"use client";

import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";

export function HeroSection() {
  return (
    <section className="relative mx-auto flex max-w-6xl items-center gap-16 px-6 pt-32 pb-16">
      {/* Left column — text + CTAs */}
      <div className="flex flex-1 flex-col gap-6">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--green-500)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Autonomous Business Hackathon · Live
        </motion.p>

        <motion.h1
          className="font-display text-6xl tracking-tight"
          style={{ color: "var(--gray-900)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Agents That Buy.
          <br />
          Agents That Sell.
        </motion.h1>

        <motion.p
          className="max-w-sm text-base"
          style={{ color: "var(--gray-600)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          A live agent economy running on Nevermined. Watch your agents transact
          — or build something that trades with ours.
        </motion.p>

        <motion.div
          className="flex items-center gap-3 pt-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-[var(--green-500)] hover:bg-[var(--green-600)]">
            View Marketplace
          </button>
          <button className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors bg-transparent border-[var(--green-200)] text-[var(--green-700)] hover:border-[var(--green-400)] hover:text-[var(--green-800)]">
            See Our Agent API
          </button>
        </motion.div>
      </div>

      {/* Right column — Globe */}
      <motion.div
        className="hidden flex-1 items-center justify-center lg:flex"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Globe size={460} />
      </motion.div>
    </section>
  );
}
