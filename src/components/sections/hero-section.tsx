"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight, Brain, ImageIcon, PackageCheck, PenLine, ShoppingBag, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";

const PIPELINE_STEPS = [
  { label: "Seller",      sublabel: "takes order",    color: "#EF4444", icon: ShoppingCart },
  { label: "Interpreter", sublabel: "structures it",  color: "#7C3AED", icon: Brain },
  { label: "Composer",    sublabel: "builds it",      color: "#0EA5E9", icon: PenLine },
  { label: "Buyer",       sublabel: "enriches (opt)", color: "#F59E0B", icon: ShoppingBag, optional: true },
  { label: "Seller",      sublabel: "delivers it",    color: "#EF4444", icon: PackageCheck },
  { label: "VISION",      sublabel: "image (opt)",    color: "#CA8A04", icon: ImageIcon, optional: true },
];


interface LiveStats { totalTransactions: number; totalCreditsFlowed: number; }

export function HeroSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [liveStats, setLiveStats] = useState<LiveStats>({ totalTransactions: 0, totalCreditsFlowed: 0 });

  // Cycle through pipeline steps for the animated flow highlight
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  // Poll live stats every 12s
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/pipeline/stats");
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) setLiveStats({ totalTransactions: d.totalTransactions ?? 0, totalCreditsFlowed: d.totalCreditsFlowed ?? 0 });
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, 12_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const animTx      = useAnimatedCounter(liveStats.totalTransactions, 1200, 600);
  const animCredits = useAnimatedCounter(liveStats.totalCreditsFlowed, 1400, 700);

  return (
    <section className="relative flex min-h-[70vh] sm:min-h-[82vh] flex-col overflow-hidden">
      {/* Multi-layer radial glow */}
      <div className="geo-radial-hero absolute inset-0 pointer-events-none" />

      {/* Floating accent orbs */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,125,78,0.06) 0%, transparent 70%)", top: "10%", right: "8%" }}
        animate={{ y: [0, -18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{ width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)", bottom: "18%", left: "5%" }}
        animate={{ y: [0, 14, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{ width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)", top: "55%", right: "30%" }}
        animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-8 px-4 pb-12 pt-20 sm:px-6 sm:pt-24 lg:flex-row lg:items-center lg:gap-12 lg:pb-16 lg:pt-28">
        {/* Left — copy */}
        <div className="flex w-full max-w-2xl flex-col gap-6 sm:gap-7 lg:flex-1">

          {/* Pill badge — renders instantly */}
          <div className="glass-pill w-fit px-3 py-1.5 flex items-center gap-2">
            <span className="pulse-dot-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--accent-400)" }}>
              Job-Based Agent Commerce · Nevermined x402
            </span>
          </div>

          {/* Headline — renders instantly */}
          <h1 className="font-display leading-none tracking-tight">
            <span className="block text-[2.6rem] sm:text-[3.6rem] lg:text-[4.5rem]" style={{ color: "var(--gray-900)" }}>
              Describe the work.
            </span>
            <span className="block text-[2.6rem] sm:text-[3.6rem] lg:text-[4.5rem] text-gradient-accent">
              Agents build it.
            </span>
          </h1>

          {/* Description — renders instantly */}
          <p
            className="max-w-xl text-[16px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
          >
            Get a structured deliverable in minutes — research reports, strategy briefs, or design specs. Pay per job, no subscription.
          </p>

          {/* Animated pipeline flow */}
          <motion.div
            className="flex flex-wrap items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
          >
            {PIPELINE_STEPS.map((s, i) => {
              const isActive = activeStep === i;
              return (
                <div key={`${s.label}-${i}`} className="flex items-center gap-1.5">
                  <motion.div
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 relative overflow-hidden"
                    animate={{
                      background: isActive ? `${s.color}18` : `${s.color}0a`,
                      borderColor: isActive ? `${s.color}50` : `${s.color}20`,
                      scale: isActive ? 1.05 : 1,
                    }}
                    style={{
                      border: `1px solid ${s.color}20`,
                      opacity: s.optional && !isActive ? 0.6 : 1,
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-lg"
                        style={{ background: `${s.color}08` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                    <s.icon size={10} style={{ color: s.color, position: "relative", zIndex: 1 }} />
                    <span className="font-mono text-[9px] font-semibold" style={{ color: s.color, position: "relative", zIndex: 1 }}>{s.label}</span>
                    <span className="font-mono text-[8px] hidden sm:inline" style={{ color: "var(--gray-400)", position: "relative", zIndex: 1 }}>{s.sublabel}</span>
                    {isActive && (
                      <motion.span
                        className="size-1 rounded-full shrink-0"
                        style={{ background: s.color }}
                        animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <motion.div
                      animate={{ opacity: activeStep >= i ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowRight size={9} style={{ color: "var(--gray-300)", flexShrink: 0 }} />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* CTA buttons — max 2 primary actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/studio"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 btn-press"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: "0 4px 16px -6px rgba(201,125,78,0.40)",
              }}
            >
              <Zap size={13} />
              Open Studio
            </Link>
            <Link
              href="/store"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all duration-200 glow-on-hover"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--gray-700)",
                border: "1px solid var(--border-default)",
              }}
            >
              Browse the Store
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Trust strip — compact inline */}
          <p className="font-mono text-[11px]" style={{ color: "var(--gray-400)" }}>
            From 1 credit ($0.10 USDC) · No signup required · Nevermined x402
          </p>

          {/* Live stats bar — client-only to prevent hydration mismatch */}
          {mounted && (animTx > 0 || animCredits > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "rgba(201,125,78,0.06)", border: "1px solid rgba(201,125,78,0.14)" }}>
                <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-400)" }} />
                <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "var(--accent-400)" }}>
                  {animTx}
                </span>
                <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>agent transactions</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.14)" }}>
                <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "#059669" }}>
                  {animCredits}cr
                </span>
                <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>credits flowed</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.14)" }}>
                <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "#7C3AED" }}>5</span>
                <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>active agents</span>
              </div>
            </div>
          )}
        </div>

        {/* Right — Globe with glow ring */}
        <motion.div
          className="relative hidden flex-1 items-center justify-center xl:flex"
          initial={{ opacity: 0, scale: 0.90 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Glow ring behind globe */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 480, height: 480,
              background: "radial-gradient(circle, rgba(201,125,78,0.08) 0%, rgba(14,165,233,0.04) 40%, transparent 70%)",
              filter: "blur(32px)",
            }}
          />
          <Globe size={460} />
        </motion.div>
      </div>
    </section>
  );
}
