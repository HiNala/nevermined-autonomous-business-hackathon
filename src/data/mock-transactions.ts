import {
  StudioAgent,
  StudioService,
} from "@/types";

export const STUDIO_SERVICES: StudioService[] = [
  {
    id: "research-sprint",
    name: "Research Sprint",
    credits: 1,
    turnaround: "~2 min",
    summary: "Fast competitor, docs, or market scan sourced from live web inputs.",
    outcomes: [
      "Top takeaways",
      "Source links",
      "Immediate next moves",
    ],
  },
  {
    id: "planning-pack",
    name: "Planning Pack",
    credits: 5,
    turnaround: "~5 min",
    summary: "Structured product plan with scope, milestones, risks, and launch checklist.",
    outcomes: [
      "Feature brief",
      "Execution plan",
      "Delivery priorities",
    ],
  },
  {
    id: "design-spec",
    name: "Frontend Design Spec",
    credits: 10,
    turnaround: "~8 min",
    summary: "High-signal UI direction with sections, copy, states, and implementation cues.",
    outcomes: [
      "Page structure",
      "Component directions",
      "Visual system notes",
    ],
  },
];

export const STUDIO_AGENTS: StudioAgent[] = [
  {
    id: "agent-strategist",
    name: "INTERPRETER",
    specialty: "Intent Structuring",
    summary: "Converts a vague request into a precise execution brief — objective, scope, search plan, required sections, and delivery format. Every pipeline starts here.",
    outputs: ["Execution brief", "Search plan", "Scope & sections", "Delivery spec"],
    accentColor: "#7C3AED",
    ctaLabel: "Structure a brief",
    startingCredits: 1,
    stats: {
      totalSales: 28,
      repeatBuyers: 6,
      totalCreditsEarned: 72,
    },
    primary: true,
  },
  {
    id: "agent-researcher",
    name: "COMPOSER",
    specialty: "Document Creation",
    summary: "Takes the Interpreter's brief, searches and scrapes the web, synthesizes multiple sources, and composes the final structured report artifact.",
    outputs: ["Research report", "Source citations", "Structured sections", "Key findings"],
    accentColor: "#0EA5E9",
    ctaLabel: "Compose a report",
    startingCredits: 1,
    stats: {
      totalSales: 34,
      repeatBuyers: 8,
      totalCreditsEarned: 118,
    },
  },
  {
    id: "agent-buyer",
    name: "BUYER",
    specialty: "Enrichment Procurement",
    summary: "Optional enrichment stage. Purchases third-party data and reports from the Nevermined marketplace when the Composer identifies a knowledge gap.",
    outputs: ["Purchased datasets", "External reports", "Marketplace assets"],
    accentColor: "#F59E0B",
    ctaLabel: "Browse marketplace",
    startingCredits: 5,
    stats: {
      totalSales: 12,
      repeatBuyers: 3,
      totalCreditsEarned: 64,
    },
  },
  {
    id: "agent-seller",
    name: "SELLER",
    specialty: "Intake & Delivery",
    summary: "Commerce boundary and final packaging layer. Accepts orders, owns the x402 transaction, and delivers the finished artifact as a branded, export-ready deliverable.",
    outputs: ["Delivery package", "Branded report", "Export formats", "Quality gate"],
    accentColor: "#EF4444",
    ctaLabel: "View store",
    startingCredits: 0,
    stats: {
      totalSales: 8,
      repeatBuyers: 2,
      totalCreditsEarned: 96,
    },
  },
  {
    id: "agent-vision",
    name: "VISION",
    specialty: "Image Generation",
    summary: "Generates a hero image for every research report using NanoBanana (Gemini). Runs an iterative quality loop — up to 3 attempts — scoring each image before accepting it.",
    outputs: ["Hero image", "Quality score", "Prompt log", "16:9 visual"],
    accentColor: "#CA8A04",
    ctaLabel: "Run pipeline",
    startingCredits: 1,
    stats: {
      totalSales: 0,
      repeatBuyers: 0,
      totalCreditsEarned: 0,
    },
  },
];

