"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { StudioEntry } from "@/components/sections/studio-entry";
import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { formatCredits } from "@/lib/utils";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { StudioService } from "@/types";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

function ServiceDetailCard({ service, index }: { service: StudioService; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px -10px rgba(201,125,78,0.18), 0 2px 8px rgba(0,0,0,0.05)", borderColor: "rgba(201,125,78,0.28)", transition: { type: "spring", stiffness: 350, damping: 28 } }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative overflow-hidden p-8 cursor-default"
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-8 right-8 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201, 125, 78, 0.25), transparent)" }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {/* Left: Name + pricing */}
        <div className="flex flex-col gap-4 lg:w-1/3">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(201, 125, 78, 0.08)" }}
            >
              <Sparkles size={18} style={{ color: "var(--accent-400)" }} />
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
              background: "rgba(201, 125, 78, 0.08)",
              color: "var(--accent-400)",
              border: "1px solid rgba(201, 125, 78, 0.18)",
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
                    style={{ background: "var(--accent-400)", opacity: 0.7 }}
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
            className="group mt-2 flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 btn-press"
            style={{
              background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
              boxShadow: "0 0 20px -4px rgba(201, 125, 78, 0.28)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px -4px rgba(201,125,78,0.45)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px -4px rgba(201, 125, 78, 0.28)"; }}
          >
            Start {service.name} in Studio
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function LiveStatsBar() {
  const [tx, setTx] = useState(0);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/pipeline/stats");
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) {
          setTx(d.totalTransactions ?? 0);
          setCredits(d.totalCreditsFlowed ?? 0);
        }
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const animTx      = useAnimatedCounter(tx, 1200, 400);
  const animCredits = useAnimatedCounter(credits, 1400, 500);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="mb-8 flex flex-wrap items-center gap-2"
    >
      <div
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
        style={{ background: "rgba(201,125,78,0.06)", border: "1px solid rgba(201,125,78,0.14)" }}
      >
        <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-400)" }} />
        <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "var(--accent-400)" }}>
          {animTx}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>deliverables run</span>
      </div>
      <div
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
        style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.14)" }}
      >
        <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "#059669" }}>
          {animCredits}cr
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>credits settled</span>
      </div>
      <div
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
        style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.14)" }}
      >
        <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "#7C3AED" }}>
          {STUDIO_SERVICES.length}
        </span>
        <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>service types</span>
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
          {/* Page header — renders immediately, no animation delay */}
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>Service Catalog</span>
            </div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--gray-900)" }}>
              High-signal{" "}<span className="text-gradient-accent">deliverables.</span>
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
              Research, analysis, strategy, and more — generated on-demand by five specialist agents,
              settled via Nevermined credit-based payments.
            </p>
          </div>

          <LiveStatsBar />

          {/* Pricing overview — no delay */}
          <div
            className="glass mb-10 flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="flex items-center gap-6">
              {STUDIO_SERVICES.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: "var(--accent-400)" }} />
                  <span className="text-[13px]" style={{ color: "var(--gray-600)" }}>{s.name}</span>
                  <span className="font-mono text-[12px] font-bold" style={{ color: "var(--accent-400)" }}>
                    {formatCredits(s.credits)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-[11px]" style={{ color: "var(--gray-400)" }}>
                Pay per deliverable · No subscription
              </span>
              <span className="font-mono text-[10px]" style={{ color: "var(--accent-400)" }}>
                1 credit ≈ $0.10 USDC
              </span>
            </div>
          </div>

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
      <ScrollToTop />
    </div>
  );
}
