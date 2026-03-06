"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Do I need to sign up or create an account?",
    a: "No. The Studio works immediately in demo mode — no account, no API key, no credit card. Submit a brief and get a structured deliverable back right away.",
  },
  {
    q: "What is a credit? What does it cost in real money?",
    a: "Credits are the unit of payment on the Nevermined network. 1 credit ≈ $0.10 USDC. A Research Sprint costs 1cr (~$0.10), a Planning Pack 5cr (~$0.50), and a Frontend Design Spec 10cr (~$1.00). You pay only for what you use — no monthly fee.",
  },
  {
    q: "What's the difference between demo mode and live mode?",
    a: "In demo mode the pipeline runs end-to-end but the Buyer does not transact on the marketplace. In live mode, the Buyer can purchase third-party data assets via Nevermined x402 — external sections are labeled ✦ External so the origin is always clear.",
  },
  {
    q: "Which AI model runs the agents?",
    a: "The pipeline auto-selects from OpenAI GPT-4o, Google Gemini, or Anthropic Claude depending on which key is configured. You can set your preferred provider from the Studio settings panel.",
  },
  {
    q: "Is my data private?",
    a: "Briefs you submit are only used to generate your deliverable. Nothing is stored beyond the current session. The server never logs your content to any third-party analytics service.",
  },
  {
    q: "What format does the output come in?",
    a: "Structured documents with sections, headings, and source citations. Copy to clipboard or download as Markdown — renders cleanly in Notion, GitHub, Obsidian, and most editors.",
  },
  {
    q: "How long does a request take?",
    a: "A Research Sprint finishes in 45–90 seconds. The Full Pipeline (Interpreter → Composer → Buyer → Seller) takes 3–7 minutes depending on web scraping speed. The Studio shows live stage progress so you always know what's happening.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const num = String(index + 1).padStart(2, "0");
  const answerId = `faq-answer-${index}`;
  const buttonId = `faq-btn-${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="border-b"
      style={{ borderColor: "var(--border-default)" }}
    >
      <button
        id={buttonId}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-all duration-150"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={answerId}
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <span
            className="shrink-0 font-mono text-[9px] tracking-wider"
            style={{ color: open ? "var(--accent-400)" : "var(--gray-300)" }}
          >
            {num}
          </span>
          <span
            className="text-[14px] font-medium transition-colors duration-150"
            style={{ color: open ? "var(--gray-900)" : "var(--gray-700)" }}
          >
            {q}
          </span>
        </div>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="shrink-0 transition-transform duration-200"
          style={{
            color: open ? "var(--accent-400)" : "var(--gray-400)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={answerId}
            role="region"
            aria-labelledby={buttonId}
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mb-4 ml-6 border-l-2 pl-4"
              style={{ borderColor: "rgba(201,125,78,0.30)" }}
            >
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--gray-500)" }}
              >
                {a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px w-8" style={{ background: "linear-gradient(90deg, var(--accent-400), transparent)", opacity: 0.7 }} />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-400)" }}>008 / FAQ</span>
        </div>
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-[32px]" style={{ color: "var(--gray-900)" }}>
          Common{" "}<span className="text-gradient-accent">questions.</span>
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
          Everything you need to know about agents, credits, and the pipeline.
        </p>
      </div>

      <div className="glass overflow-hidden">
        <div className="px-6">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
