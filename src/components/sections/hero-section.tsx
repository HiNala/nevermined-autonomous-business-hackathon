"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Globe } from "@/components/ui/globe";
import { ArrowRight, Send, Zap } from "lucide-react";

export function HeroSection() {
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  // Animated clock tick for the technical footer
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) window.location.href = `/studio?q=${encodeURIComponent(trimmed)}`;
  }

  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <section className="relative min-h-[92vh] overflow-hidden flex flex-col">
      {/* ── Animated background via UnicornStudio ── */}
      <UnicornBackground />

      {/* ── Geometric overlay ── */}
      <div className="geo-radial-hero absolute inset-0 pointer-events-none" />
      <div className="geo-grid absolute inset-0 pointer-events-none opacity-[0.35]" />

      {/* ── Corner frame accents (technical aesthetic) ── */}
      <CornerBracket pos="tl" />
      <CornerBracket pos="tr" />
      <CornerBracket pos="bl" />
      <CornerBracket pos="br" />

      {/* ── Top technical status bar ── */}
      <div
        className="absolute top-14 left-0 right-0 z-10 border-b px-6 py-1.5 hidden lg:flex items-center justify-between"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-4 font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
          <span>SYS.ACTIVE</span>
          <span style={{ color: "var(--border-strong)" }}>|</span>
          <span>AGENT_CLUSTER v2.1</span>
          <span style={{ color: "var(--border-strong)" }}>|</span>
          <span>NVM.MAINNET</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
          <span suppressHydrationWarning>{timeStr}</span>
          <span style={{ color: "var(--border-strong)" }}>|</span>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--green-500)" }} />
            <span style={{ color: "var(--green-400)" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center gap-16 px-6 pt-36 pb-24 lg:pt-40">
        {/* Left — text */}
        <div className="flex flex-1 flex-col gap-7 max-w-xl">

          {/* Status pill */}
          <motion.div
            className="glass-pill inline-flex w-fit items-center gap-2 px-3 py-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Zap size={10} style={{ color: "var(--accent-400)" }} />
            <span className="font-mono text-[11px] tracking-wider" style={{ color: "var(--accent-400)" }}>
              Agent Studio &middot; No signup required
            </span>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="h-px w-8" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>001 / RESEARCH + PLANNING</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-display leading-[1.06] tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-gradient-neutral block text-[3.2rem] sm:text-[4.4rem]">
              Describe the work.
            </span>
            <span className="text-gradient-accent block text-[3.2rem] sm:text-[4.4rem]">
              Agents build it.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="max-w-sm text-[15px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Three specialist agents — Strategist, Researcher, Buyer — collaborate to deliver structured research, plans, and design specs in minutes.
          </motion.p>

          {/* Primary CTA — input */}
          <motion.form
            onSubmit={handleSearch}
            className="relative flex gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What do you need? e.g. Research the AI agent market..."
              className="flex-1 rounded-xl px-4 py-3.5 text-[14px] transition-all"
              style={{
                background: "var(--glass-bg-strong)",
                border: "1px solid var(--border-default)",
                color: "var(--gray-800)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.40)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={!q.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-[14px] font-medium text-white transition-all duration-200 disabled:opacity-30"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: q.trim() ? "0 0 24px -4px rgba(99,102,241,0.50)" : "none",
              }}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Go</span>
            </button>
          </motion.form>

          {/* Trust signals */}
          <motion.div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {["Research Sprint from 1cr", "No subscription", "No signup required"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                <span className="size-1 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.7 }} />
                {t}
              </span>
            ))}
            <a
              href="#agents"
              className="flex items-center gap-1 font-mono text-[10px] transition-opacity hover:opacity-70"
              style={{ color: "var(--accent-400)" }}
            >
              Meet the agents <ArrowRight size={10} />
            </a>
          </motion.div>
        </div>

        {/* Right — Globe */}
        <motion.div
          className="hidden flex-1 items-center justify-center lg:flex"
          initial={{ opacity: 0, scale: 0.90 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Globe size={500} />
        </motion.div>
      </div>

      {/* ── Bottom technical footer bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 border-t px-6 py-2 hidden lg:flex items-center justify-between"
        style={{ borderColor: "var(--border-default)", background: "rgba(10,11,15,0.40)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-6 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
          <span>◐ RENDERING</span>
          <div className="flex gap-1 items-end h-3">
            {[4,7,5,9,6,8,5,7].map((h, i) => (
              <div key={i} className="w-0.5 rounded-sm" style={{ height: `${h}px`, background: "var(--accent-400)", opacity: 0.4 }} />
            ))}
          </div>
          <span>FRAME ∞</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
          <span>V2.1.0</span>
          <div className="flex gap-1">
            {[0,1,2].map((i) => (
              <div key={i} className="size-1 rounded-full animate-pulse" style={{ background: "var(--accent-400)", opacity: 0.5, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <span suppressHydrationWarning>T+{String(tick).padStart(4, "0")}</span>
        </div>
      </div>
    </section>
  );
}

// ── UnicornStudio background embed ──────────────────────────────────
function UnicornBackground() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as Window & { UnicornStudio?: { isInitialized?: boolean; init?: () => void } }).UnicornStudio?.isInitialized) return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
    script.onload = () => {
      const w = window as Window & { UnicornStudio?: { isInitialized?: boolean; init?: () => void } };
      if (!w.UnicornStudio?.isInitialized) {
        w.UnicornStudio?.init?.();
        if (w.UnicornStudio) w.UnicornStudio.isInitialized = true;
      }
    };
    document.head.appendChild(script);

    const style = document.createElement("style");
    style.id = "us-hide-brand";
    style.textContent = `
      [data-us-project] { position:relative!important; overflow:hidden!important; }
      [data-us-project] canvas { clip-path:inset(0 0 8% 0)!important; }
      [data-us-project] * { pointer-events:none!important; }
      [data-us-project] a[href*="unicorn"],
      [data-us-project] [class*="brand"],
      [data-us-project] [class*="credit"],
      [data-us-project] [class*="watermark"] {
        display:none!important; visibility:hidden!important; opacity:0!important;
        position:absolute!important; left:-9999px!important; top:-9999px!important;
      }
    `;
    document.head.appendChild(style);

    const hideBranding = () => {
      document.querySelectorAll("[data-us-project] *").forEach((el) => {
        const text = (el.textContent || "").toLowerCase();
        if (text.includes("made with") || text.includes("unicorn")) {
          (el as HTMLElement).style.display = "none";
        }
      });
    };
    const interval = setInterval(hideBranding, 500);
    setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      document.getElementById("us-hide-brand")?.remove();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block opacity-30">
      <div
        data-us-project="whwOGlfJ5Rz2rHaEUgHl"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// ── Corner bracket decorations ───────────────────────────────────────
function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute size-8 lg:size-12 z-20 pointer-events-none";
  const posMap = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  };
  return (
    <div
      className={`${base} ${posMap[pos]}`}
      style={{ borderColor: "var(--accent-400)", opacity: 0.18 }}
    />
  );
}
