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
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-200",
        scrolled
          ? "border-b bg-white/80 backdrop-blur-md"
          : "bg-transparent"
      )}
      style={{
        borderColor: scrolled ? "var(--border-default)" : "transparent",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: "var(--green-500)" }}
        />
        <span className="font-mono text-sm font-bold tracking-wider text-[var(--gray-900)]">
          {SITE_NAME}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Live status pill */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: "var(--green-50)",
            border: "1px solid var(--green-200)",
          }}
        >
          <span
            className="size-1.5 rounded-full animate-pulse"
            style={{ background: "var(--green-500)" }}
          />
          <span
            className="font-mono text-xs"
            style={{ color: "var(--green-700)" }}
          >
            {txCount} transactions live
          </span>
        </div>

        {/* Connect button */}
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{
            background: "var(--green-500)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--green-600)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--green-500)")
          }
        >
          Connect
        </button>
      </div>
    </nav>
  );
}
