"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight, Brain, ImageIcon, PackageCheck, PenLine, Send, ShoppingBag, ShoppingCart, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

const PIPELINE_STEPS = [
  { label: "Seller",      sublabel: "takes order",    color: "#EF4444", icon: ShoppingCart },
  { label: "Interpreter", sublabel: "structures it",  color: "#7C3AED", icon: Brain },
  { label: "Composer",    sublabel: "builds it",      color: "#0EA5E9", icon: PenLine },
  { label: "Buyer",       sublabel: "enriches (opt)", color: "#F59E0B", icon: ShoppingBag, optional: true },
  { label: "Seller",      sublabel: "delivers it",    color: "#EF4444", icon: PackageCheck },
  { label: "VISION",      sublabel: "image (opt)",    color: "#CA8A04", icon: ImageIcon, optional: true },
];

const PROOF_CARDS = [
  { color: "#7C3AED", icon: Brain,       title: "Clarification-aware", body: "Interpreter scores brief quality and asks 1–2 targeted questions before ambiguous jobs run. Workspace context applied automatically." },
  { color: "#0EA5E9", icon: PenLine,     title: "2-pass composition",  body: "Composer builds a full outline first, then expands each section with source attribution, contradiction detection, and confidence scoring." },
  { color: "#CA8A04", icon: ImageIcon,   title: "VISION image loop",   body: "After every report, VISION generates a hero image via NanoBanana with a GPT-4o-mini quality judge — up to 3 attempts, automatically refined." },
];

const TRUST_BADGES = [
  { label: "From 1 credit", sub: "$0.10 USDC" },
  { label: "No signup", sub: "required" },
  { label: "A2A ready", sub: "Nevermined x402" },
];

export function HeroSection() {
  const [q, setQ] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  // Cycle through pipeline steps for the animated flow highlight
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) window.location.href = `/studio?q=${encodeURIComponent(trimmed)}`;
  }

  return (
    <section className="relative flex min-h-[82vh] flex-col overflow-hidden">
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
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center gap-12 px-6 pb-16 pt-24 lg:pt-28">
        {/* Left — copy */}
        <div className="flex max-w-2xl flex-1 flex-col gap-7">

          {/* Pill badge */}
          <motion.div
            className="glass-pill w-fit px-3 py-1.5 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="pulse-dot-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--accent-400)" }}>
              Job-Based Agent Commerce · Nevermined x402
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-display leading-none tracking-tight"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="block text-[3.2rem] sm:text-[4.5rem]" style={{ color: "var(--gray-900)" }}>
              Describe the work.
            </span>
            <span className="block text-[3.2rem] sm:text-[4.5rem] text-gradient-accent">
              Agents build it.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="max-w-xl text-[16px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            Send a request from Studio, the Store, or directly via API. Five agents handle intake, structuring, research, enrichment, delivery, and image generation — with full provenance and quality gates.
          </motion.p>

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

          {/* CTA input */}
          <motion.form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. Research the AI agent market in 2025…"
                className="w-full rounded-xl px-4 py-3.5 text-[14px] transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--gray-800)",
                  outline: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.10), 0 1px 4px rgba(0,0,0,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }}
              />
              {q.trim() && (
                <motion.span
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px]"
                  style={{ color: "var(--gray-400)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Enter ↵
                </motion.span>
              )}
            </div>
            <button
              type="submit"
              disabled={!q.trim()}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-30 btn-press"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: q.trim() ? "0 4px 18px -4px rgba(201,125,78,0.50)" : "none",
                minWidth: "80px",
              }}
            >
              <Send size={14} />
              <span>Go</span>
            </button>
          </motion.form>

          {/* CTA buttons row */}
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.33 }}
          >
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
            <a
              href="#agents"
              className="flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 hover:opacity-70"
              style={{ color: "var(--accent-400)" }}
            >
              <Sparkles size={12} />
              Meet the agents
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            {TRUST_BADGES.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
              >
                <span className="text-[11px] font-medium" style={{ color: "var(--gray-700)" }}>{b.label}</span>
                <span className="text-[10px]" style={{ color: "var(--gray-400)" }}>·</span>
                <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>{b.sub}</span>
              </div>
            ))}
          </motion.div>

          {/* Proof cards */}
          <motion.div
            className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42 }}
          >
            {PROOF_CARDS.map((item, i) => (
              <motion.div
                key={item.title}
                className="group rounded-xl p-4 transition-all duration-200 cursor-default"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  border: `1px solid ${item.color}18`,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}
                whileHover={{
                  y: -3,
                  boxShadow: `0 8px 24px -8px ${item.color}22, 0 2px 8px rgba(0,0,0,0.06)`,
                  borderColor: `${item.color}35`,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <motion.div
                    className="flex size-7 items-center justify-center rounded-lg"
                    style={{ background: `${item.color}12` }}
                    whileHover={{ scale: 1.15, background: `${item.color}22` }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <item.icon size={13} style={{ color: item.color }} />
                  </motion.div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--gray-800)" }}>
                    {item.title}
                  </p>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
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
