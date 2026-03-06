"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
  Target,
  Layers,
} from "lucide-react";

export interface ActionIntelligence {
  takeaways: string[];
  decisions: string[];
  risks: string[];
  followUps: string[];
  opportunities: string[];
}

interface Props {
  actions: ActionIntelligence;
  reportTitle?: string;
  onFollowUp?: (prompt: string) => void;
}

const SECTIONS = [
  {
    key: "takeaways" as keyof ActionIntelligence,
    label: "Top Takeaways",
    icon: Lightbulb,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
    dot: "rgba(245,158,11,0.7)",
    emptyMsg: "No key takeaways extracted.",
  },
  {
    key: "decisions" as keyof ActionIntelligence,
    label: "Decisions to Make",
    icon: Target,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.06)",
    border: "rgba(124,58,237,0.18)",
    dot: "rgba(124,58,237,0.7)",
    emptyMsg: "No pending decisions identified.",
  },
  {
    key: "opportunities" as keyof ActionIntelligence,
    label: "Opportunities",
    icon: TrendingUp,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
    dot: "rgba(34,197,94,0.7)",
    emptyMsg: "No opportunities flagged.",
  },
  {
    key: "risks" as keyof ActionIntelligence,
    label: "Risks to Validate",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.18)",
    dot: "rgba(239,68,68,0.7)",
    emptyMsg: "No risks identified.",
  },
  {
    key: "followUps" as keyof ActionIntelligence,
    label: "Follow-up Research",
    icon: HelpCircle,
    color: "#0EA5E9",
    bg: "rgba(14,165,233,0.06)",
    border: "rgba(14,165,233,0.18)",
    dot: "rgba(14,165,233,0.7)",
    emptyMsg: "No follow-up tasks identified.",
  },
];

const FOLLOW_UP_TEMPLATES = [
  { label: "Investor summary", prompt: "Summarize this report for investors in 3 bullet points" },
  { label: "Turn into roadmap", prompt: "Turn the key findings into a product roadmap with milestones" },
  { label: "Extract PRD", prompt: "Extract the product requirements from this report" },
  { label: "Competitive brief", prompt: "Write a competitive positioning brief based on this research" },
  { label: "Risk register", prompt: "Create a risk register from the risks and uncertainties in this report" },
  { label: "One-pager", prompt: "Write a one-page executive summary of this report" },
];

export function ActionPanel({ actions, reportTitle, onFollowUp }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<keyof ActionIntelligence | null>("takeaways");

  const totalItems = Object.values(actions).reduce((sum, arr) => sum + arr.length, 0);
  if (totalItems === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(201,125,78,0.18)", background: "var(--bg-surface)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors"
        style={{ background: "rgba(201,125,78,0.03)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(201,125,78,0.12)", border: "1px solid rgba(201,125,78,0.22)" }}
          >
            <Zap size={14} style={{ color: "var(--accent-400)" }} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold" style={{ color: "var(--gray-900)" }}>
                Decision Intelligence
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[8px] font-bold"
                style={{ background: "rgba(201,125,78,0.12)", color: "var(--accent-400)" }}
              >
                {totalItems} items
              </span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--gray-400)" }}>
              Takeaways · decisions · risks · follow-ups extracted from your report
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={14} style={{ color: "var(--gray-400)" }} />
        ) : (
          <ChevronDown size={14} style={{ color: "var(--gray-400)" }} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Section nav pills */}
            <div
              className="flex gap-1.5 overflow-x-auto border-t px-4 py-2.5"
              style={{ borderColor: "var(--border-default)" }}
            >
              {SECTIONS.filter((s) => actions[s.key].length > 0).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all"
                  style={{
                    background: activeSection === s.key ? s.bg : "transparent",
                    border: `1px solid ${activeSection === s.key ? s.border : "var(--border-default)"}`,
                    color: activeSection === s.key ? s.color : "var(--gray-500)",
                  }}
                >
                  <s.icon size={10} />
                  <span className="font-mono text-[9px] font-semibold">{s.label}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold"
                    style={{
                      background: activeSection === s.key ? `${s.color}18` : "var(--bg-elevated)",
                      color: activeSection === s.key ? s.color : "var(--gray-400)",
                    }}
                  >
                    {actions[s.key].length}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setActiveSection(null)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all"
                style={{
                  background: activeSection === null ? "rgba(14,165,233,0.06)" : "transparent",
                  border: `1px solid ${activeSection === null ? "rgba(14,165,233,0.18)" : "var(--border-default)"}`,
                  color: activeSection === null ? "#0EA5E9" : "var(--gray-500)",
                }}
              >
                <Layers size={10} />
                <span className="font-mono text-[9px] font-semibold">All</span>
              </button>
            </div>

            {/* Items list */}
            <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border-default)" }}>
              <div className="space-y-3">
                {(activeSection ? SECTIONS.filter((s) => s.key === activeSection) : SECTIONS).map((section) => {
                  const items = actions[section.key];
                  if (items.length === 0) return null;
                  return (
                    <div key={section.key}>
                      {!activeSection && (
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <section.icon size={10} style={{ color: section.color }} />
                          <p
                            className="font-mono text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: section.color }}
                          >
                            {section.label}
                          </p>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {items.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                            style={{ background: section.bg, border: `1px solid ${section.border}` }}
                          >
                            <span
                              className="mt-[5px] size-1.5 shrink-0 rounded-full"
                              style={{ background: section.dot }}
                            />
                            <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-700)" }}>
                              {item}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Follow-up templates */}
              {onFollowUp && (
                <div className="mt-4 border-t pt-3.5" style={{ borderColor: "var(--border-default)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 size={11} style={{ color: "var(--accent-400)" }} />
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                      Turn this into something else
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FOLLOW_UP_TEMPLATES.map((t) => {
                      const fullPrompt = reportTitle
                        ? `${t.prompt} (based on: "${reportTitle}")`
                        : t.prompt;
                      return (
                        <button
                          key={t.label}
                          onClick={() => onFollowUp(fullPrompt)}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:scale-[1.02]"
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-default)",
                            color: "var(--gray-600)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(201,125,78,0.35)";
                            e.currentTarget.style.color = "var(--accent-400)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-default)";
                            e.currentTarget.style.color = "var(--gray-600)";
                          }}
                        >
                          {t.label}
                          <ArrowRight size={9} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
