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
    a: "In demo mode the agents run fully — SCOUT researches the web, ORBIT structures a plan, CANVAS drafts a design spec — but no on-chain payment is made. In live mode, each job is settled on Nevermined and your credits are deducted. Switch by adding your NVM_API_KEY to the server config.",
  },
  {
    q: "Which AI model runs the agents?",
    a: "The pipeline auto-selects from OpenAI GPT-4o, Google Gemini, or Anthropic Claude depending on which key is configured. You can set your preferred provider from the Studio settings panel.",
  },
  {
    q: "Can I use my own Exa or Apify API keys for richer research?",
    a: "Yes. Add EXA_API_KEY or APIFY_API_TOKEN to your environment and toggle the search/scrape tool in the Studio settings panel. Without keys, the agents fall back to DuckDuckGo + raw HTML fetch automatically.",
  },
  {
    q: "Is my data private?",
    a: "Briefs you submit are only used to generate your deliverable. Nothing is stored beyond the current session. The server never logs your content to any third-party analytics service.",
  },
  {
    q: "Can I call the agents from my own code?",
    a: "Yes — the Research Agent is exposed as a Nevermined-compatible seller endpoint at /api/agent/research. The agent discovery manifest is at /.well-known/agent.json. Any A2A-compatible buyer can call and pay for it autonomously.",
  },
  {
    q: "What format does the output come in?",
    a: "Deliverables are returned as structured documents with sections, headings, and source citations. You can copy the full text to clipboard or download it as a .md (Markdown) file directly from the Studio. Markdown renders cleanly in Notion, GitHub, Obsidian, and most editors.",
  },
  {
    q: "How long does a request actually take?",
    a: "A Research Sprint (1cr) typically finishes in 45–90 seconds with the Researcher agent only. The Full Pipeline — Strategist + Researcher + Buyer — takes 3–7 minutes depending on web scraping speed and model response time. The loading screen shows live stage progress so you always know what's happening.",
  },
  {
    q: "What should I do with the deliverable once I have it?",
    a: "Copy or download it as Markdown and paste it into your doc, note-taking app, or codebase. Research Sprints make great starting points for blog posts, pitch decks, or product specs. Planning Packs give you a ready-to-execute task structure. Design Specs can go straight to an engineer or Figma.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="border-b"
      style={{ borderColor: "var(--border-default)" }}
    >
      <button
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors duration-150"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-[14px] font-medium" style={{ color: "var(--gray-800)" }}>
          {q}
        </span>
        <ChevronDown
          size={15}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: "var(--gray-400)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p
              className="pb-4 text-[13px] leading-relaxed"
              style={{ color: "var(--gray-500)" }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-8">
        <h2
          className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--gray-400)" }}
        >
          FAQ
        </h2>
        <p className="text-[13px]" style={{ color: "var(--gray-500)" }}>
          Common questions about how the Studio works.
        </p>
      </div>

      <div className="glass overflow-hidden p-6">
        {FAQS.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
        ))}
      </div>
    </section>
  );
}
