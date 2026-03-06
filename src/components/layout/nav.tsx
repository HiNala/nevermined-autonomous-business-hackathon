"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useScroll } from "@/hooks/use-scroll";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, X, CreditCard, Zap, Settings } from "lucide-react";
import { SettingsPanel } from "@/components/ui/settings-panel";
import { loadToolSettings, saveToolSettings, type ToolSettings } from "@/lib/tool-settings";

function useLiveTxCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      try {
        const r = await fetch("/api/pipeline/stats");
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) setCount(d.totalTransactions ?? 0);
      } catch { /* silent */ }
    }
    fetch_();
    const id = setInterval(fetch_, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return count;
}

const PAGE_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Store", href: "/store" },
  { label: "Services", href: "/services" },
  { label: "Agents", href: "/agents" },
];

export function Nav() {
  const scrolled = useScroll(10);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolSettings, setToolSettings] = useState<ToolSettings>(() => loadToolSettings());
  const pathname = usePathname();
  const txCount = useLiveTxCount();

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  return (
    <>
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-300",
        scrolled || mobileOpen ? "glass-nav shadow-sm" : "bg-transparent"
      )}
    >
      {/* Left: Logo + page links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="relative flex size-6 items-center justify-center">
            <span
              className="absolute size-6 rounded-md rotate-45 transition-all duration-300 group-hover:rotate-[225deg] group-hover:scale-110"
              style={{ border: "1px solid var(--accent-400)", opacity: 0.4 }}
            />
            <span
              className="size-1.5 rounded-full transition-all duration-300 group-hover:scale-150"
              style={{ background: "var(--accent-400)" }}
            />
          </div>
          <span className="font-mono text-[13px] font-semibold tracking-widest transition-colors duration-200 group-hover:text-[color:var(--accent-400)]" style={{ color: "var(--gray-900)" }}>
            {SITE_NAME}
          </span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {PAGE_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className="relative px-3 py-1.5 text-[13px] transition-colors duration-200 rounded-lg"
                style={{ color: isActive ? "var(--gray-900)" : "var(--gray-400)" }}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--gray-700)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--gray-400)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--accent-600), var(--accent-400))" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: CTA + mobile toggle */}
      <div className="flex items-center gap-2.5">
        {txCount !== null && txCount > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex" style={{ borderColor: "rgba(201,125,78,0.22)", background: "rgba(201,125,78,0.06)" }}>
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-400)" }} />
            <span className="font-mono text-[10px] font-semibold tabular-nums" style={{ color: "var(--accent-400)" }}>
              {txCount} tx live
            </span>
          </div>
        )}
        <button
          onClick={() => setSettingsOpen(true)}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 sm:flex"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,125,78,0.30)"; (e.currentTarget as HTMLElement).style.color = "var(--accent-400)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.color = "var(--gray-500)"; }}
          title="Settings (⌘K)"
        >
          <Settings size={13} />
        </button>
        <Link
          href="/studio?checkout=true"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-200 sm:flex btn-press"
          style={{ background: "rgba(201,125,78,0.08)", border: "1px solid rgba(201,125,78,0.18)", color: "var(--accent-400)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(201,125,78,0.14)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(201,125,78,0.08)"; }}
        >
          <CreditCard size={12} />
          Buy Credits
        </Link>

        <Link
          href="/studio"
          className="hidden rounded-lg px-4 py-1.5 text-[13px] font-medium text-white transition-all duration-200 sm:flex items-center gap-1.5 btn-press"
          style={{ background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))", boxShadow: "0 2px 12px -4px rgba(201,125,78,0.30)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 20px -4px rgba(201,125,78,0.50)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px -4px rgba(201,125,78,0.30)"; }}
        >
          <Zap size={11} />
          Try Studio
        </Link>

        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors sm:hidden"
          style={{ color: "var(--gray-600)" }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileOpen ? "x" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </nav>

    {/* Mobile backdrop + drawer */}
    <AnimatePresence>
      {mobileOpen && (
        <>
        {/* Dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-30 sm:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer panel */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-x-0 top-14 z-40 flex flex-col gap-1 px-6 py-4 sm:hidden"
          style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border-default)", boxShadow: "0 12px 48px rgba(0,0,0,0.20)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
          {PAGE_LINKS.map((link, i) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={link.href}
                  className="flex items-center rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors duration-150"
                  style={{ color: isActive ? "var(--accent-400)" : "var(--gray-700)", background: isActive ? "rgba(201,125,78,0.06)" : "transparent" }}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                  {isActive && <span className="ml-auto size-1.5 rounded-full" aria-hidden="true" style={{ background: "var(--accent-400)" }} />}
                </Link>
              </motion.div>
            );
          })}
          <div className="mt-2 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
            <button
              onClick={() => { setMobileOpen(false); setSettingsOpen(true); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium transition-all"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--gray-600)" }}
            >
              <Settings size={14} /> Settings
            </button>
            <Link href="/studio?checkout=true" className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium transition-all" style={{ background: "rgba(201,125,78,0.08)", border: "1px solid rgba(201,125,78,0.18)", color: "var(--accent-400)" }} onClick={() => setMobileOpen(false)}>
              <CreditCard size={14} /> Buy Credits
            </Link>
            <Link href="/studio" className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium text-white" style={{ background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))" }} onClick={() => setMobileOpen(false)}>
              <Zap size={14} /> Try Studio
            </Link>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
    <SettingsPanel
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      settings={toolSettings}
      onChange={(next) => {
        setToolSettings(next);
        saveToolSettings(next);
      }}
    />
    </>
  );
}
