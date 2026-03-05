"use client";

import { motion } from "framer-motion";

interface StepProps {
  number: number;
  title: string;
  description: string;
  index: number;
}

function Step({ number, title, description, index }: StepProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="mb-4 flex size-10 items-center justify-center rounded-lg font-mono text-sm font-bold"
        style={{
          background: "rgba(34, 197, 94, 0.08)",
          color: "var(--green-400)",
          border: "1px solid rgba(34, 197, 94, 0.15)",
        }}
      >
        {number}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold" style={{ color: "var(--gray-900)" }}>
        {title}
      </h3>
      <p className="max-w-[220px] text-[12px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
        {description}
      </p>
    </motion.div>
  );
}

export function DecisionLogic() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2
        className="mb-8 text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--gray-400)" }}
      >
        How It Works
      </h2>

      <div className="glass p-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Step
            number={1}
            title="Describe"
            description="Tell us what you need — a research brief, product plan, or design spec."
            index={0}
          />
          <Step
            number={2}
            title="Agents Execute"
            description="SCOUT, ORBIT, or CANVAS runs your request. Credits deducted per service."
            index={1}
          />
          <Step
            number={3}
            title="Receive Deliverable"
            description="Get a structured artifact: findings, plan, or spec — ready to act on."
            index={2}
          />
        </div>

        {/* Connector lines */}
        <div className="mt-6 hidden items-center justify-center gap-2 sm:flex">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="h-px w-20"
                style={{ background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.20))" }}
              />
              <span className="text-[10px]" style={{ color: "var(--green-400)", opacity: 0.5 }}>→</span>
              <div
                className="h-px w-20"
                style={{ background: "linear-gradient(90deg, rgba(34, 197, 94, 0.20), transparent)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
