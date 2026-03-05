"use client";

import { useState } from "react";
import Link from "next/link";
import { useScroll } from "@/hooks/use-scroll";
import { useTheme } from "@/components/ui/theme-provider";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, X, Sun, Moon } from "lucide-react";

const PAGE_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Store", href: "/store" },
  { label: "Research", href: "/research" },
  { label: "Services", href: "/services" },
  { label: "Agents", href: "/agents" },
];

export function Nav() {
  const scrolled = useScroll(10);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <>
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-300",
        scrolled || mobileOpen
          ? "glass-nav shadow-sm"
          : "bg-transparent"
      )}
    >
      {/* Left: Logo + page links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="relative flex size-6 items-center justify-center">
            <span className="absolute size-6 rounded-md rotate-45" style={{ border: "1px solid var(--accent-400)", opacity: 0.4 }} />
            <span className="size-1.5 rounded-full" style={{ background: "var(--accent-400)" }} />
          </div>
          <span
            className="font-mono text-[13px] font-semibold tracking-widest"
            style={{ color: "var(--gray-900)" }}
          >
            {SITE_NAME}
          </span>
        </Link>

        <div className="hidden items-center gap-4 sm:flex">
          {PAGE_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] transition-colors duration-200"
              style={{ color: "var(--gray-400)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gray-800)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: theme toggle + CTA + mobile toggle */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex size-8 items-center justify-center rounded-lg transition-all duration-200"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--gray-500)",
          }}
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <Link
          href="/studio"
          className="hidden rounded-lg px-4 py-1.5 text-[13px] font-medium text-white transition-all duration-200 sm:block"
          style={{
            background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
            boxShadow: "0 0 20px -4px rgba(99,102,241,0.35)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px -4px rgba(99,102,241,0.50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px -4px rgba(99,102,241,0.35)";
          }}
        >
          Try Studio
        </Link>

        {/* Mobile hamburger */}
        <button
          className="flex size-8 items-center justify-center rounded-md sm:hidden"
          style={{ color: "var(--gray-600)" }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </nav>

    {/* Mobile drawer */}
    {mobileOpen && (
      <div
        className="glass-nav fixed inset-x-0 top-14 z-40 flex flex-col gap-1 px-6 py-4 sm:hidden"
      >
        {PAGE_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors duration-150"
            style={{ color: "var(--gray-700)" }}
            onClick={() => setMobileOpen(false)}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-400)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-700)")}
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-2 border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
          <Link
            href="/studio"
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-[14px] font-medium text-white"
            style={{ background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))" }}
            onClick={() => setMobileOpen(false)}
          >
            Try Studio
          </Link>
        </div>
      </div>
    )}
    </>
  );
}
