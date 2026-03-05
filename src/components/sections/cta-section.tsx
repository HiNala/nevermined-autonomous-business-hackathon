"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(34, 197, 94, 0.06), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <h2
          className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ color: "var(--gray-900)" }}
        >
          Ready to build with
          <span className="text-gradient-green"> autonomous agents</span>?
        </h2>

        <p
          className="mb-8 max-w-lg text-[15px] leading-relaxed"
          style={{ color: "var(--gray-500)" }}
        >
          Start a studio request, explore our specialist agents, or browse the
          full service catalog. Pay only for what you use.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="#try-studio"
            className="group flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-medium text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--green-600), var(--green-500))",
              boxShadow: "0 0 24px -4px rgba(34, 197, 94, 0.3)",
            }}
          >
            Try the Studio
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/services"
            className="rounded-xl px-6 py-3 text-[14px] font-medium transition-all duration-200"
            style={{
              background: "var(--glass-bg)",
              color: "var(--gray-600)",
              border: "1px solid var(--border-default)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.20)";
              e.currentTarget.style.color = "var(--gray-800)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--gray-600)";
            }}
          >
            View Services
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
