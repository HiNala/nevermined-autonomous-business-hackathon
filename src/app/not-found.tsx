import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Geometric background */}
      <div className="geo-radial absolute inset-0 pointer-events-none" />
      <div className="geo-dot-grid absolute inset-0 pointer-events-none opacity-30" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Icon */}
        <div
          className="flex size-20 items-center justify-center rounded-2xl"
          style={{ background: "rgba(201, 125, 78, 0.06)", border: "1px solid rgba(201, 125, 78, 0.14)" }}
        >
          <span className="font-mono text-3xl font-bold" style={{ color: "var(--accent-400)" }}>
            404
          </span>
        </div>

        {/* Heading */}
        <div>
          <h1
            className="mb-2 font-display text-4xl tracking-tight"
            style={{ color: "var(--gray-900)" }}
          >
            Page not found
          </h1>
          <p className="max-w-sm text-[14px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            The page you&apos;re looking for doesn&apos;t exist or was moved. Head back to the studio.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all duration-200"
            style={{
              background: "var(--glass-bg)",
              color: "var(--gray-600)",
              border: "1px solid var(--border-default)",
            }}
          >
            Back to Home
          </Link>
          <Link
            href="/studio"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
              boxShadow: "0 0 20px -4px rgba(201, 125, 78, 0.30)",
            }}
          >
            Open Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
