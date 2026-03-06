"use client";

import { motion } from "framer-motion";
import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { formatCredits } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { StudioService } from "@/types";

function ServiceCard({ service, index }: { service: StudioService; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="glass group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(201, 125, 78, 0.22)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px -8px rgba(201, 125, 78, 0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201, 125, 78, 0.25), transparent)" }}
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
            {service.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5">
            <Clock size={11} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {service.turnaround}
            </span>
          </div>
        </div>
        <span
          className="rounded-lg px-2.5 py-1 font-mono text-[12px] font-bold"
          style={{
            background: "rgba(201, 125, 78, 0.10)",
            color: "var(--accent-400)",
            border: "1px solid rgba(201, 125, 78, 0.20)",
          }}
        >
          {formatCredits(service.credits)}
        </span>
      </div>

      <p className="mb-5 text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
        {service.summary}
      </p>

      <div className="space-y-2">
        {service.outcomes.map((outcome) => (
          <div key={outcome} className="flex items-start gap-2">
            <span
              className="mt-1.5 size-1 rounded-full"
              style={{ background: "var(--accent-400)", opacity: 0.7 }}
            />
            <span className="text-[12px]" style={{ color: "var(--gray-500)" }}>
              {outcome}
            </span>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

export function StudioServices() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>004 / STUDIO SERVICES</span>
          </div>
          <h2 className="mb-1 text-[26px] font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
            What you get back.
          </h2>
          <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            Three deliverables for teams that need fast research, planning, and front-end direction.
            Pay only for what you use &mdash; no subscription.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="glass-pill px-3 py-1.5">
            <span className="font-mono text-[10px]" style={{ color: "var(--accent-400)" }}>
              1 credit ≈ $0.10 USDC
            </span>
          </div>
          <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>Nevermined-powered</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {STUDIO_SERVICES.map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
