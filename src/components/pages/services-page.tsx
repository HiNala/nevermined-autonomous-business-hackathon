"use client";

import { motion } from "framer-motion";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { StudioEntry } from "@/components/sections/studio-entry";
import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { formatCredits } from "@/lib/utils";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { StudioService } from "@/types";

function ServiceDetailCard({ service, index }: { service: StudioService; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative overflow-hidden p-8 transition-all duration-300"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(34, 197, 94, 0.20)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px -10px rgba(34, 197, 94, 0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-8 right-8 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.30), transparent)" }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {/* Left: Name + pricing */}
        <div className="flex flex-col gap-4 lg:w-1/3">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(34, 197, 94, 0.08)" }}
            >
              <Sparkles size={18} style={{ color: "var(--green-400)" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
                {service.name}
              </h2>
              <div className="mt-0.5 flex items-center gap-2">
                <Clock size={11} style={{ color: "var(--gray-400)" }} />
                <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                  {service.turnaround}
                </span>
              </div>
            </div>
          </div>

          <span
            className="w-fit rounded-lg px-3 py-1.5 font-mono text-lg font-bold"
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              color: "var(--green-400)",
              border: "1px solid rgba(34, 197, 94, 0.15)",
            }}
          >
            {formatCredits(service.credits)}
          </span>
        </div>

        {/* Right: description + outcomes */}
        <div className="flex flex-1 flex-col gap-5">
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            {service.summary}
          </p>

          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              What You Get
            </p>
            <div className="space-y-2.5">
              {service.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 size-1.5 rounded-full"
                    style={{ background: "var(--green-400)", opacity: 0.7 }}
                  />
                  <span className="text-[13px]" style={{ color: "var(--gray-500)" }}>
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href={`/studio?q=${encodeURIComponent(`I need a ${service.name}: ${service.summary.split(".")[0]}`)}`}
            className="group mt-2 flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--green-600), var(--green-500))",
              boxShadow: "0 0 20px -4px rgba(34, 197, 94, 0.25)",
            }}
          >
            Start {service.name} in Studio
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function ServicesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Nav />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-6xl px-6">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--gray-900)" }}>
              Service <span className="text-gradient-green">Catalog</span>
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
              Three structured deliverables — research, planning, and design —
              powered by Nevermined credit-based payments.
            </p>
          </motion.div>

          {/* Pricing overview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass mb-10 flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="flex items-center gap-6">
              {STUDIO_SERVICES.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: "var(--green-400)" }} />
                  <span className="text-[13px]" style={{ color: "var(--gray-600)" }}>{s.name}</span>
                  <span className="font-mono text-[12px] font-bold" style={{ color: "var(--green-400)" }}>
                    {formatCredits(s.credits)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-[11px]" style={{ color: "var(--gray-400)" }}>
                Pay per deliverable · No subscription
              </span>
              <span className="font-mono text-[10px]" style={{ color: "var(--green-400)" }}>
                1 credit ≈ $0.10 USDC
              </span>
            </div>
          </motion.div>

          {/* Service cards */}
          <div className="flex flex-col gap-6">
            {STUDIO_SERVICES.map((service, i) => (
              <ServiceDetailCard key={service.id} service={service} index={i} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <StudioEntry />
        </div>
      </main>
      <Footer />
    </div>
  );
}
