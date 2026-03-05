"use client";

import { useScroll } from "@/hooks/use-scroll";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavProps {
  txCount: number;
}

export function Nav({ txCount }: NavProps) {
  const scrolled = useScroll(10);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-300",
        scrolled ? "glass-nav" : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-6 items-center justify-center">
          <span className="absolute size-6 rounded-md border border-[var(--green-500)]/30 rotate-45" />
          <span className="size-1.5 rounded-full bg-[var(--green-500)]" />
        </div>
        <span
          className="font-mono text-[13px] font-semibold tracking-widest"
          style={{ color: "var(--gray-900)" }}
        >
          {SITE_NAME}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="glass-pill flex items-center gap-2 px-3 py-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--green-400)] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[var(--green-500)]" />
          </span>
          <span className="font-mono text-[11px]" style={{ color: "var(--green-400)" }}>
            {txCount} live
          </span>
        </div>

        <button
          className="rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all duration-200"
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
          Connect Agent
        </button>
      </div>
    </nav>
  );
}
