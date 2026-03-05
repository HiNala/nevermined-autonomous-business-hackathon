"use client";

import { useState } from "react";
import Link from "next/link";
import { useScroll } from "@/hooks/use-scroll";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const PAGE_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Research", href: "/research" },
  { label: "Services", href: "/services" },
  { label: "Agents", href: "/agents" },
];

interface NavProps {
  txCount?: number;
}

export function Nav({ txCount }: NavProps) {
  const scrolled = useScroll(10);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-300",
        scrolled || mobileOpen ? "glass-nav" : "bg-transparent"
      )}
    >
      {/* Left: Logo + page links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="relative flex size-6 items-center justify-center">
            <span className="absolute size-6 rounded-md border border-white/10 rotate-45" />
            <span className="size-1.5 rounded-full" style={{ background: "var(--green-500)" }} />
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

      {/* Right: live pill + CTA + mobile toggle */}
      <div className="flex items-center gap-3">
        {typeof txCount === "number" && (
          <div className="glass-pill hidden items-center gap-2 px-3 py-1.5 sm:flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ background: "var(--green-400)" }} />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "var(--green-500)" }} />
            </span>
            <span className="font-mono text-[11px]" style={{ color: "var(--green-400)" }}>
              {txCount} live
            </span>
          </div>
        )}

        <Link
          href="/studio"
          className="hidden rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all duration-200 sm:block"
          style={{
            background: "rgba(34, 197, 94, 0.12)",
            color: "var(--green-400)",
            border: "1px solid rgba(34, 197, 94, 0.20)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(34, 197, 94, 0.20)";
            e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(34, 197, 94, 0.12)";
            e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.20)";
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
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green-400)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-700)")}
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-2 border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
          <Link
            href="/studio"
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-[14px] font-medium text-white"
            style={{ background: "linear-gradient(135deg, var(--green-600), var(--green-500))" }}
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
