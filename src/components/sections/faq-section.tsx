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
    a: "In demo mode the canonical pipeline runs (Seller → Interpreter → Composer → Seller), but the Buyer does not transact. Enrichment is planned and narrated in the event log, but no real marketplace purchases happen. In live mode, External Marketplace is enabled and the Buyer can purchase third-party assets via Nevermined x402. External sections in the final report are labeled ✦ External so the origin is always clear.",
  },
  {
    q: "What does the Buyer agent actually do? When does it run?",
    a: "The Buyer is a specialist agent that discovers and purchases third-party data assets from the Nevermined marketplace. It only runs when the Seller decides enrichment is needed — it is not part of every pipeline run. When it does run, purchased assets are merged into the report as labeled ✦ External sections. The Seller's enrichment summary always shows whether procurement was used, skipped, or disabled.",
  },
  {
    q: "How can I see the provenance of a deliverable?",
    a: "Every seller-packaged delivery includes a provenance footer showing which agents were involved: Structured by Interpreter → Composed by Composer → Enriched by Buyer (if used) → Delivered by Seller. In the Studio, the Provenance tab shows the full agent chain, model used, sources fetched, and whether external data was purchased. The delivery package also includes job ID and order ID for traceability.",
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
    a: "Yes — the Seller API accepts external orders at /api/agent/seller and /api/pipeline/run. The machine-readable manifest at /.well-known/agent.json documents all endpoints, versioned handoff contracts (IncomingOrder, EnrichmentRequest, ComposedReport), and the canonical pipeline stages. Any A2A-compatible buyer can call and pay via Nevermined x402 autonomously.",
  },
  {
    q: "What are the versioned agent contracts?",
    a: "Each handoff between agents is a typed, versioned contract. IncomingOrder (Seller → Interpreter) carries the raw request and payment context. StructuredBrief (Interpreter → Composer) is the execution plan. EnrichmentRequest (Seller → Buyer) documents exactly what knowledge gap the Buyer should fill. ComposedReport (Composer → Seller) is the finished artifact ready for packaging. These contracts include schemaVersion, jobId, and traceId for replayability.",
  },
  {
    q: "What format does the output come in?",
    a: "Deliverables are returned as structured documents with sections, headings, and source citations. You can copy the full text to clipboard or download it as a .md (Markdown) file directly from the Studio. Markdown renders cleanly in Notion, GitHub, Obsidian, and most editors.",
  },
  {
    q: "What happens when I type a short or vague request?",
    a: "If your request is under 40 characters and you're in Pipeline or Interpreter mode, the Strategist runs a brief quality pre-check first. If it detects your intent is ambiguous, a Clarification Dialog appears with 1–2 targeted questions before the pipeline runs. Answering them appends context to your request automatically — so the Interpreter builds a more precise brief. You can always skip and run immediately.",
  },
  {
    q: "What is the Artifact Library?",
    a: "Every successful run is saved to your browser's local storage as an artifact — including the prompt, mode, title, credit cost, source count, and whether enrichment was used. Open the Library panel (the 'library' button in the Studio toolbar) to browse your run history, restore a previous prompt to the input, or re-run it instantly. Nothing is sent to a server — it's purely local and private.",
  },
  {
    q: "What does 2-pass Composer mean?",
    a: "The Composer (Researcher agent) now runs two LLM passes instead of one. Pass 1 builds a structured outline — specific section headings and key claims per section, guided by your brief. Pass 2 expands each section with full evidence synthesis from the web sources retrieved. This produces much higher quality reports with consistent structure, proper section flow, and explicit source attribution. The Sponsor Rail shows a '◈ 2-pass synthesis' badge when both passes ran.",
  },
  {
    q: "How long does a request actually take?",
    a: "A Research Sprint (1cr) typically finishes in 45–90 seconds with the Composer agent only. The Full Pipeline — Interpreter → Composer → optional Buyer → Seller packaging — takes 3–7 minutes depending on web scraping speed and model response time. The Studio shows live stage progress (Intake → Interpreting → Composing → Enriching → Packaging) so you always know what's happening.",
  },
  {
    q: "What should I do with the deliverable once I have it?",
    a: "Copy or download it as Markdown and paste it into your doc, note-taking app, or codebase. Research Sprints make great starting points for blog posts, pitch decks, or product specs. Planning Packs give you a ready-to-execute task structure. Design Specs can go straight to an engineer or Figma.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const num = String(index + 1).padStart(2, "0");

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
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-all duration-150"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
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
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>007 / FAQ</span>
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
          Common questions.
        </h2>
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
