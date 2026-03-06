"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BarChart2,
  GitBranch,
  FileText,
  Target,
  Layers,
  Clock,
  Globe,
  TrendingUp,
} from "lucide-react";

export interface InputSuggestion {
  outputType: string;
  template: string;
  mode: string;
  needsRecentData: boolean;
  reason: string;
  depth: "quick" | "standard" | "deep";
}

interface Props {
  input: string;
  workspaceMarket?: string;
  visible: boolean;
  onApply: (suggestion: InputSuggestion) => void;
}

const OUTPUT_ICONS: Record<string, React.ElementType> = {
  research: BarChart2,
  analysis: TrendingUp,
  plan: GitBranch,
  brief: FileText,
  spec: Layers,
  comparison: Target,
  report: Globe,
};

function inferSuggestions(input: string, market?: string): InputSuggestion[] {
  const lower = input.toLowerCase();
  const suggestions: InputSuggestion[] = [];

  // Market research
  if (lower.match(/market|industry|sector|landscape|size|tam|sam/)) {
    suggestions.push({
      outputType: "research",
      template: "Market Analysis",
      mode: "pipeline",
      needsRecentData: true,
      reason: "Market questions benefit from live web data and structured analysis",
      depth: "deep",
    });
  }

  // Competitor / competitive
  if (lower.match(/compet|rival|vs\.|compare|versus|alternative/)) {
    suggestions.push({
      outputType: "analysis",
      template: "Competitive Intelligence",
      mode: "pipeline",
      needsRecentData: true,
      reason: "Competitor analysis needs fresh positioning and pricing data",
      depth: "standard",
    });
  }

  // Strategy / plan / roadmap
  if (lower.match(/strateg|plan|roadmap|gtm|go-to-market|launch|mileston/)) {
    suggestions.push({
      outputType: "plan",
      template: "Strategic Plan",
      mode: "pipeline",
      needsRecentData: false,
      reason: "Strategic planning benefits from structured outline → synthesis",
      depth: "deep",
    });
  }

  // PRD / product / feature / spec
  if (lower.match(/prd|product requirement|feature|spec|user stor/)) {
    suggestions.push({
      outputType: "spec",
      template: "Product Requirements",
      mode: "pipeline",
      needsRecentData: false,
      reason: "PRDs need structured sections: goals, user stories, acceptance criteria",
      depth: "standard",
    });
  }

  // Brief / summary / quick
  if (lower.match(/brief|summary|quick|overview|snapshot|tldr/)) {
    suggestions.push({
      outputType: "brief",
      template: "Executive Brief",
      mode: "strategist",
      needsRecentData: false,
      reason: "A quick brief is best run as Interpreter-only for speed",
      depth: "quick",
    });
  }

  // Research / report
  if (lower.match(/research|report|analys|investigat|deep dive|survey/)) {
    suggestions.push({
      outputType: "research",
      template: "Research Report",
      mode: "researcher",
      needsRecentData: true,
      reason: "Deep research benefits from 2-pass composition with source scoring",
      depth: "deep",
    });
  }

  // Pricing / cost / budget
  if (lower.match(/pric|cost|budget|monetiz|revenue|business model/)) {
    suggestions.push({
      outputType: "analysis",
      template: "Pricing Analysis",
      mode: "pipeline",
      needsRecentData: true,
      reason: "Pricing data changes frequently — live web search recommended",
      depth: "standard",
    });
  }

  // Trend / emerging / future
  if (lower.match(/trend|emerging|future|forecast|predict|next/)) {
    suggestions.push({
      outputType: "research",
      template: "Trend Report",
      mode: "pipeline",
      needsRecentData: true,
      reason: "Trends require the most recent sources — enrichment likely helpful",
      depth: "deep",
    });
  }

  // Workspace market context injection
  if (market && suggestions.length > 0) {
    suggestions[0].reason += `. Tailored for your ${market} workspace context.`;
  }

  // Always offer a fallback if nothing matched
  if (suggestions.length === 0) {
    suggestions.push({
      outputType: "research",
      template: "Custom Research",
      mode: "pipeline",
      needsRecentData: false,
      reason: "Full pipeline: Interpreter → Composer → optional enrichment → Seller packaging",
      depth: "standard",
    });
  }

  return suggestions.slice(0, 3);
}

const DEPTH_COLORS = {
  quick: { color: "#22C55E", bg: "rgba(34,197,94,0.08)", label: "Quick · 1cr" },
  standard: { color: "#0EA5E9", bg: "rgba(14,165,233,0.08)", label: "Standard · 5cr" },
  deep: { color: "#7C3AED", bg: "rgba(124,58,237,0.08)", label: "Deep · 10cr" },
};

export function SmartSuggestions({ input, workspaceMarket, visible, onApply }: Props) {
  const [suggestions, setSuggestions] = useState<InputSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.trim().length < 6) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSuggestions(inferSuggestions(input, workspaceMarket));
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, workspaceMarket]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="space-y-1.5"
      >
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles size={9} style={{ color: "var(--accent-400)" }} />
          <p className="font-mono text-[8px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
            Smart suggestions
          </p>
        </div>
        {suggestions.map((s, i) => {
          const Icon = OUTPUT_ICONS[s.outputType] ?? FileText;
          const depth = DEPTH_COLORS[s.depth];
          return (
            <motion.button
              key={`${s.template}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onApply(s)}
              className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,125,78,0.30)";
                e.currentTarget.style.background = "rgba(201,125,78,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.background = "var(--bg-elevated)";
              }}
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${depth.color}12`, border: `1px solid ${depth.color}20` }}
              >
                <Icon size={13} style={{ color: depth.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
                    {s.template}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[8px] font-semibold"
                    style={{ background: depth.bg, color: depth.color }}
                  >
                    {depth.label}
                  </span>
                  {s.needsRecentData && (
                    <span
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px]"
                      style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B" }}
                    >
                      <Clock size={7} />
                      live data
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] leading-snug" style={{ color: "var(--gray-400)" }}>
                  {s.reason}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
