"use client";

import { motion } from "framer-motion";
import { MessageSquare, Cpu, FileCheck } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Describe what you need",
    description: "Type a brief in plain English — a market question, product problem, or design task. No templates, no forms.",
    tag: "Free to try",
  },
  {
    icon: Cpu,
    number: "02",
    title: "Agents execute it",
    description: "The Strategist structures your brief. The Researcher searches the live web. CANVAS drafts the spec. All automatic.",
    tag: "2–8 minutes",
  },
  {
    icon: FileCheck,
    number: "03",
    title: "Get a structured deliverable",
    description: "A real document — research findings with citations, a planning doc with milestones, or a UI spec with copy. Ready to act on.",
    tag: "1–10 credits",
  },
];

export function DecisionLogic() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>002 / HOW IT WORKS</span>
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
          Three steps. Real output.
        </h2>
      </div>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Connector line — desktop only */}
        <div
          className="absolute top-[52px] left-[33%] right-[33%] hidden h-px sm:block"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.25), transparent)" }}
        />

        {STEPS.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass relative overflow-hidden p-6"
          >
            {/* Top accent */}
            <div
              className="absolute top-0 left-6 right-6 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.30), transparent)" }}
            />

            {/* Number + Icon row */}
            <div className="mb-5 flex items-center justify-between">
              <div
                className="flex size-11 items-center justify-center rounded-xl"
                style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.16)" }}
              >
                <step.icon size={20} style={{ color: "var(--accent-400)" }} />
              </div>
              <span
                className="font-mono text-[28px] font-bold leading-none"
                style={{ color: "rgba(99, 102, 241, 0.15)" }}
              >
                {step.number}
              </span>
            </div>

            <h3
              className="mb-2 text-[15px] font-semibold tracking-tight"
              style={{ color: "var(--gray-900)" }}
            >
              {step.title}
            </h3>
            <p
              className="mb-5 text-[13px] leading-relaxed"
              style={{ color: "var(--gray-500)" }}
            >
              {step.description}
            </p>

            <span
              className="inline-flex rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold"
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                color: "var(--accent-400)",
                border: "1px solid rgba(99, 102, 241, 0.18)",
              }}
            >
              {step.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
