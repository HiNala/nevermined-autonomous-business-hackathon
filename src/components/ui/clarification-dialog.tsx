"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ArrowRight, SkipForward, Brain, Zap } from "lucide-react";
import type { BriefRouting } from "@/lib/agent/strategist";

interface ClarificationDialogProps {
  open: boolean;
  questions: string[];
  routing?: BriefRouting;
  onAnswer: (answers: string[]) => void;
  onSkip: () => void;
}

const DEPTH_COLORS = {
  quick: { color: "#22C55E", bg: "rgba(34,197,94,0.08)", label: "Quick brief" },
  standard: { color: "#0EA5E9", bg: "rgba(14,165,233,0.08)", label: "Standard report" },
  deep: { color: "#7C3AED", bg: "rgba(124,58,237,0.08)", label: "Deep research" },
};

const ENRICHMENT_COLORS = {
  high: { color: "#F59E0B", label: "Enrichment likely" },
  medium: { color: "#0EA5E9", label: "Enrichment possible" },
  low: { color: "var(--gray-400)", label: "No enrichment needed" },
};

export function ClarificationDialog({ open, questions, routing, onAnswer, onSkip }: ClarificationDialogProps) {
  const answers = questions.map(() => "");

  function handleSubmit(answersMap: Record<number, string>) {
    const filled = questions.map((_, i) => answersMap[i] ?? "");
    onAnswer(filled);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg rounded-2xl p-6"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 24px 80px -12px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header */}
            <div className="mb-5 flex items-start gap-3">
              <div
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.22)" }}
              >
                <Brain size={16} style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--gray-900)" }}>
                  Quick clarification
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ color: "var(--gray-500)" }}>
                  The Interpreter flagged this request as ambiguous. Answer below for a better brief — or skip to run as-is.
                </p>
              </div>
            </div>

            {/* Routing preview chips */}
            {routing && (
              <div className="mb-5 flex flex-wrap gap-2">
                {routing.recommendedDepth && (
                  <span
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold"
                    style={{
                      background: DEPTH_COLORS[routing.recommendedDepth].bg,
                      color: DEPTH_COLORS[routing.recommendedDepth].color,
                      border: `1px solid ${DEPTH_COLORS[routing.recommendedDepth].color}25`,
                    }}
                  >
                    <Zap size={9} />
                    {DEPTH_COLORS[routing.recommendedDepth].label}
                  </span>
                )}
                {routing.enrichmentLikelihood && (
                  <span
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold"
                    style={{
                      color: ENRICHMENT_COLORS[routing.enrichmentLikelihood].color,
                      background: `${ENRICHMENT_COLORS[routing.enrichmentLikelihood].color}12`,
                      border: `1px solid ${ENRICHMENT_COLORS[routing.enrichmentLikelihood].color}25`,
                    }}
                  >
                    {ENRICHMENT_COLORS[routing.enrichmentLikelihood].label}
                  </span>
                )}
                {routing.candidateTemplates.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 font-mono text-[9px]"
                    style={{ background: "var(--bg-surface)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}
                  >
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Questions */}
            <ClarificationForm questions={questions} onSubmit={handleSubmit} onSkip={onSkip} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ClarificationForm({
  questions,
  onSubmit,
  onSkip,
}: {
  questions: string[];
  onSubmit: (answers: Record<number, string>) => void;
  onSkip: () => void;
}) {
  const [answers, setAnswers] = React.useState<Record<number, string>>({});

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i}>
          <div className="mb-2 flex items-start gap-2">
            <HelpCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#7C3AED" }} />
            <p className="text-[13px] font-medium" style={{ color: "var(--gray-800)" }}>{q}</p>
          </div>
          <input
            type="text"
            value={answers[i] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
            placeholder="Your answer (optional)"
            className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--gray-800)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.40)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-80"
          style={{ color: "var(--gray-500)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <SkipForward size={12} />
          Skip — run as-is
        </button>
        <button
          onClick={() => onSubmit(answers)}
          className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[12px] font-semibold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "white",
            boxShadow: "0 4px 14px -4px rgba(124,58,237,0.40)",
          }}
        >
          Run with context
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// Need React imported for useState
import React from "react";
