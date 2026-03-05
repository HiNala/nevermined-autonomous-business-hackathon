"use client";

import { motion } from "framer-motion";
import type { StudioService } from "@/types";
import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { Clock, Sparkles } from "lucide-react";

function ServiceCard({ service, index }: { service: StudioService; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="glass group relative overflow-hidden p-6 transition-all duration-300 hover:border-[rgba(99,102,241,0.22)]">
        {/* Credit badge */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--accent-400)" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--gray-900)" }}
            >
              {service.name}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={11} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                {service.turnaround}
              </span>
            </div>
            <span
              className="rounded-md px-2 py-0.5 font-mono text-[11px] font-bold"
              style={{
                background: "rgba(99, 102, 241, 0.10)",
                color: "var(--accent-400)",
                border: "1px solid rgba(99, 102, 241, 0.20)",
              }}
            >
              {service.credits}cr
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          className="mb-5 text-[13px] leading-relaxed"
          style={{ color: "var(--gray-500)" }}
        >
          {service.summary}
        </p>

        {/* Outcomes */}
        <div className="flex flex-wrap gap-1.5">
          {service.outcomes.map((outcome) => (
            <span
              key={outcome}
              className="rounded-md px-2.5 py-1 text-[10px] font-medium"
              style={{
                background: "var(--gray-100)",
                color: "var(--gray-500)",
              }}
            >
              {outcome}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ServicesSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16">
      {/* Geometric accent */}
      <div className="geo-radial absolute inset-0 pointer-events-none" />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            Services
          </h2>
          <span className="font-mono text-[11px]" style={{ color: "var(--gray-400)" }}>
            Pay per deliverable
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STUDIO_SERVICES.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
